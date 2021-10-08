const express = require("express");
const productsControl = require("../controllers/products-control");
const router = express.Router();

router.get("/", (req, res, next) => {
    res.render("pages/home", {
        title: "Home Page"
    })
});

router.get("/search", productsControl.loadSearchPage);

router.post("/search", productsControl.searchProducts);

router.get("/add-product", productsControl.loadEditPage);

router.get("/edit-product/:productId", productsControl.loadEditPage);

router.post("/add-product", productsControl.editProduct);

router.post("/edit-product/:productId", productsControl.editProduct);

router.post("/remove-product/:productId", productsControl.removeProduct);

router.post("/add-to-cart/:productId", productsControl.addToCart);

router.post("/remove-from-cart/:productId", productsControl.removeFromCart);

router.get("/cart", productsControl.loadCartPage);

router.post("/checkout", productsControl.checkoutCart);

router.get("/orders", productsControl.loadOrdersPage);

module.exports = router;