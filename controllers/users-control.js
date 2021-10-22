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

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: ""
    }
}));


// Login
exports.loadLoginPage = (req, res, next) => {
    let previousForm = req.session.previousForm;
    req.session.previousForm = {};

    if (req.session && req.session.isLoggedIn) {
        req.flash("generalError", "Already logged in.");
        res.redirect(req.session.previousSearch);
    } else {
        res.render("pages/login", {
            title: "Log-in",
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("loginError"),
            productSearch: req.session.productSearch,
            previousForm: previousForm,
            csrfT: req.csrfToken() // Add this input to all incoming forms <input type="hidden" name="_csrf" value="<%= csrfT %>">
        });
    }
}

exports.checkLogin = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "login",
        usernameOrEmail: req.body.usernameOrEmail.trim(),
        userPass: req.body.userPass.trim()
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("loginError", errors.array()[0].msg);
        res.redirect("/login");
    } else if (req.session && req.session.isLoggedIn) {
        req.flash("generalError", "Already logged in.");
        res.redirect(req.session.previousSearch)
    } else {
        User.findOne({$or: [
            {username: req.body.usernameOrEmail.trim()},
            {email: req.body.usernameOrEmail.trim()}
        ]})
        .then(user => {
            if (!user) {
                // User not defined.
                req.flash("loginError", "Invalid email/username.");
                res.redirect("/login");
            } else {
                bcrypt.compare(req.body.userPass.trim(), user.password)
                    .then(doMatch => {
                        if (!doMatch) {
                            // Incorrect password entered.
                            req.flash("loginError", "Invalid password.");
                            res.redirect("/login");
                        } else {
                            req.session.user = user;
                            req.session.isLoggedIn = true;
                            res.redirect(req.session.previousSearch);
                        }
                    })
                    .catch(err => {
                        console.log("Issue comparing passwords on login. " + err);
                        res.redirect("/login");
                    });
            }
        })
        .catch(err => {
            req.flash("loginError", "Issue checking email/username.");
            console.log("Issue getting user. " + err);
            res.redirect("/login");
        });
    }
}

exports.loadSignupPage = (req, res, next) => {
    let previousForm = req.session.previousForm;
    req.session.previousForm = {};

    if (req.session && req.session.isLoggedIn) {
        req.flash("generalError", "Already logged in.");
        res.redirect(req.session.previousSearch)
    } else {
        res.render("pages/signup", {
            title: "Sign-Up",
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("signupError"),
            productSearch: req.session.productSearch,
            previousForm: previousForm,
            csrfT: req.csrfToken()
        });
    }
}

exports.signupUser = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "signup",
        newName: req.body.newName,
        newUsername: req.body.newUsername,
        userEmail: req.body.userEmail,
        userPass: req.body.userPass
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("signupError", errors.array()[0].msg);
        res.redirect("/signup");
    } else if (req.session && req.session.isLoggedIn) {
        req.flash("generalError", "Already logged in.");
        res.redirect(req.session.previousSearch)
    } else {

        User.findOne({$or: [
            {email: req.body.userEmail.trim()},
            {username: req.body.newUsername.trim()}
        ]}).then(userDocument => {
        if (userDocument) {
            // User with given username or email already exists.
            req.flash("signupError", "Username or Email already taken.");
            return res.redirect("/signup");
        } else {
            bcrypt.hash(req.body.userPass.trim(), 12).then(hash => {
                    let newUser = new User({
                        name: req.body.newName.trim(),
                        email: req.body.userEmail.trim(),
                        username: req.body.newUsername.trim(),
                        password: hash,
                        isAdmin: false,
                        addresses: [],
                        cart: []
                    });
    
                    newUser.save().then(result => {
                        transporter.sendMail({
                            to: req.body.userEmail.trim(),
                            from: "calebsf@byui.edu",
                            subject: "Signup Confermation",
                            html: "<p>You signed up.</p>"
                        }).catch(err => {
                            console.log("Could not send new signup email for email " + req.body.userEmail.trim() + err);
                        });
                        res.redirect("/login");
                    });
                }).catch(err => {
                    req.flash("signupError", "Error: Could not complete sign-up process.");
                    res.redirect("/signup");
                    console.log("Issue hashing password on sign-up. " + err);
                });
            }
        }).catch(err => {
            req.flash("signupError", "Error: Could not complete sign-up process.");
            res.redirect("/signup");
            console.log("Issue while signing up. " + err);
        });
    }
}

