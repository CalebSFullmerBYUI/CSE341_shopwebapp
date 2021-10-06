const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const databaseConnect = require("./utils/database").databaseConnect;

const app = express();
const routes = require("./routes/routes");

app.set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs")
    .use(bodyParser({ extended: false }))
    .use("/", routes);

databaseConnect(client => {
    console.log(client);
    app.listen(process.env.PORT || 5000, () => {
        console.log("Listening for input.");
    });
});