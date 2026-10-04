const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
    console.log(`✅ Redis Connected at auth server at port ${process.env.PORT}`);
});

redis.on("error", (err) => {
    console.log("❌ Redis error:", err);
});

module.exports = redis;