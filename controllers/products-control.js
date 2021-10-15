const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const { search } = require("../routes/routes");
const product = require("../models/product");
const user = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");


const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}));

let productsSearch = [];
let previousSearch = "";

const makeProductId = (productName) => {
    return productName + Math.floor((Math.random() * 1000000000)); 
}

exports.loadSearchPage = (req, res, next) => {
    req.session.previousSearch = req.url;
    if (productsSearch.length == 0 && previousSearch == "") {
        Product.find().then(products => {
            res.render("pages/products-search", {
                title: "Search",
                products: products,
                user: req.user,
                cart: false,
                isLoggedIn: req.session.isLoggedIn,
                isAdmin: (req.user && req.user.isAdmin),
                errorMessage: req.flash("generalError"),
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
            products: productsSearch,
            user: req.user,
            cart: false,
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("generalError"),
            csrfT: req.csrfToken()
        });
    }
}

exports.loadEditPage = (req, res, next) => {
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
    if (req.user && req.user.isAdmin) {
        req.body.productName = req.body.productName.trim();
        req.body.productPrice = req.body.productPrice.trim();

        let newName = (req.body.productName != "" ? req.body.productName : "[-- NO NAME --]");
        let newPrice = (req.body.productPrice > 0 ? req.body.productPrice : 0);

        if (req.params.productId) {
            // Edit product
            Product.findById(req.params.productId).then(product => {
                product.name = newName;
                product.price = newPrice;
                product.description = req.body.productDescription.trim();
                product.pictureURL = req.body.pictureURL.trim();
    
                product.save()
                .then(result => {
                    res.redirect("/");
                })
                .catch(err => {
                    req.flash("generalError", "Issue saving changes to product.");
                    res.redirect(req.session.previousSearch);
                    console.log("Issue saving product. ID: " + req.params.productId + " " + err);
                });
            }).catch(err => {
                req.flash("generalError", "Issue getting product.");
                res.redirect("/");
                console.log("Issue getting product to update. ID: " + req.params.productId + " " + err);
            });
        } else {
            // Create new product
            let newProduct = new Product({
                name: newName,
                productID: makeProductId(newName),
                price: newPrice,
                description: req.body.productDescription.trim(),
                specifications: [],
                pictureURL: req.body.pictureURL.trim(),
                tags: []
            });

            newProduct.save()
            .then(result => {
                res.redirect("/");
            })
            .catch(err => {
                req.flash("generalError", "Could not save new product.");
                res.redirect(req.session.previousSearch);
                console.log("Issue saving new product. " + err);
            });
        }
    } else if (req.session && req.session.isLoggedIn) {
        // User not allowed
        req.flash("generalError", "Only admins can edit and add products.");
        res.redirect("/");
    } else {
        // Must sign in to admin account.
        res.redirect("/login");
    }
}

exports.removeProduct = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        console.log("Removing product with _id " + req.params.productId);
        Product.findByIdAndRemove(req.params.productId)
            .then(result => {
                productsSearch = [];
                res.redirect(req.session.previousSearch);
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
    productsSearch = [];

    Product.find({$or: [
            {name: {$regex: req.body.searchQuery, $options: 'i'}},
            {tags: {$regex: req.body.searchQuery, $options: 'i'}}
        ]
    }).then(products => {
        previousSearch = req.body.searchQuery;
        productsSearch = products;
        res.redirect("/search");
    }).catch(err => {
        req.flash("generalError", "Issue performing search.");
        res.redirect(req.session.previousSearch);
        console.log("Issue running product search. " + err );
    });
}