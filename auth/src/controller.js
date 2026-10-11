const userModel = require("./models/user.model");
const addressModel = require("./models/address.model");
const jwt = require("jsonwebtoken");
const redis = require("./configs/redis");

function formatUserResponse(user) {
    return {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

async function register(req, res) {
    try {
        const { username, name, email, password, role } = req.body;
        const user = await userModel.create({
            name, username, password, email, role
        });

        const token = jwt.sign({
            username: user.username, email: user.email, role: user.role, id: user._id
        }, process.env.JWT);

        await redis.set(`token${user._id}`, token, "EX", 600);

        res.cookie("token", token, { httpOnly: true });

        res.status(201).json({
            success: true,
            message: "user created",
            user: formatUserResponse(user)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function login(req, res) {
    try {
        const { username, email, password } = req.body;
        let user;
        if (username) user = await userModel.findOne({ username });
        else if (email) user = await userModel.findOne({ email });

        if (!user) return res.status(404).json({ success: false, message: "NO USER FOUND" });

        if (!(await user.checkPassword(password))) {
            return res.status(401).json({ success: false, message: "wrong password" });
        }

        const token = jwt.sign({
            username: user.username,
            email: user.email,
            role: user.role,
            id: user._id
        }, process.env.JWT);

        await redis.set(`token${user._id}`, token, "EX", 600);

        res.cookie("token", token, { httpOnly: true });
        res.status(200).json({
            success: true,
            message: "user logged in",
            user: formatUserResponse(user)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function profile(req, res) {
    const decoded = req.user;
    return res.status(200).json({ success: true, decoded });
}

async function logout(req, res) {
    try {
        const user = req.user;
        const id = user.id;
        await redis.del(`token${id}`);
        res.clearCookie("token");
        return res.status(200).json({ success: true, message: "user logged out" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function changePassword(req, res) {
    try {
        const data = req.user;
        const { password, newpassword } = req.body;
        if (!password || !newpassword) {
            return res.status(400).json({ success: false, message: "provide both current and new password" });
        }
        if (password === newpassword) {
            return res.status(400).json({ success: false, message: "passwords must be different" });
        }
        const user = await userModel.findOne({ username: data.username });
        if (!user) return res.status(404).json({ success: false, message: "user not found, login again" });
        if (!(await user.checkPassword(password))) {
            return res.status(401).json({ success: false, message: "wrong password" });
        }
        user.password = newpassword;
        await user.save();
        return res.status(200).json({ success: true, message: "password changed" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function add_address(req, res) {
    try {
        const user = req.user;
        const { tag, pincode, city, state, country } = req.body;
        if (!tag || !pincode || !city || !state || !country) {
            return res.status(400).json({ success: false, message: "provide all details" });
        }
        const temp = await addressModel.findOne({ tag, user: user.id });
        if (temp) return res.status(409).json({ success: false, message: "use different tag" });
        const address = await addressModel.create({
            user: user.id, tag, pincode, state, country, city
        });
        return res.status(201).json({ success: true, message: "address created", address });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function find_address(req, res) {
    try {
        const user = req.user;
        const tag = req.params?.tag;
        const address = await addressModel.findOne({ tag, user: user.id });
        if (!address) return res.status(404).json({ success: false, message: "no address found" });
        return res.status(200).json({
            success: true,
            message: "address found",
            address,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function delete_address(req, res) {
    try {
        const user = req.user;
        const tag = req.params?.tag;
        const address = await addressModel.findOneAndDelete({ tag, user: user.id });
        if (!address) return res.status(404).json({ success: false, message: "no address found" });
        return res.status(200).json({
            success: true,
            message: "address deleted",
            address,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function update(req, res) {
    try {
        const { email, username, name } = req.body || {};
        const decoded = req.user;
        if (!name && !username && !email) {
            return res.status(400).json({ success: false, message: "provide valid details to update" });
        }
        const user = await userModel.findOne({ email: decoded.email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (name) user.name = name;
        if (email && email !== user.email) {
            const temp = await userModel.findOne({ email });
            if (temp) return res.status(409).json({ success: false, message: "email is already in use with another account" });
            user.email = email;
        }
        if (username && username !== user.username) {
            const temp = await userModel.findOne({ username });
            if (temp) return res.status(409).json({ success: false, message: "username is already in use with another account" });
            user.username = username;
        }
        await user.save();
        return res.status(200).json({
            success: true,
            message: "details updated",
            user: formatUserResponse(user),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getAddress(req, res) {
    try {
        const { user, tag } = req.params;
        const address = await addressModel.findOne({ user, tag });
        if (!address) return res.status(404).json({ found: false, message: "address not found" });
        return res.status(200).json({ found: true, address });
    } catch (err) {
        return res.status(500).json({ found: false, message: err.message });
    }
}

module.exports = { register, login, logout, profile, changePassword, add_address, find_address, delete_address, update, getAddress };