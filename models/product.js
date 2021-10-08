const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: String,
    productID: String,
    price: Number,
    description: String,
    pictureURL: String,
    tags: [String]
});

module.exports = mongoose.model('Product', productSchema);



/*const fs = require("fs");
const path = require("path");
const getDb = require('../utils/database').getDb;
const mongodb = require("mongodb");

const ObjectId = mongodb.ObjectId;

const p = path.join(__dirname, "../products.json");

const getProductsFromFile = (cb) => {
    fs.readFile(p, (err, fileContent) => {
        if (!err) {
            cb(JSON.parse(fileContent));
        } else {
            console.log("Could not get products from file");
            cb([]);
        }
    });
}

const removeProductFromArray = (productsArray, id) => {
    let prodIndex = productsArray.findIndex(product => { return product.productID == id });
    if (prodIndex > -1) {
        productsArray.splice(prodIndex, 1);
    } else {
        console.log("removeProductFromArray: Could not find product with ID " + id);
    }
}

module.exports = class Product {
    constructor (name, id, price, description, specifications, pictureURL, tags) {
        this.name = name;
        this.productID = id;
        this.price = price;
        this.description = description;
        this.specifications = specifications;
        this.pictureURL = pictureURL;
        this.tags = tags;
    }

    addSpecification(specName, specdata) {
        this.specifications.push({
            specification: specName,
            data: specData
        });
    }

    removeSpecification(specName) {
        //this.specifications = this.specifications.splice();
        let specIndex = this.specifications.findIndex(spec => { return spec.name == specName });
        if (specIndex > -1) {
            this.specifications = this.specifications.splice(specIndex, 1);
        } else {
            console.log("could not find specification with name " + specName);
        }
    }

    save() {
        getProductsFromFile((products) => {
            removeProductFromArray(products, this.productID);
            products.push(this);
            fs.writeFile(p, JSON.stringify(products), (err) => {
                console.log("Issue saving product.\n" + err);
            });
        });
    }

    static removeProduct(id, cb) {
        getProductsFromFile(products => {
            removeProductFromArray(products, id);
            console.log(products);
            fs.writeFile(p, JSON.stringify(products), (err) => {
                console.log("Issue removing product.\n" + err);
            });

            cb();
        });
    }

    static getProduct(id, cb) {
        getProductsFromFile(products => {
            let prodIndex = products.findIndex(product => { return product.productID == id });
            if (prodIndex > -1) {
                cb(products[prodIndex]);
            } else {
                cb(new Product("", -1, 0, "", [], "", []));
                console.log("getProduct: Could not find product with ID " + id);
            }
        });
    }

    static getProducts(cb) {
        getProductsFromFile(cb);
    }
}*/