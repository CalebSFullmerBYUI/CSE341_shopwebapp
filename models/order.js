const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    datePlaced: Date,
    shippingCost: Number,
    totalCost: Number,
    totalItems: Number,
    canceled: Boolean,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    address: {
        _id: mongoose.Schema.Types.ObjectId,
        address: String,
        city: String,
        state: String,
        country: String
    },
    items: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },
        itemQuantity: Number
    }]
});

module.exports = mongoose.model('Order', orderSchema);