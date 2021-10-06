const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const databaseConnect = (cb) => {
    MongoClient.connect("mongodb+srv://caleb_fullmer:4Eyl8GF5eE6PPZHv@cse341work.we99f.mongodb.net/Shop?retryWrites=true&w=majority")
        .then(result => {
            console.log("Connected to mongodb database.");
            _db = client.db();
            cb(result);
        })
        .catch(err => {
            console.log("Issue connecting to database. " + err);
            throw err;
        });
}

const getDb = () => {
    if (_db) {
        return _db;
    }

    console.log("No database found!");
}

exports.databaseConnect = databaseConnect;
exports.getDb = getDb;