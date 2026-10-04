    const mongoose=require("mongoose");
    const bcrypt=require("bcrypt");

    const userSchema=new mongoose.Schema({
        username:{
            type:String,
            unique:true,
        },
        name:String,
        email:
        {
            type:String,
            unique:true,
        },
        role:
        {
            type:String,
            enum:["CUSTOMER","SELLER","ADMIN"],
            default:"CUSTOMER",
        },
        password:{
            type:String
        },
        isBlocked:Boolean,
        addresses:[{
            type:mongoose.Schema.ObjectId,
            ref:"address",
        }]
    },
    {
        timestamps:true,
    });

    userSchema.pre("save",async function () {
        if(this.isModified("password"))
        {
            const hashed=await bcrypt.hash(this.password,10);
            this.password=hashed;
        }
        return;
    })

    userSchema.methods.checkPassword=async function (pass) {
        return bcrypt.compare(pass,this.password);
    };

    module.exports=mongoose.model("user",userSchema);