require("dotenv").config();

const express = require("express");
const server = require("express-http-proxy");
const app = express();

const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3003";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3004";

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "gateway" });
});

// Proxy routes
app.use("/auth", server(AUTH_SERVICE_URL));
app.use("/product", server(PRODUCT_SERVICE_URL));
app.use("/cart", server(CART_SERVICE_URL));
app.use("/order", server(ORDER_SERVICE_URL));

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on Gateway` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Gateway error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Gateway error" });
});

app.listen(PORT, () => {
    console.log(`👍 Gateway is running on port http://localhost:${PORT}`);
});