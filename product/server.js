require("dotenv").config();
const app=require("./src/app");
require("./src/configs/mongoose");
const http=require("http");

const server=http.createServer(app);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`👍 Product microservice is running on port http://localhost:${PORT}`);
});