const cartModel=require("./models/cart.model");

async function addProduct(req,res){
    const user=req.user;
    let {id,amount}=req.body;
    amount=parseInt(amount);
    let cart=await cartModel.findOne({user:user.id});
    if(!cart) cart=await cartModel.create({user:user.id});
    let entity={
        product:id,
        quantity:amount
    }
    const index=cart.products.findIndex(
        item=> item.product.toString()===id.toString()
    );
    if(amount===0)
    {
        if(index!==-1) cart.products.splice(index,1);
    }
    else if(index!==-1)
    {
        cart.products[index].quantity=amount;
    }
    else cart.products.push(entity);
    await cart.save();
    res.status(201).json({message:"added to cart",cart});
}

async function deleteCart(req,res) {
    const user=req.user;
    const cart=await cartModel.findOneAndDelete({user:user.id});
    res.status(200).json({message:"deleted",cart});
}

async function deleteProduct(req,res) {
    const user=req.user;
    const {id}=req.params;
    const cart=await cartModel.findOne({user:user.id});
    if(!cart) return res.status(400).send("no product found to delete");
    const index=cart.products.findIndex(item=>item.product.toString()===id.toString());
    if(index===-1) return res.status(400).send("no product found to delete");
    else cart.products.splice(index,1);
    await cart.save();
    return res.status(200).json({message:"deleted",cart});
}

async function getCart(req,res) {
    const user=req.user;
    let cart=await cartModel.findOne({user:user.id});
    if(!cart) cart=await cartModel.create({user:user.id});
    res.status(200).json({found:true,products:cart.products});
}

module.exports={addProduct,deleteCart,deleteProduct,getCart};