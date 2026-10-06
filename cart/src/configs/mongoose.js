const mongoose=require("mongoose");
mongoose.connect(process.env.MONGO);

const db=mongoose.connection;

db.on("error",(err)=>{
    console.log(`🚫 Mongo connection failed : ${err}`)
})

db.once("open", () => {
    console.log(`✅ MongoDB Connected at auth server at port ${process.env.PORT}`);
});

module.exports=db;