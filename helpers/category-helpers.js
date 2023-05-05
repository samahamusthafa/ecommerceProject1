const db = require('../config/connection')
const collection = require('../config/collection');
const { response } = require('../app');
const ObjectId = require('mongodb').ObjectId

module.exports = {
    addCategory: (category, file) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne({ ...category, isDelete: false, path: file.filename }).then((data) => {
                resolve(data.insertedId)
            }).catch((err) => {
                reject({ message: "Already added category!" })
            })
        })
    },



    getAllCategories: () => {
        return new Promise(async (resolve,) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find({ isDelete: false }).toArray()
            resolve(categories)
        })
    },



    deleteCategory: (catId) => {
        return new Promise((resolve,) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: new ObjectId(catId) }, { $set: { isDelete: true } }).then((response) => {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ category: catId }, { $set: { category: null } }).then((response1) => {
                    console.log(response)
                    resolve(response)
                })
            })
        })
    },
            



    getCategoryDetails: (catId) => {
        return new Promise(async (resolve,) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: new ObjectId(catId) }).then((category) => {
                resolve(category)
            })
        })
    },



    updateCategory: (catId, catDetails) => {
        return new Promise((resolve,) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: new ObjectId(catId) }, {
                $set: {
                    image: catDetails.image,
                    category: catDetails.category
                }
            }).then((response) => {
                resolve()
            })
        })
    },
}