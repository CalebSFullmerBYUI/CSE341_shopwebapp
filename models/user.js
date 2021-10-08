const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    addresses: [{
        address: String,
        city: String,
        state: String,
        country: String
    }],
    cart: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },
        itemQuantity: Number
    }]
});

module.exports = mongoose.model('User', userSchema);