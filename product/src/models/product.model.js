const mongoose=require("mongoose");


const productSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
    },
    name:{
        type:String,
        index:true,
    },
    stock:{
        type:Number,
        min:0,
    },
    price:{
        type:Number,
        min:0,
    },
    category:{
        type:[String],
        index:true,
    }
},{timestamps:true});

module.exports=mongoose.model("product",productSchema);