exports.logoutUser = (req, res, next) => {
    if (req.session) {
        req.session.destroy(() => {
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
}



// Reset Info
exports.loadResetInfoPage = (req, res, next) => {
    let previousForm = req.session.previousForm;
    req.session.previousForm = {};

    if (req.session && req.session.isLoggedIn && req.user) {
        req.session.previousSearch = req.url;
        let urlSplit = req.url.split('/'); // Expect url to end with /password, /username, or /email
        let resetType = urlSplit[urlSplit.length - 1];
        urlSplit = resetType.split('?');
        resetType = urlSplit[0];
        
        res.render("pages/reset-info", {
            title: "Reset " + resetType,
            resetType: resetType,
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("resetError"),
            productSearch: req.session.productSearch,
            previousForm: previousForm,
            csrfT: req.csrfToken() // Add this input to all incoming forms <input type="hidden" name="_csrf" value="<%= csrfT %>">
        });
    } else {
        req.flash("generalError", "User not recognized, cannot reset information.");
        res.redirect(req.session.previousSearch);
    }

    
    // Reset previousForm
    req.session.previousForm = {};
}

exports.resetPassword = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "resetPass",
        newPass: req.body.newPass,
        oldPassword: req.body.oldPassword
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("resetError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else {
        bcrypt.compare(req.body.oldPassword.trim(), req.user.password)
        .then(doMatch => {
            if (!doMatch) {
                // Incorrect password entered.
                req.flash("resetError", "Old password does not match user records.");
                res.redirect(req.session.previousSearch);
            } else {
                bcrypt.hash(req.body.newPass.trim(), 12).then(hash => {
                    req.user.password = hash;
                    req.user.save()
                    .then(result => {
                        req.session.previousForm = {};
                        res.redirect("/profile");
                    })
                    .catch(err => {
                        req.flash("resetError", "Issue saving new password.");
                        console.log("Issue saving new password on password reset. " + err);
                        res.redirect(req.session.previousSearch);
                    });
                }).catch(err => {
                    req.flash("resetError", "Issue saving new password.");
                    res.redirect(req.session.previousSearch);
                    console.log("Issue hashing password on password change. " + err);
                });
            }
        })
        .catch(err => {
            console.log("Issue comparing passwords on password reset. " + err);
            res.redirect(req.session.previousSearch);
        });
    }
}

exports.resetUsername = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "resetUsername",
        newUsername: req.body.newUsername,
        oldPassword: req.body.oldPassword
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("resetError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else {
        bcrypt.compare(req.body.oldPassword.trim(), req.user.password)
        .then(doMatch => {
            if (!doMatch) {
                // Incorrect password entered.
                req.flash("resetError", "Password does not match user records.");
                res.redirect(req.session.previousSearch);
            } else {
                req.user.username = req.body.newUsername.trim();
                req.user.save()
                .then(result => {
                    req.session.previousForm = {};
                    res.redirect("/profile");
                })
                .catch(err => {
                    req.flash("resetError", "Issue saving new username.");
                    console.log("Issue saving new username on username reset. " + err);
                    res.redirect(req.session.previousSearch);
                });
            }
        })
        .catch(err => {
            req.flash("resetError", "Issue saving new username.");
            console.log("Issue comparing passwords on username reset. " + err);
            res.redirect(req.session.previousSearch);
        });
    }
}

exports.resetEmail = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "resetEmail",
        newEmail: req.body.newEmail,
        oldPassword: req.body.oldPassword
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("resetError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else {
        bcrypt.compare(req.body.oldPassword.trim(), req.user.password)
        .then(doMatch => {
            if (!doMatch) {
                // Incorrect password entered.
                req.flash("resetError", "Password does not match user records.");
                res.redirect(req.session.previousSearch);
            } else {
                req.user.email = req.body.newEmail.trim();
                req.user.save()
                .then(result => {
                    req.session.previousForm = {};
                    res.redirect("/profile");
                })
                .catch(err => {
                    req.flash("resetError", "Issue saving new email.");
                    console.log("Issue saving new email on email reset. " + err);
                    res.redirect(req.session.previousSearch);
                });
            }
        })
        .catch(err => {
            console.log("Issue comparing passwords on email reset. " + err);
            res.redirect(req.session.previousSearch);
        });
    }
}



