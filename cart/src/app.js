const express=require("express");
const app=express();
const cookie=require("cookie-parser");

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookie());

const router=require("./router");
app.use("/",router);

module.exports=app;