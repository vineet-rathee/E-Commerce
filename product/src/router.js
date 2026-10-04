const express=require("express");
const router=express.Router();

const middleware=require("./middleware");
const controller=require("./controller");

router.get("/find/name/:name",controller.findName);
router.get("/find/category",controller.findCategory);
router.get("/find/user/:id",controller.findUser);
router.get("/find/product/:id",controller.findPorduct);

router.post("/add",middleware.verifySeller,controller.addProduct);
router.delete("/delete",middleware.verifySeller,controller.deleteProduct);
router.patch("/updateStock/:id",middleware.verifySeller,controller.updateStock)
router.patch("/updatePrice/:id",middleware.verifySeller,controller.updatePrice);

module.exports=router;