const productModel=require("./models/product.model");

async function addProduct(req,res) {
let {name,stock,price,category}=req.body;
    if(!name || !stock || !price || !category) return res.status(400).send("provide all details");
    price=parseInt(price);
    stock=parseInt(stock);
    category=JSON.parse(category);
    if(price<0 || stock<0) return res.status(400).send("stock or price can not be negative");
    const user=req.user;
    const temp=await productModel.findOne({user:user.id,name});
    if(temp) return res.status(400).send("product with same name already exists with logged in seller");
    const product=await productModel.create({
        user:user.id,name,price,stock,category,
    });
    res.status(201).json({
        message:"product created",
        product,
    });
}

async function deleteProduct(req,res) {
    const {name}=req.body;
    if(!name) return res.status(400).send("provide all details");
    const user=req.user;
    const product=await productModel.findOneAndDelete({user:user.id,name});
    res.status(200).json({
        message:"product deleted",
        product,
    })

}

async function findName(req,res) {
    const name=req.params.name;
    if(!name) return res.status(400).json({message:"provide name"});
    const products=await productModel.find({name});
    if(products.length==0) return res.status(200).json({found:false,product});
    res.status(200).json({found:true,products});
}

async function findCategory(req,res) {
    let {category}=req.body;
    if(!category) return res.status(400).json({found:false,message:"provide valid category"});
    category=JSON.parse(category);
    const product=await productModel.find({category:{$all:category}});
    if(product.length==0) return res.status(200).json({found:false,product});
    res.status(200).json({found:true,product});
}

async function findUser(req,res) {
    const id=req.params.id;
    if(!id) return res.status(400).json({found:false,message:"provide user id"});
    const product=await productModel.find({user:id});
    if(!product) return res.status(404).json({found:false,product});
    res.status(200).json({found:true,product});
}

async function findPorduct(req,res) {
    const id=req.params.id;
    if(!id) return res.status(400).json({found:false,message:"provide product id"});
    const product=await productModel.findOne({_id:id});
    if(!product) return res.status(404).json({found:false,product});
    res.status(200).json({found:true,product});
}

async function updateStock(req,res) {
    const user=req.user;
    const id=req.params.id;
    const stock=req.body.stock;
    if(!stock || !id) return res.status(400).send("provide all details");
    const product=await productModel.findOne({_id:id, user:user.id});
    if(!product) return res.status(400).send("no product found");
    product.stock=stock;
    product.save();
    res.status(200).json({message:"stock updated",product});
}

async function updatePrice(req,res) {
    const user=req.user;
    const id=req.params.id;
    const price=req.body.price;
    if(!price || !id) return res.status(400).send("provide all details");
    const product=await productModel.findOne({_id:id, user:user.id});
    if(!product) return res.status(400).send("no product found");
    product.price=price;
    product.save();
    res.status(200).json({message:"price updated",product}); 
}

module.exports={addProduct,deleteProduct,findName,findCategory,findUser,findPorduct,updateStock,updatePrice};