const mongoClient = require('mongodb').MongoClient

const state = {
    db: null
}

module.exports.connect = async function (done) {
    const url = 'mongodb://127.0.0.1:27017'
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