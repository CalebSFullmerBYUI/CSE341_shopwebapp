const express = require("express");
const productsControl = require("../controllers/products-control");
const usersControl = require("../controllers/users-control");
const router = express.Router();


router.get("/", (req, res, next) => {
    req.session.previousSearch = "/";
    res.render("pages/home", {
        title: "Home Page",
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: (req.user && req.user.isAdmin),
        errorMessage: req.flash("generalError"),
        csrfT: req.csrfToken()
    })
});


// usersControl
router.get("/login", usersControl.loadLoginPage);

router.post("/login", usersControl.checkLogin);

router.get("/signup", usersControl.loadSignupPage);

router.post("/signup", usersControl.signupUser);

router.post("/logout", usersControl.logoutUser);

router.get("/cart", usersControl.loadCartPage);

router.get("/orders", usersControl.loadOrdersPage);

router.post("/add-to-cart/:productId", usersControl.addToCart);

router.post("/remove-from-cart/:productId", usersControl.removeFromCart);

router.post("/checkout", usersControl.checkoutCart);

router.get("/profile", usersControl.loadProfilePage);

router.get("/add-address", usersControl.loadAddressPage);

router.get("/edit-address/:addressId", usersControl.loadAddressPage);

router.post("/add-address", usersControl.editAddress);

router.post("/edit-address/:addressId", usersControl.editAddress);

router.post("/remove-address/:addressId", usersControl.removeAddress);


// productsControl
router.get("/search", productsControl.loadSearchPage);

router.post("/search", productsControl.searchProducts);

router.get("/add-product", productsControl.loadEditPage);

router.get("/edit-product/:productId", productsControl.loadEditPage);

router.post("/add-product", productsControl.editProduct);

router.post("/edit-product/:productId", productsControl.editProduct);

router.post("/remove-product/:productId", productsControl.removeProduct);

module.exports = router;