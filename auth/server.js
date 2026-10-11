require("dotenv").config();
const app=require("./src/app");
const mongoose=require("./src/configs/mongoose");
const http=require("http");
const server=http.createServer(app);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`👍 Auth microservice is running on port http://localhost:${PORT}`);
});