const productModel = require("./models/product.model");

function parseCategory(cat) {
    if (!cat) return [];
    if (Array.isArray(cat)) return cat;
    if (typeof cat === "string") {
        try {
            const parsed = JSON.parse(cat);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            return cat.split(",").map(c => c.trim()).filter(Boolean);
        }
    }
    return [cat];
}

async function addProduct(req, res) {
    try {
        let { name, stock, price, category } = req.body;
        if (!name || stock === undefined || price === undefined || !category) {
            return res.status(400).json({ success: false, message: "provide all details (name, stock, price, category)" });
        }
        price = parseFloat(price);
        stock = parseInt(stock);
        category = parseCategory(category);

        if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
            return res.status(400).json({ success: false, message: "stock and price cannot be negative" });
        }
        if (category.length === 0) {
            return res.status(400).json({ success: false, message: "category must not be empty" });
        }

        const user = req.user;
        const temp = await productModel.findOne({ user: user.id, name });
        if (temp) {
            return res.status(409).json({ success: false, message: "product with same name already exists with logged in seller" });
        }

        const product = await productModel.create({
            user: user.id, name, price, stock, category,
        });

        return res.status(201).json({
            success: true,
            message: "product created",
            product,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteProduct(req, res) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "provide product name" });
        const user = req.user;
        const product = await productModel.findOneAndDelete({ user: user.id, name });
        if (!product) return res.status(404).json({ success: false, message: "product not found" });

        return res.status(200).json({
            success: true,
            message: "product deleted",
            product,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function findName(req, res) {
    try {
        const name = req.params.name;
        if (!name) return res.status(400).json({ success: false, message: "provide name" });
        const products = await productModel.find({ name });
        return res.status(200).json({ success: true, found: products.length > 0, products });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function findCategory(req, res) {
    try {
        let category = req.query.category || req.body?.category;
        if (!category) return res.status(400).json({ success: false, message: "provide category in query (?category=...) or body" });
        const catArray = parseCategory(category);
        const products = await productModel.find({ category: { $all: catArray } });
        return res.status(200).json({ success: true, found: products.length > 0, products });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function findUser(req, res) {
    try {
        const id = req.params.id;
        if (!id) return res.status(400).json({ success: false, message: "provide user id" });
        const products = await productModel.find({ user: id });
        return res.status(200).json({ success: true, found: products.length > 0, products });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function findProduct(req, res) {
    try {
        const id = req.params.id;
        if (!id) return res.status(400).json({ success: false, message: "provide product id" });
        const product = await productModel.findOne({ _id: id });
        if (!product) return res.status(404).json({ success: false, found: false, message: "product not found" });
        return res.status(200).json({ success: true, found: true, product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateStock(req, res) {
    try {
        const user = req.user;
        const id = req.params.id;
        const stock = parseInt(req.body.stock);
        if (isNaN(stock) || stock < 0 || !id) {
            return res.status(400).json({ success: false, message: "provide valid non-negative stock and id" });
        }
        const product = await productModel.findOne({ _id: id, user: user.id });
        if (!product) return res.status(404).json({ success: false, message: "no product found for logged in seller" });
        product.stock = stock;
        await product.save();
        return res.status(200).json({ success: true, message: "stock updated", product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updatePrice(req, res) {
    try {
        const user = req.user;
        const id = req.params.id;
        const price = parseFloat(req.body.price);
        if (isNaN(price) || price < 0 || !id) {
            return res.status(400).json({ success: false, message: "provide valid non-negative price and id" });
        }
        const product = await productModel.findOne({ _id: id, user: user.id });
        if (!product) return res.status(404).json({ success: false, message: "no product found for logged in seller" });
        product.price = price;
        await product.save();
        return res.status(200).json({ success: true, message: "price updated", product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function reduceStock(req, res) {
    try {
        const id = req.params.id;
        let { amount } = req.body;
        amount = parseInt(amount);
        if (!id || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid id and positive amount required" });
        }

        const product = await productModel.findOneAndUpdate(
            { _id: id, stock: { $gte: amount } },
            { $inc: { stock: -amount } },
            { new: true }
        );

        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock or product not found"
            });
        }

        return res.status(200).json({ success: true, message: "Stock reduced successfully", product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function restoreStock(req, res) {
    try {
        const id = req.params.id;
        let { amount } = req.body;
        amount = parseInt(amount);
        if (!id || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid id and positive amount required" });
        }

        const product = await productModel.findByIdAndUpdate(
            id,
            { $inc: { stock: amount } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.status(200).json({ success: true, message: "Stock restored successfully", product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    addProduct,
    deleteProduct,
    findName,
    findCategory,
    findUser,
    findProduct,
    updateStock,
    updatePrice,
    reduceStock,
    restoreStock
};