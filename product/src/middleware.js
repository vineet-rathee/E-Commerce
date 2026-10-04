const productModel=require("./models/product.model");
const axios=require("axios");

async function verifySeller(req,res,next) {
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
    if(req.user.role==="CUSTOMER") return res.status(401).json({message:"user not authorised to use this service"});
    next();
}


module.exports={verifySeller};