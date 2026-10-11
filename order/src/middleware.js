const axios=require("axios");

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

async function verifyUser(req, res, next) {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, message: "Authentication required, please log in" });

    try {
        const response = await axios.get(
            process.env.AUTH_SERVICE_URL || "http://localhost:3001/profile",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        req.user = response.data.decoded;
        req.token = token;
        next();
    } catch (err) {
        console.error("Auth verification error:", err.response?.data || err.message);
        return res.status(401).json({ success: false, message: "Authentication failed, invalid or expired session" });
    }
}

async function getCart(req, res, next) {
    const token = req.token || extractToken(req);
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

    try {
        const response = await axios.get(
            process.env.CART_SERVICE_URL || "http://localhost:3003/",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        );
        if (!response.data || !response.data.found) {
            return res.status(404).json({ success: false, message: "No cart found" });
        }
        const products = response.data.products;
        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty. Add products before creating an order" });
        }
        if (!req.user && response.data.user) {
            req.user = response.data.user;
        }
        req.products = products;
        next();
    } catch (err) {
        console.error("Cart service error:", err.response?.data || err.message);
        return res.status(502).json({ success: false, message: "Error communicating with Cart service" });
    }
}

async function getAddress(req, res, next) {
    const { tag, phone } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: "User not authenticated" });
    if (!tag) return res.status(400).json({ success: false, message: "Please provide the address tag" });

    try {
        const authUrl = process.env.AUTH_SERVICE_URL ? process.env.AUTH_SERVICE_URL.replace(/\/profile$/, "") : "http://localhost:3001";
        const response = await axios.get(
            `${authUrl}/address/${user.id}/${tag}`
        );
        if (!response.data || !response.data.found || !response.data.address) {
            return res.status(404).json({ success: false, message: `Address with tag '${tag}' not found` });
        }
        const addr = response.data.address;
        req.address = {
            tag: addr.tag,
            pincode: addr.pincode,
            city: addr.city,
            state: addr.state,
            country: addr.country,
            phone: phone ? Number(phone) : undefined
        };
        next();
    } catch (err) {
        console.error("Address service error:", err.response?.data || err.message);
        return res.status(502).json({ success: false, message: "Error communicating with Auth address service" });
    }
}

function verifyAdminOrSeller(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (req.user.role !== "ADMIN" && req.user.role !== "SELLER") {
        return res.status(403).json({ success: false, message: "Access forbidden: Requires Admin or Seller role" });
    }
    next();
}

module.exports = { verifyUser, getCart, getAddress, verifyAdminOrSeller };