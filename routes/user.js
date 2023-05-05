const express = require('express');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers');
const Razorpay = require('razorpay')
const { response } = require('../app');
const nodemailer = require("nodemailer")
const db = require('../config/connection')
const collection = require('../config/collection');
const { Collection, ObjectId } = require('mongodb');

const instance = new Razorpay({
  key_id:process.env.KEY_ID,
  key_secret:process.env.KEY_SECRET,
});



const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}


router.get('/', async function (req, res) {
  let user = req.session.user
  console.log(user)
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  categoryHelpers.getAllCategories().then((categories) => {
    productHelpers.getProductsByLimit(4).then((products) => {
      userHelpers.getAllBannerImage().then((banners) => {
        console.log(banners)
        res.render('user/home', { user, categories, products, admin: false, cartCount,banners, })
      })
    })
})
})


//home
router.get('/home', async function (req, res) {
  let user = req.session.user
  console.log(user)
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  categoryHelpers.getAllCategories().then((categories) => {
    productHelpers.getProductsByLimit(4).then((products) => {
      userHelpers.getAllBannerImage().then((banners) => {
        console.log(banners)
        res.render('user/home', { user, categories, products, admin: false, cartCount,banners, })
      })
    })
  })
})


//login
router.get('/login', function (req, res) {
  if (req.session.user) {
    res.redirect('/home')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr });
    req.session.userLoginErr = ""
  }
});

router.post('/login', (req, res) => {
  console.log(req.body)
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (!response.user.isActive) {
        req.session.userLoginErr = "Account deactivated.contact admin"
        return res.redirect('/login')
      }
    if (response.user.isAdmin) {
        req.session.admin = response.user
        res.redirect('/admin/home')
      } else {
        req.session.user = response.user
        res.redirect('/home')
      }
    } else {
      req.session.userLoginErr = "Invalid email or password"
      res.redirect('/login')
    }
  })
})


//signup
router.get('/signup', (req, res) => {
  res.render('user/signup')
})



router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then(async (response) => {
    console.log(response)
    var otp = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = otp.toString()
    req.session.userId = response.insertedId
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'eshopper251@gmail.com',
        pass: 'blogpngpxfgdwoxn'
      }
    });



    let info = await transporter.sendMail({
      from: 'eshopper251@gmail.com', // sender address
      to: "samahasama23@gmail.com", // list of receivers
      subject: "Hello ✔", // Subject line
      html: `<b>${otp}</b> is your verification code.`, // html body
    });
    res.redirect('/verify-otp')
    res.json({
      msg: "you should receive an email",
      info: info.messageId,
      preview: nodemailer.getTestMessageUrl(info)
    })
  }).catch(() => {
    res.status(500)
  })
})



router.get('/verify-otp', (req, res) => {
  res.render('user/verifyotp')
})


router.post('/verify-otp', async (req, res) => {
  if (req.body.otp === req.session.otp) {
    await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: new ObjectId(req.session.userId) }, { $set: { isEmailVerified: true } })
    const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(req.session.userId) })
    req.session.user = user
    res.redirect('/home')
  } else {
    res.redirect('/verify-otp')
  }
})





//logout
router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/login')
})


//products
router.get('/products', (req, res) => {
  const { page: pageNo, search, cat } = req.query
  productHelpers.getAllProducts(pageNo, search, cat).then((products) => {
    categoryHelpers.getAllCategories().then((categories) => {
      res.render("user/view-products", { products, admin: false, user: req.session.user, categories })
    })
  })
})


//cart
router.get('/cart', verifyLogin, async (req, res, next) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  console.log(products)
  res.render('user/cart', { admin: false, products, user: req.session.user,layout:'user-layout' })
})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log("api call")
  userHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((error) => {
    res.json(error)
  })
})



router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})



router.delete('/delete-cart-product', (req, res) => {
  userHelpers.deleteCartProduct(req.body).then((response) => {
    res.json(response)
  })
})


//productDetails
router.get('/product-details/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  productHelpers.getProductsByLimit(4).then((products) => {
    res.render("user/product-details", { product, admin: false, products, user: req.session.user})
  })
})






//profile
router.get('/profile', verifyLogin, async (req, res) => {
  console.log("fgh", req.session.user._id)
  let user = await userHelpers.getUserProfile(req.session.user._id)
  console.log(user)
  res.render('user/profile', { user })
})


