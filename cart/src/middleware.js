const axios = require("axios");

function extractToken(req) {
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization) {
        const header = req.headers.authorization;
        if (header.startsWith("Bearer ")) {
            token = header.split(" ")[1];
        }
    }
    return token;
}

async function verifyUser(req, res, next) {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, message: "no token found, verification failed" });

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001/profile";
        const response = await axios.get(
            authUrl,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        req.user = response.data?.decoded;
        req.token = token;
        next();
    } catch (err) {
        console.error("Cart auth communication error:", err.response?.data || err.message);
        return res.status(502).json({ success: false, message: "error occurred while communicating with auth service" });
    }
}

async function getProduct(req, res, next) {
    let { id, amount } = req.body;
    amount = parseInt(amount);

    // If amount is 0, user wants to remove product, no need to check stock
    if (amount === 0) {
        return next();
    }

    if (!id || isNaN(amount) || amount < 0) {
        return res.status(400).json({ success: false, message: "provide valid product id and amount" });
    }

    try {
        const productUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
        const response = await axios.get(`${productUrl}/find/product/${id}`);
        const data = response.data;
        if (!data || data.found === false || !data.product) {
            return res.status(404).json({ success: false, message: "no product found" });
        }
        const stock = data.product.stock;
        if (stock < amount) {
            return res.status(409).json({
                success: false,
                message: `not enough amount in stock. Available: ${stock}, requested: ${amount}`
            });
        }
        req.product = data.product;
        next();
    } catch (err) {
        console.error("Cart product communication error:", err.response?.data || err.message);
        return res.status(502).json({
            success: false,
            message: "error occurred while communicating with product service",
            error: err.response?.data || err.message
        });
    }
}

module.exports = { verifyUser, getProduct };