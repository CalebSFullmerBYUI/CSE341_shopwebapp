const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const { search } = require("../routes/routes");
const product = require("../models/product");
const user = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const makeProductId = (productName) => {
    return productName + Math.floor((Math.random() * 1000000000)); 
}

exports.loadSearchPage = (req, res, next) => {
    req.session.previousSearch = req.url;
    if (req.session.foundProducts == 0 && req.session.productSearch == "") {
        Product.find().then(products => {
            res.render("pages/products-search", {
                title: "Search",
                products: products,
                user: req.user,
                cart: false,
                isLoggedIn: req.session.isLoggedIn,
                isAdmin: (req.user && req.user.isAdmin),
                errorMessage: req.flash("generalError"),
                productSearch: req.session.productSearch,
                csrfT: req.csrfToken()
            });
        }).catch(err => {
            req.flash("generalError", "Issue loading search page.");
            res.redirect("/");
            console.log("Issue loading search page.");
        });
    } else {
        res.render("pages/products-search", {
            title: "Search",
            products: req.session.foundProducts,
            user: req.user,
            cart: false,
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("generalError"),
            productSearch: req.session.productSearch,
            csrfT: req.csrfToken()
        });
    }
}

exports.loadEditPage = (req, res, next) => {
    let previousForm = req.session.previousForm;
    req.session.previousForm = {};
    if (req.user && req.user.isAdmin) {
        req.session.previousSearch = req.url;
        if (req.params.productId) {
            // Edit product page
            Product.findById(req.params.productId)
                .then(product => {
                    res.render("pages/edit-product", {
                        title: "Edit Product",
                        product: product,
                        isLoggedIn: req.session.isLoggedIn,
                        isAdmin: (req.user && req.user.isAdmin),
                        errorMessage: req.flash("generalError"),
                        productSearch: req.session.productSearch,
                        previousForm: previousForm,
                        csrfT: req.csrfToken()
                    });
                })
                .catch(err => {
                    req.flash("generalError", "Issue loading edit page.");
                    res.redirect("/");
                    console.log("Issue loading edit page. " + err);
                });
        } else {
            // Add product page
            res.render("pages/edit-product", {
                title: "Add Product",
                product: new Product({
                    title: "",
                    productID: -1,
                    price: 0,
                    description: "",
                    specifications: [],
                    pictureURL: "",
                    tags: []
                }),
                isLoggedIn: req.session.isLoggedIn,
                isAdmin: (req.user && req.user.isAdmin),
                errorMessage: req.flash("generalError"),
                productSearch: req.session.productSearch,
                previousForm: previousForm,
                csrfT: req.csrfToken()
            });
        }
    } else if (req.session && req.session.isLoggedIn) {
        // Not allowed to access page.
        req.flash("generalError", "Only admins may add and edit products.");
        res.redirect(req.session.previousSearch);
    } else {
        // Need to loging with admin account.
        res.redirect("/login");
    }
}

exports.editProduct = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "editProduct",
        productName: req.body.productName.trim(),
        productPrice: req.body.productPrice,
        productDescription: req.body.productDescription.trim(),
        pictureURL: req.body.pictureURL.trim()
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("generalError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else if (req.user && req.user.isAdmin) {
        req.body.productName = req.body.productName.trim();

        let newName = (req.body.productName != "" ? req.body.productName : "[-- NO NAME --]");
        let newPrice = (req.body.productPrice > 0 ? req.body.productPrice : 0);

        if (req.params.productId) {
            // Edit product
            Product.findById(req.params.productId).then(product => {
                if (req.user._id.toString() == product.authorId.toString()) {
                    product.name = newName;
                    product.price = parseFloat(newPrice).toFixed(2);
                    product.description = req.body.productDescription.trim();
                    product.pictureURL = req.body.pictureURL.trim();
    
                    product.save()
                    .then(result => {
                        req.session.previousForm = {};
                        res.redirect("/");
                    })
                    .catch(err => {
                        req.flash("generalError", "Issue saving changes to product.");
                        res.redirect(req.session.previousSearch);
                        console.log("Issue saving product. ID: " + req.params.productId + " " + err);
                    });
                } else {
                    req.session.previousForm = {};
                    req.flash("generalError", "Only the creator of a product can edit it.");
                    res.redirect("/");
                }
            }).catch(err => {
                req.session.previousForm = {};
                req.flash("generalError", "Issue getting product.");
                res.redirect("/");
                console.log("Issue getting product to update. ID: " + req.params.productId + " " + err);
            });
        } else {
            // Create new product
            let newProduct = new Product({
                name: newName,
                productID: makeProductId(newName),
                price: parseFloat(newPrice).toFixed(2),
                description: req.body.productDescription.trim(),
                pictureURL: req.body.pictureURL.trim(),
                authorId: req.user._id
            });

            newProduct.save()
            .then(result => {
                req.session.previousForm = {};
                res.redirect("/");
            })
            .catch(err => {
                req.flash("generalError", "Could not save new product.");
                res.redirect(req.session.previousSearch);
                console.log("Issue saving new product. " + err);
            });
        }
    } else if (req.session && req.session.isLoggedIn) {
        req.session.previousForm = {};
        // User not allowed
        req.flash("generalError", "Only admins can edit and add products.");
        res.redirect("/");
    } else {
        // Must sign in to admin account.
        req.session.previousForm = {};
        res.redirect("/login");
    }
}

exports.removeProduct = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        console.log("Removing product with _id " + req.params.productId);
        Product.findById(req.params.productId)
        .then(product => {
            if (req.user._id.toString() == product.authorId.toString()) {
                Product.findByIdAndRemove(req.params.productId)
                .then(result => {
                    req.session.productsSearch = "";
                    req.session.foundProducts = [];
                    res.redirect(req.session.previousSearch);
                })
                .catch(err => {
                    req.flash("generalError", "Issue removing product.");
                    console.log("Failed to remove product with _id " + req.params.productId + ". " + err);
                });
            } else {
                req.flash("generalError", "Only the user who created a product can delete it.");
                res.redirect(req.session.previousSearch);
            }
        })
        .catch(err => {
            req.flash("generalError", "Issue removing product.");
            console.log("Failed to remove product with _id " + req.params.productId + ". " + err);
        });
    } else if (req.session && req.session.isLoggedIn) {
        // User not allowed
        req.flash("generalError", "Only admins can delete products.");
        res.redirect("/");
    } else {
        // User must sign in.
        res.redirect("/login");
    }
}

exports.searchProducts = (req, res, next) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("loginError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else {
        req.session.productSearch = req.body.searchQuery.trim();
        req.session.foundProducts = [];

        Product.find({name: {$regex: req.body.searchQuery.trim(), $options: 'i'}
        }).then(products => {
            req.session.foundProducts = products;
            res.redirect("/search");
        }).catch(err => {
            req.flash("generalError", "Issue performing search.");
            res.redirect(req.session.previousSearch);
            console.log("Issue running product search. " + err );
        });
    }
}