const cartModel = require("./models/cart.model");

async function addProduct(req, res) {
    try {
        const user = req.user;
        let { id, amount } = req.body;
        amount = parseInt(amount);
        if (!id || isNaN(amount) || amount < 0) {
            return res.status(400).json({ success: false, message: "provide valid product id and non-negative amount" });
        }

        let cart = await cartModel.findOne({ user: user.id });
        if (!cart) cart = await cartModel.create({ user: user.id, products: [] });

        const index = cart.products.findIndex(
            item => item.product.toString() === id.toString()
        );

        if (amount === 0) {
            if (index !== -1) cart.products.splice(index, 1);
        } else if (index !== -1) {
            cart.products[index].quantity = amount;
        } else {
            cart.products.push({ product: id, quantity: amount });
        }

        await cart.save();
        return res.status(200).json({
            success: true,
            message: amount === 0 ? "product removed from cart" : "added to cart",
            cart
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteCart(req, res) {
    try {
        const user = req.user;
        const cart = await cartModel.findOneAndDelete({ user: user.id });
        return res.status(200).json({ success: true, message: "cart cleared successfully", cart });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteProduct(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const cart = await cartModel.findOne({ user: user.id });
        if (!cart) return res.status(404).json({ success: false, message: "no cart found to delete product from" });

        const index = cart.products.findIndex(item => item.product.toString() === id.toString());
        if (index === -1) {
            return res.status(404).json({ success: false, message: "product not found in cart" });
        }

        cart.products.splice(index, 1);
        await cart.save();
        return res.status(200).json({ success: true, message: "product removed from cart", cart });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getCart(req, res) {
    try {
        const user = req.user;
        let cart = await cartModel.findOne({ user: user.id });
        if (!cart) cart = await cartModel.create({ user: user.id, products: [] });
        return res.status(200).json({
            success: true,
            found: true,
            products: cart.products,
            user
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { addProduct, deleteCart, deleteProduct, getCart };