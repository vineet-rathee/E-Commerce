const express=require("express");
const cookie=require("cookie-parser");
const app=express();

app.use(express.json());
app.use(cookie());
app.use(express.urlencoded({extended:true}));

const router=require("./router");
app.use("/",router);

module.exports=app;