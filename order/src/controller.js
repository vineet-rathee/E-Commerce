const orderModel = require("./models/order.model");
const axios = require("axios");

async function createOrder(req, res) {
    try {
        const user = req.user;
        const productsInCart = req.products;
        const address = req.address;
        const token = req.token;

        if (!productsInCart || productsInCart.length === 0) {
            return res.status(400).json({ success: false, message: "Cart has no items to order" });
        }

        const productUrl = "http://localhost:3002";
        const orderProducts = [];
        const reducedStockItems = [];

        for (const item of productsInCart) {
            const productId = item.product.toString();
            const requestedQuantity = item.quantity;

            let productResponse;
            try {
                productResponse = await axios.get(`${productUrl}/find/product/${productId}`);
            } catch (err) {
                await rollbackStock(reducedStockItems, productUrl);
                return res.status(404).json({
                    success: false,
                    message: `Product ${productId} could not be found or product service is unavailable`
                });
            }

            const productData = productResponse.data?.product;
            if (!productData) {
                await rollbackStock(reducedStockItems, productUrl);
                return res.status(404).json({ success: false, message: `Product ${productId} not found` });
            }

            if (productData.stock < requestedQuantity) {
                await rollbackStock(reducedStockItems, productUrl);
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product '${productData.name}'. Requested: ${requestedQuantity}, Available: ${productData.stock}`
                });
            }

            try {
                const reduceRes = await axios.patch(`${productUrl}/reduceStock/${productId}`, {
                    amount: requestedQuantity
                });
                if (!reduceRes.data?.success) {
                    await rollbackStock(reducedStockItems, productUrl);
                    return res.status(400).json({
                        success: false,
                        message: `Failed to reserve stock for '${productData.name}'`
                    });
                }
                reducedStockItems.push({ productId, amount: requestedQuantity });
            } catch (err) {
                await rollbackStock(reducedStockItems, productUrl);
                return res.status(400).json({
                    success: false,
                    message: `Could not reserve stock for '${productData.name}': ${err.response?.data?.message || err.message}`
                });
            }

            orderProducts.push({
                product_id: productData._id,
                name: productData.name,
                stock: requestedQuantity,
                price: productData.price
            });
        }

        const newOrder = new orderModel({
            user: user.id,
            products: orderProducts,
            address: address,
            status: "PLACED"
        });

        await newOrder.calculatePrice();
        await newOrder.save();

        const cartUrl ="http://localhost:3003";
        try {
            await axios.delete(`${cartUrl}/deleteCart`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (err) {
            console.error("Failed to clear cart after placing order:", err.response?.data || err.message);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: newOrder
        });

    } catch (err) {
        console.error("Order creation failed:", err);
        return res.status(500).json({ success: false, message: "Internal server error creating order", error: err.message });
    }
}

async function rollbackStock(items, productUrl) {
    for (const item of items) {
        try {
            await axios.patch(`${productUrl}/restoreStock/${item.productId}`, { amount: item.amount });
        } catch (err) {
            console.error(`Failed to rollback stock for product ${item.productId}:`, err.message);
        }
    }
}

async function getMyOrders(req, res) {
    try {
        const user = req.user;
        const orders = await orderModel.find({ user: user.id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching orders", error: err.message });
    }
}

async function getOrderById(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;

        const query = user.role === "ADMIN" ? { _id: id } : { _id: id, user: user.id };
        const order = await orderModel.findOne(query);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, order });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching order", error: err.message });
    }
}

async function cancelOrder(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;

        const order = await orderModel.findOne({ _id: id, user: user.id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === "CANCELLED") {
            return res.status(400).json({ success: false, message: "Order is already cancelled" });
        }

        if (order.status === "SHIPPED" || order.status === "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel an order that is already ${order.status.toLowerCase()}`
            });
        }

        order.status = "CANCELLED";
        await order.save();

        const productUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
        for (const item of order.products) {
            try {
                await axios.patch(`${productUrl}/restoreStock/${item.product_id}`, {
                    amount: item.stock
                });
            } catch (err) {
                console.error(`Failed to restore stock for product ${item.product_id}:`, err.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully and stock restored",
            order
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error cancelling order", error: err.message });
    }
}

async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["COMPLETED", "SHIPPED", "PLACED", "PENDING", "CANCELLED"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.status = status;
        await order.save();

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating order status", error: err.message });
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateStatus
};