const express=require("express");
const router=express.Router();

const middleware=require("./middleware");
const controller=require("./controller");

router.post("/create", middleware.verifyUser, middleware.getAddress, middleware.getCart, controller.createOrder);
router.get("/my-orders", middleware.verifyUser, controller.getMyOrders);
router.get("/:id", middleware.verifyUser, controller.getOrderById);
router.patch("/cancel/:id", middleware.verifyUser, controller.cancelOrder);

// Admin / Seller route
router.patch("/status/:id", middleware.verifyUser, middleware.verifyAdminOrSeller, controller.updateStatus);

module.exports=router;