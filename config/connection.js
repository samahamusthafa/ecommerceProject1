require("dotenv").config()
const mongoClient = require('mongodb').MongoClient

const state = {
    db: null
}

module.exports.connect = async function (done) {
    const url = process.env.MONGO_CONNECTION
    const client = new mongoClient(url);
    
    const dbname = 'shopping'
    try {
        
        await client.connect()
        console.log('Connected successfully to server');
        state.db = client.db(dbname)
        done()
    } catch (error) {
        return done(error)

    }

}


module.exports.get = function () {
    return state.db
}