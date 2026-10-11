require("dotenv").config();
const app=require("./src/app");
require("./src/configs/mongoose");
const http=require("http");

const server=http.createServer(app);

server.listen(process.env.PORT,()=>{
    console.log(`👍 Order microservice is running on port http://localhost:${process.env.PORT}`);
})