// Cart
exports.loadCartPage = (req, res, next) => {
    req.session.previousSearch = req.url;
    if (req.session && req.session.isLoggedIn) {
        let cartIdArr = [];

        for (item of req.user.cart) {
            cartIdArr.push(item._id);
        }

        Product.find({"_id": {$in: cartIdArr}}).then(products => {
            res.render("pages/cart", {
                title: "Cart",
                products: products,
                user: req.user,
                cart: true,
                isLoggedIn: req.session.isLoggedIn,
                isAdmin: (req.user && req.user.isAdmin),
                errorMessage: req.flash("generalError"),
                productSearch: req.session.productSearch,
                csrfT: req.csrfToken()
            });
        }).catch(err => {
            req.flash("generalError", "Issue loading cart.");
            res.redirect("/");
            console.log("Issue loading cart. " + err);
        });
    } else {
        // Need to log in
        res.redirect("/login");
    }
}

exports.loadOrdersPage = (req, res, next) => {
    req.session.previousSearch = req.url;
    if (req.session && req.session.isLoggedIn) {
        Order.find({"user": req.user._id}).then(orders => {
            res.render("pages/orders", {
                title: "Orders",
                orders: orders,
                isLoggedIn: req.session.isLoggedIn,
                isAdmin: (req.user && req.user.isAdmin),
                errorMessage: req.flash("generalError"),
                productSearch: req.session.productSearch,
                csrfT: req.csrfToken()
            });
        }).catch(err => {
            req.flash("generalError", "Issue loading orders.");
            res.redirect("/");
            console.log("Issue loading orders. " + err);
        });
    } else {
        // Must log-in to see that page
        res.redirect("/login");
    }
}

exports.addToCart = (req, res, next) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("generalError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else if (req.session && req.session.isLoggedIn) {
        console.log("Adding to cart product with _id " + req.params.productId);
        Product.findById(req.params.productId)
            .then(product => {
                if (req.user)
                {
                    let quantity = parseInt(req.body.quantity);
                    let oldItemIndex = req.user.cart.findIndex(item => {return item._id.toString() == product._id; });
                    if (oldItemIndex > -1) {
                        // If the item already exists, just increase the quatnity by 1.
                        req.user.cart[oldItemIndex].itemQuantity = quantity;
                        req.user.save()
                            .then(result => {
                                res.redirect(req.session.previousSearch);
                            });
                    } else {
                        // Add new
                        req.user.cart.push({
                            _id: product._id,
                            itemQuantity: quantity
                        });
                        req.user.save()
                            .then(result => {
                                res.redirect(req.session.previousSearch);
                            });
                    }
                }
            })
            .catch(err => {
                req.flash("generalError", "Issue updating cart.");
                res.redirect(req.session.previousSearch);
                console.log("Failed to add product with _id " + req.params.productId + " to cart. " + err);
            });
    } else {
        // Must be loged-in to access this.
        res.redirect("/login");
    }
}

