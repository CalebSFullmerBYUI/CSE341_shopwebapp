const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors") // Place this with other requires (like 'path' and 'express')

const User = require("./models/user");



const corsOptions = {
    origin: "https://calebf-cse341-shop.herokuapp.com/",
    optionsSuccessStatus: 200
};

const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    family: 4
};

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://Heroku_access:APRp2e11dnPMMSgv@cse341work.we99f.mongodb.net/shop?retryWrites=true&w=majority";



const app = express();
const routes = require("./routes/routes");

app.set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs")
    .use(cors(corsOptions))
    .use(bodyParser({ extended: false }))
    .use((req, res, next) => {
        User.findById("616064be01105a70ea5c3bcf")
            .then(user => {
                req.user = user;
                next();
            })
            .catch(err => {
                console.log("Issue getting user. " + err);
                next();
            });
    })
    .use("/", routes);

mongoose.connect(MONGODB_URL).then(result => {
    app.listen(process.env.PORT || 5000, () => {
        console.log("Listening for input.");
    });
}).catch(err=> {
    console.log(err);
});