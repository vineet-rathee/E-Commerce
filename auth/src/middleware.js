const userModel=require("./models/user.model");
const jwt=require("jsonwebtoken");
const redis = require("./configs/redis");

async function register(req,res,next) {
    const {name,username,email,password,role}=req.body;
    if(!name || !username || !email || !password) return res.status(400).json({
        message:"provide all details to procced",
    })

    const find=await userModel.findOne({email,username});
    if(find)
    {
        return res.status(400).json({
            message:"user already exists with the username or email",
        })
    }
    next();
}

async function profile(req,res,next)
{
    try{
        const token=req.cookies.token;
        if(!token)return res.status(401).json({message: "Please login"});
        const decoded=jwt.verify(token,process.env.JWT);
        const redistoken = await redis.get(`token${decoded.id}`);
        if(redistoken!==token) return res.status(401).send("redis verification failed");
        req.user=decoded;
        next();
    }
    catch(err){ return res.status(401).json({message:"verification failed, log in again"})};
}

async function rateLimiter(req,res,next) {
    const ip=req.ip;
    const key=`rate${ip}`;
    let count= await redis.incr(key);
    if(count===1) await redis.expire(key,60);
    if(count>5) return res.status(429).send("too many request try after some time");
    next();
}

module.exports={register,profile,rateLimiter};