exports.removeFromCart = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        console.log("Removing from cart product with _id " + req.params.productId);
            if (req.user)
            {
                let oldItemIndex = req.user.cart.findIndex(item => {return item._id.toString() == req.params.productId; });
                if (oldItemIndex > -1) {
                    // If the item already exists, just increase the quatnity by 1.
                    req.user.cart.splice(oldItemIndex, 1);
                    req.user.save()
                    .then(result => {
                        res.redirect(req.session.previousSearch);
                    })
                    .catch(err => {
                        req.flash("generalError", "Issue removing item from cart.");
                        res.redirect(req.session.previousSearch);
                    });
                } else {
                    console.log("No item with id " + req.params.productId + " found in cart for user " + req.user._id);
                }
            }
    } else {
        // Must be loged-in to access this.
        res.redirect("/login");
    }
}

exports.checkoutCart = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        console.log("Checking out cart for user");

        let cartIdArr = []

        for (item of req.user.cart) {
            cartIdArr.push(item._id);
        }

        Product.find({"_id": {$in: cartIdArr}}).then(products => {
            let totalPrice = 0;
            let totalItems = 0;

            // Get total price
            for (item of products) {
                let productWithQuantity = req.user.cart.find(cartItem => {return cartItem._id.toString() == item._id});
                if (!productWithQuantity) { console.log("Error checking out cart, could not match quantity to price."); }
                totalItems += productWithQuantity.itemQuantity;
                totalPrice += item.price * productWithQuantity.itemQuantity;
            }

            
            if (req.user) {
                // Get address
                let addressIndex = req.user.addresses.findIndex(address => { return address._id == req.body.deliveryAddress; });
                if (addressIndex > -1) {
                    // Submit order
                    let newOrder = new Order({
                        datePlaced: new Date(),
                        shippingCost: 0,
                        totalCost: totalPrice.toFixed(2),
                        totalItems: totalItems,
                        canceled: false,
                        user: req.user._id,
                        items: req.user.cart
                    });

                    newOrder.address = req.user.addresses[addressIndex];
    
                    newOrder.save()
                        .then(result => {
                            // Reset user cart
                            req.user.cart = [];
                            req.user.save().then(result => {
                                res.redirect("/orders");
                            });
                        })
                        .catch(err => {
                            req.flash("generalError", "Issue placing order.");
                            res.redirect("/cart");
                        });
                } else {
                    req.flash("generalError", "Could not find address to use for checkout.");
                    console.log("Address with id " + req.body.deliveryAddress + " was not found for user " + req.user.id + ".");
                    res.redirect("/cart");
                }
            }
        }).catch(err => {
            req.flash("generalError", "Issue checking out cart.");
            res.redirect("/cart");
            console.log("Issue checkingout cart. " + err);
        });
    } else {
        // Must be logged-in to do this.
        res.redirect("/login");
    }
}



// Profile
exports.loadProfilePage = (req, res, next) => {
    if (req.session && req.session.isLoggedIn && req.user) {
        res.render("pages/profile", {
            title: "Profile",
            user: req.user,
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("loginError"),
            productSearch: req.session.productSearch,
            csrfT: req.csrfToken() // Add this input to all incoming forms <input type="hidden" name="_csrf" value="<%= csrfT %>">
        });
    } else {
        // Must be logged-in to access this page.
        res.redirect("/login");
    }
}

exports.loadProfilePage = (req, res, next) => {
    if (req.session && req.session.isLoggedIn && req.user) {
        res.render("pages/profile", {
            title: "Profile",
            user: req.user,
            isLoggedIn: req.session.isLoggedIn,
            isAdmin: (req.user && req.user.isAdmin),
            errorMessage: req.flash("loginError"),
            productSearch: req.session.productSearch,
            csrfT: req.csrfToken() // Add this input to all incoming forms <input type="hidden" name="_csrf" value="<%= csrfT %>">
        });
    } else {
        // Must be logged-in to access this page.
        res.redirect("/login");
    }
}

