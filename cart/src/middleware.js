const axios=require("axios");
const { addProduct } = require("./controller");

async function verifyUser(req,res,next){
    const token=req.cookies.token;
    if(!token) return res.status(401).send("no token found verification failed");
    try{
        const response=await axios.get(
            "http://localhost:3001/profile",
            {
                headers:
                {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        req.user=response.data.decoded;
    }
    catch(err)
    {
        console.log(err.response.data);
        return res.status(404).send("error occured while commmunicating with auth service");
    }
    next();
}

async function getProduct(req,res,next){
    let {id,amount}=req.body;
    if(!id || !amount) return res.status(400).send("provide full details");
    amount=parseInt(amount);
    if(amount<1) return res.status(400).send("amount should be greater than 0");
    try{
        const response=await axios.get(`http://localhost:3002/find/product/${id}`);
        const data=response.data;
        if(data.found===false) return res.status(404).send("no product found");
        let founded=data.product.stock;
        if(founded<amount) return res.status(409).send("not enough amount in stock");
        req.product=data.product;
        next();
    }
    catch(err)
    {
        return res.status(404).json({response:err.response.data});
    }
}

module.exports={verifyUser,getProduct};