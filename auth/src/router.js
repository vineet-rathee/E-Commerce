const express=require("express");
const router=express.Router();
const middleware=require("./middleware");
const controller=require("./controller");

//router.use(middleware.rateLimiter);
router.post("/register",middleware.register,controller.register);
router.get("/login",controller.login);
router.get("/profile",middleware.profile,controller.profile);
router.post("/logout",middleware.profile,controller.logout);
router.post("/changePassword",middleware.profile,controller.changePassword);
router.post("/address",middleware.profile,controller.add_address);
router.get("/address/:tag",middleware.profile,controller.find_address);
router.delete("/address/:tag",middleware.profile,controller.delete_address);
router.patch("/update",middleware.profile,controller.update);

module.exports=router;