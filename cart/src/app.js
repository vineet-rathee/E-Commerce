const express=require("express");
const app=express();
const cookie=require("cookie-parser");

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookie());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "cart" });
});

const router=require("./router");
app.use("/",router);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found in Cart service` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error("Cart Service Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error in Cart service"
    });
});

module.exports=app;