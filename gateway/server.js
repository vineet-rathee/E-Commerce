require("dotenv").config();

const express=require("express");
const server=require("express-http-proxy");
const app=express();

app.use("/auth",server("http://localhost:3001"));
app.use("/product",server("http://localhost:3002"));

app.listen(process.env.PORT,()=>{
    console.log(`👍 Gateway is running on port http://localhost:${process.env.PORT}`);
})