router.get('/edit-profile/:id', verifyLogin, async (req, res) => {
  let user = await userHelpers.getUserProfile(req.params.id)
  res.render('user/edit-profile', { user })
})


router.post('/edit-profile/:id', (req, res) => {
  console.log("req.params.id", req.params.id)
  console.log("req.body", req.body)
  userHelpers.updateUserProfile(req.params.id, req.body).then(() => {
    res.redirect('/profile')
  })
})


//order
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  userHelpers.getAllAddress(req.session.user._id).then((address) => {
    res.render('user/place-order', { address, total: total + 10, user: req.session.user })
  })
})



router.post('/place-order', async (req, res) => {
  console.log(req.body)
  const response = await userHelpers.createOrder(req.session.user._id, req.body.paymentMethod, req.body.address, req.session)
  console.log(response)
  res.json(response)
});



router.post('/create/orderId',async(req,res)=>{
  const order = await instance.orders.create({
    amount: req.body.amount,
    currency: "INR",
    receipt: "receipt#1",
    notes: {
      key1: "value3",
      key2: "value2"
    }
  })
  res.json(order)
})


router.post("/api/payment/verify", async(req, res) => {
   console.log(req.body)
   let body = req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
   var crypto = require("crypto");
  var expectedSignature = crypto.createHmac('sha256', 'ynyFtMGHiP7mW7HsQv1Zeguf')
    .update(body.toString())
    .digest('hex');
  console.log("sig received ", req.body.response.razorpay_signature);
  console.log("sig generated ", expectedSignature);
  var response = { "signatureIsValid": "false" }
  if (expectedSignature === req.body.response.razorpay_signature){
    response = { "signatureIsValid": "true" }
  }
  res.json(response);
});



router.get('/payment', async (req, res) => {
  const cartAmount = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/payment', { cartAmount:cartAmount+10}) 
})


router.get('/orders', verifyLogin, async (req, res) => {
  console.log(req.session.user._id)
  await userHelpers.getAllOrders(req.session.user._id).then((orders) => {
    console.log("orders" + orders)
    res.render('user/orders', { orders, user: req.session.user,layout:'user-layout'})
  })
})



router.patch('/return-order/:id', async (req, res) => {
  await userHelpers.returnOrder(req.params.id).then((response) => {
    res.json(response)
  })
})


//address
router.get('/add-address', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/add-address', { total,layout:'user-layout'  })
})



router.post('/add-address', async (req, res) => {
   userHelpers.addAddress(req.body, req.session.user._id).then(() => {
    res.redirect('/place-order')
  })
})



router.get('/delete-address/:id', (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.redirect('/place-order')
  })
})



router.get('/edit-address/:id', async (req, res) => {
  let address = await userHelpers.getAddressDetails(req.params.id)
  res.render('user/edit-address', { address })
})



router.post('/edit-address/:id', (req, res) => {
  userHelpers.updateAddress(req.params.id, req.body).then(() => {
    res.redirect('/place-order')
  })
})


//wishlist
router.get('/wishlist', verifyLogin, async (req, res) => {
  let products = await userHelpers.getWishlistProducts(req.session.user._id)
  console.log(products)
  categoryHelpers.getAllCategories().then((categories) => {
    res.render('user/wishlist', { products, user: req.session.user, categories,layout:'user-layout'})
  })
})



router.post('/add-to-wishlist/:id', verifyLogin, (req, res) => {
  console.log(req.url)
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((error) => {
    res.status(500).json({ error });
  });
});



router.delete('/delete-wishlist-product/:productId', (req, res) => {
  userHelpers.deleteWishlistProduct(req.session.user._id,req.params.productId).then((response) => {
    res.json(response)
  }).catch((err)=>{
    res.json(err)
  })
})





//coupon
router.get('/apply-coupon/:couponId', (req, res) => {
  userHelpers.getCoupon(req.params.couponId).then((response) => {
    req.session.coupon = response
    res.json(response)
}).catch((error) => {
    res.status(410).json(error)
  })
})


//about-page
router.get('/about-us', (req, res) => {
  res.render('user/contact-us',{layout:'user-layout'})
})


router.get('*',(req,res)=>{
  res.send("<h1>page not found</h1>")
})
module.exports = router;


