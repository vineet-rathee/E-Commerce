const mongoose=require("mongoose");

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
    },
    products:{
        type:[{
            product_id:mongoose.Schema.ObjectId,
            name:String,
            stock:{
                type:Number,
                min:1,
            },
            price:{
                type:Number,
                min:1,
            }
        }]
    },
    status:{
        type:String,
        enum:["COMPLETED","SHIPPED","PLACED","PENDING","CANCELLED"],
    },
    address:{
        type:{
            phone:Number,
            tag:String,
            pincode:Number,
            city:String,
            state:String,
            country:String,
        }
    },
    amount:
    {
        type:Number,
        default:0,
    },
},{timestamps:true});

orderSchema.methods.calculatePrice=async function () {
    let amount=0;
    for(let product of this.products) amount+=product.stock*product.price;
    this.amount=amount;
    return;
}

module.exports=mongoose.model("order",orderSchema);