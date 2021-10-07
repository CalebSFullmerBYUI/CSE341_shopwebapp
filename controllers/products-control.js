const Product = require("../models/product");
const { search } = require("../routes/routes");

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
                products: products
            });
        });
    } else {
        res.render("pages/products-search", {
            title: "Search",
            products: productsSearch
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
    
    /*products => {
        let searchTerm = req.body.searchQuery.toLowerCase();

        for (product of products) {
            if (product.name && product.name.toLowerCase().search(searchTerm) != -1) {
                foundItems.push(product);
            } else {
                for (tag of product.tags) {
                    if (tag.toLowerCase() == searchTerm) {
                        foundItems.push(product);
                        break;
                    }
                }
            }
        }

        productsSearch = foundItems;

        res.redirect("/search");
    }*/
}