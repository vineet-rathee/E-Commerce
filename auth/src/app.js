const express=require("express");
const cookie=require("cookie-parser");
const app=express();

app.use(express.json());
app.use(cookie());
app.use(express.urlencoded({extended:true}));

const authRoute=require("./router");

app.use("/",authRoute);

module.exports=app;