exports.loadAddressPage = (req, res, next) => {
    let previousForm = req.session.previousForm;
    req.session.previousForm = {};

    if (req.session && req.session.isLoggedIn && req.user) {
        req.session.previousSearch = req.url;
        if (req.params.addressId) {
            // Edit address page
            let addressIndex = req.user.addresses.findIndex(address => { return address._id == req.params.addressId; });

            if (addressIndex > -1) {
                res.render("pages/edit-address", {
                    title: "Edit Address",
                    address: req.user.addresses[addressIndex],
                    isLoggedIn: req.session.isLoggedIn,
                    isAdmin: (req.user && req.user.isAdmin),
                    errorMessage: req.flash("generalError"),
                    productSearch: req.session.productSearch,
                    previousForm: previousForm,
                    csrfT: req.csrfToken()
                });
            } else {
                req.flash("generalError", "Could not find address to edit.");
                console.log("Address with id " + req.params.addressId + " was not found for user " + req.user.id + ".");
                res.redirect("/profile");
            }
        } else {
            // Add address page
            res.render("pages/edit-address", {
                title: "Add Address",
                address: {
                    address: "",
                    city: "",
                    state: "",
                    country: ""
                },
                isLoggedIn: req.session.isLoggedIn,
                isAdmin: (req.user && req.user.isAdmin),
                errorMessage: req.flash("generalError"),
                productSearch: req.session.productSearch,
                previousForm: previousForm,
                csrfT: req.csrfToken()
            });
        }
    } else {
        // Must be logged-in to access this.
        res.redirect("/login");
    }

    // Reset previousForm
    req.session.previousForm = {};
}

exports.editAddress = (req, res, next) => {
    let errors = validationResult(req);

    req.session.previousForm = {
        name: "editAddress",
        addressLine1: req.body.addressLine1,
        addressCity: req.body.addressCity,
        addressState: req.body.addressState,
        addressCountry: req.body.addressCountry
    }

    if (!errors.isEmpty()) {
        // There were input validation errors.
        req.flash("generalError", errors.array()[0].msg);
        res.redirect(req.session.previousSearch);
    } else if (req.session && req.session.isLoggedIn && req.user) {
        req.body.addressLine1 = req.body.addressLine1.trim();
        req.body.addressCity = req.body.addressCity.trim();
        req.body.addressState = req.body.addressState.trim();
        req.body.addressCountry = req.body.addressCountry.trim();

        if (req.params.addressId) {
            // Edit address
            let addressIndex = req.user.addresses.findIndex(address => { return address._id == req.params.addressId; });

            if (addressIndex > -1) {
                req.user.addresses[addressIndex] = {
                    address: req.body.addressLine1,
                    city: req.body.addressCity,
                    state: req.body.addressState,
                    country: req.body.addressCountry
                };
            } else {
                req.session.previousForm = {};
                req.flash("generalError", "Could not find address to edit.");
                console.log("Address with id " + req.params.addressId + " was not found for user " + req.user.id + ".");
                res.redirect("/profile");
            }
        } else {
            // Create new product
            req.user.addresses.push({
                address: req.body.addressLine1,
                city: req.body.addressCity,
                state: req.body.addressState,
                country: req.body.addressCountry
            });
        }

        req.session.previousForm = {};

        req.user.save()
            .then(result => {
                res.redirect("/profile");
            })
            .catch(err => {
                req.flash("generalError", "Could not save new address.");
                res.redirect("/profile");
            });
    } else if (req.session && req.session.isLoggedIn) {
        req.session.previousForm = {};
        // User not allowed
        req.flash("generalError", "Only admins can edit and add products.");
        res.redirect("/");
    } else {
        req.session.previousForm = {};
        // Must sign in to admin account.
        res.redirect("/login");
    }
}

exports.removeAddress = (req, res, next) => {
    let addressIndex = req.user.addresses.findIndex(address => { return address._id == req.params.addressId; });

    if (addressIndex > -1) {
        req.user.addresses.splice(addressIndex, 1);

        req.user.save()
            .then(result => {
                res.redirect("/profile");
            })
            .catch(err => {
                req.flash("generalError", "Unable to remove address");
                res.redirect("/profile");
            });
    } else {
        req.flash("generalError", "Could not find address to remove.");
        console.log("Address with id " + req.params.addressId + " was not found for user " + req.user.id + ".");
        res.redirect("/profile");
    }
}