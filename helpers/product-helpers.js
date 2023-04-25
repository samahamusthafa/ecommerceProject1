const db = require('../config/connection')
const collection = require('../config/collection');
const { response } = require('../app');
const ObjectId = require('mongodb').ObjectId



module.exports = {
    addProduct: (files, product) => {
        return new Promise((resolve,reject)=>{
            const { name, price, quantity, description, category } = product
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne({
            name, price: parseInt(price), quantity: parseInt(quantity), description, category, images: files.map((item) => item.filename),isDelete:false
        }).then((data) => {
            resolve(data.insertedId)
        })

        })
        
    },



    getAllProducts: (pageNo, search, cat) => {
        return new Promise(async (resolve, reject) => {
            let query = {isDelete:false}
            if (search) {
                query.name = { $regex: search, $options: "i" }
            }
            if (cat) {
                query.category = cat
            }
            if (!pageNo) {
                pageNo = 1
            }
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find(query).skip(10 * (pageNo - 1)).limit(10).toArray()
            resolve(products)
        })
    },



    getProductsByLimit: (limit) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(limit).toArray()
            resolve(products)
        })
    },



    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new ObjectId(proId) },{$set:{isDelete:true}}).then((response) => {
                console.log(response)
                resolve(response)
            })
        })
    },



    getProductDetails: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },



    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new ObjectId(proId) }, {
                $set: {
                    category: proDetails.category,
                    name: proDetails.name,
                    price: parseInt(proDetails.price),
                    image: proDetails.image,
                    quantity: parseInt(proDetails.quantity),
                    description: proDetails.description
                }
            }).then((response) => {
                resolve()
            })
        })
    },



    getProductsByCategory: (catId) => {
        return new Promise((resolve, reject) => {
            let products = db.get().collection(collection.PRODUCT_COLLECTION).find({ category: catId }).toArray()
            resolve(products)
        })
    },
    getSalesDetails: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $facet:
                {
                    topProducts: [{ $unwind: "$products" }, { $group: { _id: "$products.productId", totalQuantity: { $sum: "$products.quantity" } } }, { $sort: { totalQuantity: -1 } }, { $limit: 5 }, {
                        $lookup: {
                            from: 'product',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    }, { $project: { totalQuantity: 1, name: "$productDetails.name" } }, { $unwind: "$name" }],
                    sales: [{ $group: { _id: '', "totalAmount": { $sum: "$total" }, "totalSales": { $sum: 1 } } }],
                    cod: [{ $match: { paymentMethod: "COD" } }, { $group: { _id: null, count: { $sum: 1 } } }],
                    online: [{ $match: { paymentMethod: "ONLINE" } }, { $group: { _id: null, count: { $sum: 1 } } }],
                    confirmedOrder:[{ $match: { orderStatus: "confirmed" } }, { $group: { _id: null, count: { $sum: 1 } } }],
                    returnedOrder:[{ $match: { orderStatus: "returned" } }, { $group: { _id: null, count: { $sum: 1 } } }],
                    canceledOrder:[{ $match: { orderStatus: "canceled" } }, { $group: { _id: null, count: { $sum: 1 } } }],
                    deliveredOrder:[{ $match: { orderStatus: "delivered" } }, { $group: { _id: null, count: { $sum: 1 } } }]
                }
            }, { $project: { topProducts: 1, totalAmount: { $arrayElemAt: ["$sales.totalAmount", 0] }, totalSales: { $arrayElemAt: ["$sales.totalSales", 0] }, totalCODSales: { $arrayElemAt: ["$cod.count", 0] }, totalONLINESales: { $arrayElemAt: ["$online.count", 0] } ,totalConfirmedOrder: { $arrayElemAt: ["$confirmedOrder.count", 0] } ,totalReturnedOrder: { $arrayElemAt: ["$returnedOrder.count", 0] } ,totalCanceledOrder: { $arrayElemAt: ["$canceledOrder.count", 0] } ,totalDeliveredOrder: { $arrayElemAt: ["$deliveredOrder.count", 0] } } }]).toArray()
                .then((response) => {
                    
                    console.log(response[0])
                    resolve(response[0])
                })

        })
    },
    



}