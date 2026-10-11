const express=require("express");
const cookie=require("cookie-parser");
const app=express();

app.use(express.json());
app.use(cookie());
app.use(express.urlencoded({extended:true}));

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "product" });
});

const router=require("./router");
app.use("/",router);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found in Product service` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error("Product Service Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error in Product service"
    });
});

module.exports=app;