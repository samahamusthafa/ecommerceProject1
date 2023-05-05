const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const instance = new Razorpay({
    key_id: 'rzp_test_uUYOED9bCKWj7S',
    key_secret: 'ynyFtMGHiP7mW7HsQv1Zeguf',
});


const getTotalAmount = (userId) => {
    return new Promise(async (resolve, reject) => {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match: { user: new ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                }
            }
        ]).toArray()
        console.log(total[0].total)
        resolve(total[0].total)
    })
}




const getCartProducts = (userId) => {
    return new Promise(async (resolve, reject) => {
        let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match: { user: new ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            }
        ]).toArray()
        resolve(cartItems)
    })
}





const getCartProductsforOrder = (userId) => {
    return new Promise(async (resolve, reject) => {
        let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match: { user: new ObjectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    productId: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    productId: 1, quantity: 1, name: { $arrayElemAt: ['$product.name', 0] }, price: { $arrayElemAt: ['$product.price', 0] }
                }
            }
        ]).toArray()
        resolve(cartItems)
    })
}





module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.pw = await bcrypt.hash(userData.pw, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne({ ...userData, isActive: true, isEmailVerified: false, isAdmin: false }).then((data) => {
                    resolve(data)
                })
            } catch (error) {
                console.log(error)
                reject()
            }
        })
    },



    changeUserStatus: (userId, status) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: new ObjectId(userId) }, { $set: { isActive: status } }).then((response) => {
                resolve({ message: "success" })
            })
        })
    },



    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let Users = await db.get().collection(collection.USER_COLLECTION).find({ isAdmin: false }).toArray()
            resolve(Users)
        })
    },



    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password, function (err, status) {
                    if (status) {
                        console.log("login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login failed")
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("login failed")
                resolve({ status: false })
            }
        })
    },



    getUserProfile: (userId) => {
        return new Promise(async (resolve, reject) => {
            let User = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) })
            console.log(User)
            resolve(User)
        })
    },



    updateUserProfile: (userId, userDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateMany({ _id: new ObjectId(userId) }, {
                $set: {
                    name: userDetails.name,
                    gender: userDetails.gender,
                    address: userDetails.address,
                    email: userDetails.email,
                    phone: userDetails.phone
                }
            }).then((response) => {
                resolve()
            })
        })
    },




    addToCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    reject({ message: "Item already exist in cart" })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId) }, {
                        $push: { products: proObj }
                    }).then((response) => {
                        resolve({ message: "Item added to cart successfully!" })
                    })
                }
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve({ message: "Item added to cart successfully!" })
                })
            }
        })
    },



    getCartProducts: getCartProducts,


    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },



    changeProductQuantity: (details) => {
        const count = parseInt(details.count)
        const quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart) }, {
                    $pull: { products: { item: new ObjectId(details.product) } }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': count }
                    }).then((response) => {
                        resolve(true)
                    })
            }
        })
    },




    deleteCartProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) }).then((response) => {
                resolve(response)
            })
        })
    },



    addAddress: (address, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne({
                ...address, user: userId
            }).then((data) => {
                resolve()
            })
        })
    },



    getAllAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ user: userId }).toArray()
            resolve(address)
        })
    },



    deleteAddress: (addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: new ObjectId(addressId) }).then((response) => {
                console.log(response)
                resolve(response)
            })
        })
    },



    getAddressDetails: (addressId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: new ObjectId(addressId) }).then((address) => {
                resolve(address)
            })
        })
    },



    updateAddress: (addressId, addressDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: new ObjectId(addressId) }, {
                $set: {
                    name: addressDetails.name,
                    address: addressDetails.address,
                    phone: addressDetails.phone
                }
            }).then((response) => {
                resolve()
            })
        })
    },




    getTotalAmount: getTotalAmount,
    addToWishlist: (proId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
                { user: new ObjectId(userId) },
                { $addToSet: { products: new ObjectId(proId) } },
                { upsert: true }
            ).then((response) => {
                console.log(response)
                if (response.modifiedCount) {
                    resolve({ message: "product added to wishlist" });
                } else {
                    resolve({ message: "product already exist in wishlist" });
                }
            }).catch((err) => {
                console.log(err)
                reject(err);
            });
        });
    },




    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log("Getting wishlist for user ", userId);
            const response = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                { $match: { user: new ObjectId(userId) } },
                { $unwind: "$products" },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: "products",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $group: {
                        _id: "$_id",
                        products: { $push: "$product" },
                    },
                },
            ]).toArray()
            console.log(response)
            if (response.length) {
                resolve(response[0].products)
            } else {
                resolve([])
            }
        })
    },




    deleteWishlistProduct: (userId, productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: new ObjectId(userId) }, { $pull: { products: new ObjectId(productId) } }).then((response) => {
                resolve(response)
            }).catch((err) => {
                reject(err);
            });
        })
    },



    createOrder: (userId, paymentMethod, paymentAddress, session) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cartProducts = await getCartProductsforOrder(userId)
                let total = await getTotalAmount(userId)
                console.log('total: ', total);
                const currentDate = new Date();
                const coupon = session.coupon
                console.log(coupon)
                if (coupon) {
                    total = total * (100 - coupon.discount_percentage) / 100
                }
                const totalAmount = total + 10
                await db.get().collection(collection.ORDER_COLLECTION).insertOne({
                    userId: userId,
                    paymentMethod: paymentMethod,
                    paymentAddress: new ObjectId(paymentAddress),
                    products: cartProducts, total: totalAmount,
                    dateField: currentDate,
                    orderStatus: "confirmed",
                    couponCode: coupon ? coupon.code : null,
                    couponPercentage: coupon ? coupon.coupon_percentage : null
                })
                await db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(userId) })
                resolve({ message: 'Order Placed Successfully' })
            } catch (error) {
                reject(error)
            }
        })
    },
    



    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: userId }).sort({ dateField: -1 }).toArray()
            resolve(orders)
        })
    },




    getAllOrderDetails: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ dateField: -1 }).toArray()
            resolve(orders)
        })
    },



    getAllOrdersByDate: (start, end) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{ $match: { dateField: { $gte: new Date(start), $lte: new Date(end) } } }, {
                $lookup:
                {
                    from: 'address',
                    localField: 'paymentAddress',
                    foreignField: '_id',
                    as: 'address'
                }
            }, { $unwind: "$address" }]).toArray()
            console.log(orders)
            resolve(orders)
        })
    },



    returnOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderStatus: "returned" } }).then((response) => {
                resolve({ message: "Order Returned" })
            })
        })
    },



    deliverOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderStatus: "delivered" } }).then((response) => {
                resolve({ message: "Order delivered" })
            })
        })
    },



    cancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderStatus: "canceled" } }).then((response) => {
                resolve({ message: "Order Canceled" })
            })
        })
    },



    addCoupon: (coupon) => {
        return new Promise((resolve, reject) => {
            const { name,
                description,
                discount_percentage,
                min_amount,
                discountprice,
                date,
                code } = coupon
            db.get().collection(collection.COUPON_COLLECTION).insertOne({
                name, description, date, discount_percentage: parseFloat(discount_percentage), maxdiscountprice: parseInt(discountprice), min_amount: parseInt(min_amount), code
            }).then((response) => {
                resolve()
            })
        })
    },




    getCouponDetails: (couponId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: new ObjectId(couponId) }).then((coupon) => {
                resolve(coupon)
            })
        })
    },




    updateCoupon: (couponId, couponDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: new ObjectId(couponId) }, {
                $set: {
                    name: couponDetails.name,
                    description: couponDetails.description,
                    date: parseInt(couponDetails.date),
                    discount_percentage: couponDetails.parseFloat(discount_percentage),
                    maxdiscountprice: parseInt(couponDetails.discountprice),
                    min_amount: couponDetails.parseInt(min_amount),
                    code: couponDetails.code
                }
            }).then((response) => {
                resolve()
            })
        })
    },





    generateRazorpay: (orderId) => {
        return new Promise((resolve, reject) => {
            const options = {
                amount: 50000,
                currency: "INR",
                receipt: "order_rcptid_11"
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                resolve(order)
            })
        })
    },



    getCoupon: (couponCode) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).findOne({ code: couponCode }).then((response) => {
                if (!response) {
                    reject({ message: "Invalid coupon code!" })
                } else if (new Date(response.date) < new Date()) {
                    resolve(response)
                } else {
                    reject({ message: "Coupon expired!" })
                }
            })
        })
    },




    getAllCoupons: () => {
        return new Promise((resolve, reject) => {
            let coupons = db.get().collection(collection.COUPON_COLLECTION).find({}).toArray()
            resolve(coupons)
        })
    },



    addBanner: (banner, file) => {
        return new Promise((resolve, reject) => {
            const { banner_type } = banner
            db.get().collection(collection.BANNER_COLLECTION).insertOne({ banner_type, images: file.filename, isActive: true }).then((data) => {
                resolve(data)
            })
        })
    },
        



    getAllBanners: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.BANNER_COLLECTION).find({}).toArray()
            console.log(banners)
            resolve(banners)
        })
    },



    getAllBannerImage: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.BANNER_COLLECTION).find({ isActive: true }).toArray()
            console.log(banners)
            resolve(banners)
        })
    },



    changeBannerStatus: (bannerId, status) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).updateOne({ _id: new ObjectId(bannerId) }, { $set: { isActive: status } }).then((response) => {
                resolve({ message: "success" })
            })
        })
    },






}



