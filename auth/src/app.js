const express=require("express");
const cookie=require("cookie-parser");
const app=express();

app.use(express.json());
app.use(cookie());
app.use(express.urlencoded({extended:true}));

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "auth" });
});

const authRoute = require("./router");
app.use("/", authRoute);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found in Auth service` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error("Auth Service Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error in Auth service"
    });
});

module.exports = app;