const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const { search } = require("../routes/routes");
const product = require("../models/product");

let productsSearch = [];
let previousSearch = "";

const makeProductId = (productName) => {
    return productName + Math.floor((Math.random() * 1000000000)); 
}

exports.loadSearchPage = (req, res, next) => {
    if (productsSearch.length == 0 && previousSearch == "") {
        Product.find().then(products => {
            res.render("pages/products-search", {
                title: "Search",
                products: products,
                user: req.user,
                cart: false
            });
        });
    } else {
        res.render("pages/products-search", {
            title: "Search",
            products: productsSearch,
            user: req.user,
            cart: false
        });
    }
}

exports.loadEditPage = (req, res, next) => {
    if (req.params.productId) {
        // Edit product page
        Product.findById(req.params.productId)
            .then(product => {
                res.render("pages/edit-product", {
                    title: "Edit Product",
                    product: product
                });
            })
            .catch(err => {
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
            })
        });
    }
}

exports.loadCartPage = (req, res, next) => {
    let cartIdArr = [];

    for (item of req.user.cart) {
        cartIdArr.push(item._id);
    }

    Product.find({"_id": {$in: cartIdArr}}).then(products => {
        res.render("pages/cart", {
            title: "Cart",
            products: products,
            user: req.user,
            cart: true
        });
    }).catch(err => {
        console.log("Issue loading cart. " + err);
    });
}

exports.loadOrdersPage = (req, res, next) => {
    Order.find({"user": req.user._id}).then(orders => {
        res.render("pages/orders", {
            title: "Orders",
            orders: orders,
        });
    }).catch(err => {
        console.log("Issue loading orders. " + err);
    });
}

exports.editProduct = (req, res, next) => {
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
            .then()
            .catch(err => {
                console.log("Issue saving product. ID: " + req.params.productId + " " + err);
            });
        }).catch(err => {
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
        .then()
        .catch(err => {
            console.log("Issue saving new product. " + err);
        });
    }

    res.redirect("/");
}

exports.removeProduct = (req, res, next) => {
    console.log("Removing product with _id " + req.params.productId);
    Product.findByIdAndRemove(req.params.productId)
        .catch(err => {
            console.log("Failed to remove product with _id " + req.params.productId + ". " + err);
        });
    res.redirect("/");
}

exports.searchProducts = (req, res, next) => {
    productsSearch = [];
    previousSearch = req.body.searchQuery;

    Product.find({$or: [
            {name: {$regex: req.body.searchQuery, $options: 'i'}},
            {tags: {$regex: req.body.searchQuery, $options: 'i'}}
        ]
    }).then(products => {
        productsSearch = products;
        res.redirect("/search");
    }).catch(err => {
        console.log("Issue running product search. " + err );
    });
}

exports.addToCart = (req, res, next) => {
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
                    req.user.save();
                } else {
                    // Add new
                    req.user.cart.push({
                        _id: product._id,
                        itemQuantity: quantity
                    });
                    req.user.save();
                }
            }
        })
        .catch(err => {
            console.log("Failed to add product with _id " + req.params.productId + " to cart. " + err);
        });
    res.redirect("/");
}

exports.removeFromCart = (req, res, next) => {
    console.log("Removing from cart product with _id " + req.params.productId);
        if (req.user)
        {
            let oldItemIndex = req.user.cart.findIndex(item => {return item._id.toString() == req.params.productId; });
            if (oldItemIndex > -1) {
                // If the item already exists, just increase the quatnity by 1.
                req.user.cart.splice(oldItemIndex, 1);
                req.user.save();
            } else {
                console.log("No item with id " + req.params.productId + " found in cart for user " + req.user._id);
            }
        }
    res.redirect("/");
}

exports.checkoutCart = (req, res, next) => {
    console.log("Checking out cart for user");

    let cartIdArr = []

    for (item of req.user.cart) {
        cartIdArr.push(item._id);
    }

    Product.find({"_id": {$in: cartIdArr}}).then(products => {
        let totalPrice = 0;
        let totalItems = 0;

        for (item of products) {
            let productWithQuantity = req.user.cart.find(cartItem => {return cartItem._id.toString() == item._id});
            if (!productWithQuantity) { console.log("Error checking out cart, could not match quantity to price."); }
            totalItems += productWithQuantity.itemQuantity;
            totalPrice += item.price * productWithQuantity.itemQuantity;
        }

        if (req.user) {
            let newOrder = new Order({
                datePlaced: new Date(),
                shippingCost: 0,
                totalCost: totalPrice.toFixed(2),
                totalItems: totalItems,
                canceled: false,
                user: req.user._id,
                address: null,
                items: req.user.cart
            });
    
            newOrder.save();
    
            // Reset user cart
            req.user.cart = [];
            req.user.save();
        }
    }).catch(err => {
        console.log("Issue checkingout cart. " + err);
    });

    res.redirect("/");
}