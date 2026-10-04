const userModel=require("./models/user.model");
const addressModel=require("./models/address.model");
const jwt=require("jsonwebtoken");
const redis = require("./configs/redis");

async function register(req,res) {
    const {username,name,email,password,role}=req.body;
    const user=await userModel.create({
        name,username,password,email,role
    });

    const token=jwt.sign({
        username,email,role,id:user._id
    },process.env.JWT);

    await redis.set(`token${user._id}`, token,"EX",600);

    res.cookie("token",token);

    res.status(201).json({
        message:"user created",
        user,
    })
}

async function login(req,res) {
    const {username,email,password}=req.body;
    let user;
    if(username) user=await userModel.findOne({username});
    else if(email) user=await userModel.findOne({email});
    if(!user) return res.status(400).json({message:"NO USER FOUND"});

    if(!(await user.checkPassword(password))) return res.status(400).json({message:"wrong password"});

    const token=jwt.sign({
        username:user.username,
        email:user.email,
        role:user.role,
        id:user._id
    },process.env.JWT);

    await redis.set(`token${user._id}`, token,"EX",600);

    res.cookie("token",token);
    res.status(200).json({message:"user logged in", user});
}

async function profile(req,res)
{
    const decoded=req.user;
    return res.status(200).json({decoded});
}

async function logout(req,res) {
    const user=req.user;
    const id=user.id;
    await redis.del(`token${id}`);
    res.clearCookie("token");
    return res.status(200).json({message:"user looged out"});
}

async function changePassword(req,res) {
    const data=req.user;
    const {password,newpassword}=req.body;
    if(password===newpassword) return res.status(400).send("passwords must be different");
    const user=await userModel.findOne({username:data.username});
    if(!user) res.status(400).send("user not found login again");
    if(!(await user.checkPassword(password))) return res.status(400).json({message:"wrong password"});
    user.password=newpassword;
    user.save();
    res.status(200).send("password changed");
}

async function add_address(req,res){
    const user=req.user;
    const {tag,pincode,city,state,country} =req.body;
    if(!tag || !pincode || !city || !state || !country) return res.status(400).send("provide all details");
    const temp=await addressModel.findOne({tag,user:user.id});
    if(temp) return res.status(400).send("use different tag");
    const address=await addressModel.create({
        user:user.id,tag,pincode,state,country,city
    });
    return res.status(201).json({message:"address created",address});
}

async function find_address(req,res) {
    const user=req.user;
    const tag=req.params?.tag;
    const address=await addressModel.find({tag,user:user.id});
    if(!address) return res.status(400).send("no address found");
    res.status(200).json({
        message:"address found",
        address,
    })
}

async function delete_address(req,res) {
    const user=req.user;
    const tag=req.params?.tag;
    const address=await addressModel.findOneAndDelete({tag,user:user.id});
    if(!address) return res.status(400).send("no address found");
    res.status(200).json({
        message:"address deleted",
        address,
    })
}

async function update(req,res) {
    const {email,username,name}=req.body||{};
    const decoded=req.user;
    if(!name && !username && !email) return res.status(400).send("provide valid details");
    const user=await userModel.findOne({email:decoded.email});
    if(!user) return res.status(404).send("User not found");
    if(name) user.name=name;
    if(email)
    {
        const temp=await userModel.findOne({email});
        if(!temp) user.email=email;
        else return res.status(401).send("email is already in use with another account");
    }
    if(username)
    {
        const temp=await userModel.findOne({username});
        if(!temp) user.username=username;
        else return res.status(401).send("username is already in use with another account");
    }
    user.save();
    res.status(200).json({
        message:"details updated",
        user,
    });
}
module.exports={register,login,logout,profile,changePassword,add_address,find_address,delete_address,update};