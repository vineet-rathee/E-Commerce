require("dotenv").config();
const app=require("./src/app");
require("./src/configs/mongoose");
const http=require("http");

const server=http.createServer(app);

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
    console.log(`👍 Cart microservice is running on port http://localhost:${PORT}`);
});