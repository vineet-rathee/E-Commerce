const userModel = require("./models/user.model");
const jwt = require("jsonwebtoken");
const redis = require("./configs/redis");

async function register(req, res, next) {
  const { name, username, email, password, role } = req.body;
  if (!name || !username || !email || !password)
    return res.status(400).json({
      message: "provide all details to procced",
    });

  const find = await userModel.findOne({ $or: [{ email }, { username }] });
  if (find) {
    return res.status(400).json({
      message: "user already exists with the username or email",
    });
  }
  next();
}

async function profile(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization) {
      const Header = req.headers.authorization;
      if (Header.startsWith("Bearer ")) {
        token = Header.split(" ")[1];
      }
    }
    if (!token)
      return res.status(401).json({ success: false, message: "Please login" });
    const decoded = jwt.verify(token, process.env.JWT);
    const redistoken = await redis.get(`token${decoded.id}`);
    if (redistoken !== token) {
      return res
        .status(401)
        .json({ success: false, message: "redis verification failed" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "verification failed, log in again" });
  }
}

async function rateLimiter(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate${ip}`;
    let count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > 5) {
      return res
        .status(429)
        .json({
          success: false,
          message: "too many requests, try after some time",
        });
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = { register, profile, rateLimiter };
