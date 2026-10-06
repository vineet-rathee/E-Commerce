const express=require("express");
const router=express.Router();

const middleware=require("./middleware");
const controller=require("./controller");

router.post("/add",middleware.verifyUser,middleware.getProduct,controller.addProduct);
router.delete("/delete/:id",middleware.verifyUser,controller.deleteProduct);
router.delete("/deleteCart",middleware.verifyUser,controller.deleteCart);
router.get("/",middleware.verifyUser,controller.getCart);

module.exports=router;
