const axios = require("axios");

function extractToken(req) {
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization) {
        const header = req.headers.authorization;
        if (header.startsWith("Bearer ")) {
            token = header.split(" ")[1];
        }
    }
    return token;
}

async function verifySeller(req, res, next) {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, message: "no token found, verification failed" });

    try {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001/profile";
        const response = await axios.get(
            authUrl,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        req.user = response.data?.decoded;
        req.token = token;
    } catch (err) {
        console.error("Product service auth communication error:", err.response?.data || err.message);
        return res.status(502).json({ success: false, message: "error occurred while communicating with auth service" });
    }

    if (!req.user || req.user.role === "CUSTOMER") {
        return res.status(403).json({ success: false, message: "user not authorized to perform seller operations" });
    }
    next();
}

module.exports = { verifySeller };