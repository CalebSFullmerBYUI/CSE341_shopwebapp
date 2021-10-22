const express = require("express");
const { body, check } = require("express-validator");
const productsControl = require("../controllers/products-control");
const usersControl = require("../controllers/users-control");
const Product = require("../models/product");
const router = express.Router();

// https://github.com/validatorjs/validator.js


router.get("/", (req, res, next) => {
    req.session.previousSearch = "/";


    Product.find().limit(5).then(products => {
        res.render("pages/home", {
            title: "Home Page",
            products: products,
            user: req.user,
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("generalError"),
            productSearch: req.session.productSearch,
            cart: false,
            csrfT: req.csrfToken()
        })
    }).catch(err => {
        req.flash("generalError", "Issue loading home page.");
        res.redirect("/");
        console.log("Issue loading home page.");
    });
});


// usersControl
router.get("/login", usersControl.loadLoginPage);

router.post("/login", [
        check("usernameOrEmail").isLength({min: 4, max: 30}).withMessage("Username must be between 4 and 30 characters.")
            .custom((value) => { return !value.match(/<|>|\s|"/); }).withMessage("Username cannot contain <, >, \", or spaces."),
        check("userPass").isLength({min: 12, max: 30}).withMessage("Password must be between 12 and 30 characters.")
            .custom((value) => {return !value.match(/<|>|\s|"/); }).withMessage("Password cannot contain <, >, \", or spaces.")
        ],
    usersControl.checkLogin);

router.get("/signup", usersControl.loadSignupPage);

router.post("/signup", [
        check("newName").custom((value) => { return value.trim().length >= 4 && value.trim().length <= 80; })
            .withMessage("Name must be between 1 and 80 characters. Name cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Name cannot contain <, >, or \"."),
        check("newUsername").isLength({min: 4, max: 30}).withMessage("Username must be between 4 and 30 characters.")
            .custom((value) => { return !value.match(/<|>|\s|"/); }).withMessage("Username cannot contain <, >, \", or spaces."),
        check("userEmail").isLength({min: 4, max: 60}).withMessage("Email must be between 4 and 60 characters.")
            .custom((value) => { return !value.match(/<|>|\s|"/); }).withMessage("Email cannot contain <, >, \", or spaces.")
            .isEmail().withMessage("Invalid email."),
        check("userPass").isLength({min: 12, max: 30}).withMessage("Password must be between 12 and 30 characters.")
            .custom((value) => {return !value.match(/<|>|\s|"/); }).withMessage("Password cannot contain <, >, \", or spaces.")
        ],
    usersControl.signupUser);

router.post("/logout", usersControl.logoutUser);

router.get("/cart", usersControl.loadCartPage);

router.get("/orders", usersControl.loadOrdersPage);

router.post("/add-to-cart/:productId",
        check("quantity").isInt({ min: 1, max: 500}).withMessage("Issue processing request. Invalid quantity. Can only have 500 items at once."),
    usersControl.addToCart);

router.post("/remove-from-cart/:productId", usersControl.removeFromCart);

router.post("/checkout", usersControl.checkoutCart);

router.get("/profile", usersControl.loadProfilePage);

router.get("/add-address", usersControl.loadAddressPage);

router.get("/edit-address/:addressId", usersControl.loadAddressPage);

router.post("/add-address", [
        check("addressLine1").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("Address must be between 3 and 100 characters. Address cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Address cannot contain <, >, or \"."),
        check("addressCity").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("City must be between 3 and 100 characters. City cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Username cannot contain <, >, or \"."),
        check("addressState").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("State must be between 3 and 100 characters. State cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("State cannot contain <, >, or \"."),
        check("addressCountry").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("Country must be between 3 and 100 characters. Country cannot start or end with a space.")
            .custom((value) => {return !value.match(/<|>|"/); }).withMessage("Country cannot contain <, >, or \".")
        ],
    usersControl.editAddress);

router.post("/edit-address/:addressId", [
        check("addressLine1").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("Address must be between 3 and 100 characters. Address cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Address cannot contain <, >, or \"."),
        check("addressCity").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("City must be between 3 and 100 characters. City cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Username cannot contain <, >, or \"."),
        check("addressState").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("State must be between 3 and 100 characters. State cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("State cannot contain <, >, or \"."),
        check("addressCountry").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("Country must be between 3 and 100 characters. Country cannot start or end with a space.")
            .custom((value) => {return !value.match(/<|>|"/); }).withMessage("Country cannot contain <, >, or \".")
        ],
    usersControl.editAddress);

router.post("/remove-address/:addressId", usersControl.removeAddress);

router.get("/reset-info/password", usersControl.loadResetInfoPage);

router.get("/reset-info/username", usersControl.loadResetInfoPage);

router.get("/reset-info/email", usersControl.loadResetInfoPage);

router.post("/reset-info/password", [
        check("newPass").isLength({min: 12, max: 30}).withMessage("New Password must be between 12 and 30 characters.")
            .custom((value) => { return !value.match(/<|>|\s|"/); }).withMessage("New Password cannot contain <, >, \", or spaces."),
        check("oldPassword").isLength({min: 12, max: 30}).withMessage("Old password is invalid.")
            .custom((value) => {return !value.match(/<|>|\s|"/); }).withMessage("Old password is invalid.")
        ],
    usersControl.resetPassword);

router.post("/reset-info/username", [
        check("newUsername").isLength({min: 4, max: 30}).withMessage("New Username must be between 4 and 30 characters.")
            .custom((value) => { return !value.match(/<|>|\s|"/); }).withMessage("New Username cannot contain <, >, \", or spaces."),
        check("oldPassword").isLength({min: 12, max: 30}).withMessage("Old password is invalid.")
            .custom((value) => {return !value.match(/<|>|\s|"/); }).withMessage("Old password is invalid.")
        ],
    usersControl.resetUsername);

router.post("/reset-info/email", [
        check("newEmail").isLength({min: 4, max: 60}).withMessage("New Email must be between 4 and 60 characters.")
            .custom((value) => { return !value.match(/<|>|\s|"/); }).withMessage("New Email cannot contain <, >, \", or spaces.")
            .isEmail().withMessage("Invalid email."),
        check("oldPassword").isLength({min: 12, max: 30}).withMessage("Old password is invalid.")
            .custom((value) => {return !value.match(/<|>|\s|"/); }).withMessage("Old password is invalid.")
        ],
    usersControl.resetEmail);


// productsControl
router.get("/search", productsControl.loadSearchPage);

router.post("/search", 
        check("searchQuery").replace(['<', '>', '"'], ''), // Remove >, <, and " from search string.
    productsControl.searchProducts);

router.get("/add-product", productsControl.loadEditPage);

router.get("/edit-product/:productId", productsControl.loadEditPage);

router.post("/add-product", [
        check("productName").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("Product name must be between 3 and 100 characters. Name cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Product name cannot contain <, >, or \"."),
        check("productPrice").isFloat({ min: 0, max: 10000}).withMessage("Product price cannot exceed $10,000"),
        check("productDescription").custom((value) => { return value.trim().length <= 4000; })
            .withMessage("Description cannot be more than 4000 characters.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("State cannot contain <, >, or \"."),
        check("pictureURL").custom((value) => { return value.trim().length <= 300; })
            .withMessage("Picture URL cannot be more than 300 characters.")
            .custom((value) => {return !value.match(/<|>|"/); }).withMessage("Picture URL cannot contain <, >, or \".")
        ],
    productsControl.editProduct);

router.post("/edit-product/:productId", [
        check("productName").custom((value) => { return value.trim().length >= 3 && value.trim().length <= 100; })
            .withMessage("Product name must be between 3 and 100 characters. Name cannot start or end with a space.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("Product name cannot contain <, >, or \"."),
        check("productPrice").isFloat({ min: 0, max: 10000}).withMessage("Product price cannot exceed $10,000"),
        check("productDescription").custom((value) => { return value.trim().length <= 4000; })
            .withMessage("Description cannot be more than 4000 characters.")
            .custom((value) => { return !value.match(/<|>|"/); }).withMessage("State cannot contain <, >, or \"."),
        check("pictureURL").custom((value) => { return value.trim().length <= 300; })
            .withMessage("Picture URL cannot be more than 300 characters.")
            .custom((value) => {return !value.match(/<|>|"/); }).withMessage("Picture URL cannot contain <, >, or \".")
        ],
    productsControl.editProduct);

router.post("/remove-product/:productId", productsControl.removeProduct);

router.use((req, res, next) => {
    req.session.previousSearch = "/";
        res.render("pages/404", {
        title: "404",
        user: req.user,
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: (req.user && req.user.isAdmin),
        errorMessage: req.flash("generalError"),
        productSearch: req.session.productSearch,
        unknownURL: req.url,
        csrfT: req.csrfToken()
    });
});


module.exports = router;