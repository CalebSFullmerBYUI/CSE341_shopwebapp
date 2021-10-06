const { getProducts } = require("../models/product");
const Product = require("../models/product");

let productsSearch = [];
let previousSearch = "";

const makeProductId = (productName) => {
    return productName + Math.floor((Math.random() * 1000000000)); 
}

exports.loadSearchPage = (req, res, next) => {
    if (productsSearch.length == 0 && previousSearch == "") {
        Product.getProducts(products => {
            res.render("pages/products-search", {
                title: "Search",
                products: products
            });
        });
    } else {
        Product.getProducts(products => {
            res.render("pages/products-search", {
                title: "Search",
                products: productsSearch
            });
        });
    }
}

exports.loadEditPage = (req, res, next) => {

    if (req.params.productId) {
        Product.getProduct(req.params.productId, product => {
            res.render("pages/edit-product", {
                title: "Edit Product",
                product: product
            });
        });
    } else {
        res.render("pages/edit-product", {
            title: "Add Product",
            product: new Product("", -1, 0, "", [], "", [])
        });
    }
}

exports.editProduct = (req, res, next) => {
    req.body.productName = req.body.productName.trim();
    req.body.productPrice = req.body.productPrice.trim();

    let newName = (req.body.productName != "" ? req.body.productName : "[-- NO NAME --]");
    let newPrice = (req.body.productPrice > 0 ? req.body.productPrice : 0);
    let newId = (req.params.productId && req.params.productId != "-1" ? req.params.productId : makeProductId(newName));

    let newProduct = new Product(newName, newId, newPrice,
        req.body.productDescription.trim(), [], req.body.pictureURL.trim(), []);

    newProduct.save()

    res.redirect("/");
}

exports.removeProduct = (req, res, next) => {
    console.log(req.params.productId);

    Product.removeProduct(req.params.productId, () => {
        res.redirect("/");
    });
}

exports.searchProducts = (req, res, next) => {
    Product.getProducts(products => {
        let searchTerm = req.body.searchQuery.toLowerCase();
        let foundItems = [];
        
        previousSearch = searchTerm;

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
    });
}