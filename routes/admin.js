const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers')
const path = require('path');
const multer = require('multer')


const adminVerify = (req,res,next)=>{
  if(req.session.admin){
    next();
  }else{
    res.redirect('/login')
  }
}


//image upload using multer
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/product-images/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/').slice(-1))
  }
})
const uploadProduct = multer({ storage: productStorage })



const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/banner-images/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/').slice(-1))
  }
})
const uploadBanner = multer({ storage: bannerStorage })


const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/category-images/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/').slice(-1))
  }
})
const uploadCategory = multer({ storage: categoryStorage })






//product
router.get('/products',adminVerify, function (req, res) {
  const { page, search, cat } = req.query
  productHelpers.getAllProducts(page, search, cat).then((products) => {
    res.render('admin/view-products', { products, admin: true,layout:'admin-layout'})
  })
})


//home
router.get('/home',adminVerify,async function (req, res) {
  const { topProducts,
      totalSales,
      totalAmount,
      totalCODSales,
      totalONLINESales,
      totalConfirmedOrder,
      totalReturnedOrder,
      totalCanceledOrder,
      totalDeliveredOrder } = await productHelpers.getSalesDetails()
      console.log(totalAmount)
    console.log("its here");
    res.render("admin/home", {layout:'admin-layout',
      admin: true,
      totalSales,
      totalAmount,
      totalCODSales,
      totalONLINESales,
      topProducts, totalConfirmedOrder,
      totalReturnedOrder,
      totalCanceledOrder,
      totalDeliveredOrder
    })
})


//add-product
router.get('/add-product',adminVerify, async function (req, res) {
  let categories = await categoryHelpers.getAllCategories()
  res.render("admin/add-product", { admin: true, categories,layout:'admin-layout' })
})


router.post('/add-product', uploadProduct.array('image', 4), function (req, res) {
  console.log(req.body, "body")
  console.log(req.file)
  console.log(req.files)
productHelpers.addProduct(req.files, req.body).then((id) => {
    res.redirect('/admin/products')
   })
})


//delete-product
router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/products')
  })
})


//edit-product
router.get('/edit-product/:id',adminVerify, async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  const categories = await categoryHelpers.getAllCategories()
  console.log(product)
  res.render('admin/edit-product', { admin: true, product, categories,layout:'admin-layout' }) 
})



router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    if (req.files && req.files.image) {
      let image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg')
    }
    res.redirect('/admin/products')
  })
})


//edit-coupon
router.get('/edit-coupon/:id',adminVerify, async (req, res) => {
  let coupon = await userHelpers.getCouponDetails(req.params.id)
     res.render('admin/edit-coupon', { admin: true, coupon,layout:'admin-layout' }) 
})



router.post('/edit-coupon/:id', (req, res) => {
  let id = req.params.id
  userHelpers.updateCoupon(req.params.id, req.body).then(() => {
    res.redirect('/admin/coupon-list')
  })
})


//categories
router.get('/categories',adminVerify, function (req, res) {
  categoryHelpers.getAllCategories().then((categories) => {
    res.render('admin/view-categories', { categories, admin: true,layout:'admin-layout' })
  })
})


//add-category
router.get('/add-category',adminVerify, function (req, res) {
  res.render("admin/add-category", { admin: true,layout:'admin-layout'})
})






router.post('/add-category', uploadCategory.single('image'), async (req, res) => {
  categoryHelpers.addCategory(req.body,req.file).then( (id) => {
    res.redirect('/admin/categories')
  }).catch((err)=>{
    res.redirect('/admin/add-category')
  })
})


//delete-category
router.get('/delete-category/:id', (req, res) => {
  let catId = req.params.id
  console.log(catId)
  categoryHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/categories')
  })
})


//edit-category
router.get('/edit-category/:id',adminVerify, async (req, res) => {
  let category = await categoryHelpers.getCategoryDetails(req.params.id)
  console.log(category)
  res.render('admin/edit-category', { admin: true, category,layout:'admin-layout'})
})



router.post('/edit-category/:id', (req, res) => {
  let id = req.params.id
  categoryHelpers.updateCategory(req.params.id, req.body).then(() => {
    if (req.files && req.files.image) {
      let image = req.files.image
      image.mv('./public/category-images/' + id + '.jpg')
    }
    res.redirect('/admin/categories')
  })
})



//user-list
router.get('/user-list',adminVerify, function (req, res) {
  userHelpers.getAllUsers().then((users) => {
    res.render('admin/view-users', { users, admin: true,layout:'admin-layout'})
  })
})


//change-user-status
router.patch('/change-user-status/:id',adminVerify, (req, res) => {
  let status = req.body.status
  if (status === "true") {
    status = true
  }
  else {
    status = false
  }
  userHelpers.changeUserStatus(req.params.id, status).then((response) => {
    res.json(response)
  })
  console.log(typeof status, status)
})


//orders
router.get('/orders',adminVerify, async (req, res) => {
  await userHelpers.getAllOrderDetails().then((orders) => {
    res.render('admin/view-orders', { orders,layout:'admin-layout'})
  })
})


//deliver-order
router.patch('/deliver-order/:id', async (req, res) => {
  await userHelpers.deliverOrder(req.params.id).then((response) => {
    res.json(response)
  })
})


//cancel-order
router.patch('/cancel-order/:id', async (req, res) => {
  await userHelpers.cancelOrder(req.params.id).then((response) => {
    res.json(response)
  })
})



router.patch('/-order/:id', async (req, res) => {
  console.log("tf7igi");
  await userHelpers.Order(req.params.id).then((response) => {
    res.json(response)
  })
})


//add-coupon
router.get('/add-coupon',adminVerify, (req, res) => {
  res.render('admin/add-coupon',{layout:'admin-layout'})
})



router.post('/add-coupon', async (req, res) => {
  await userHelpers.addCoupon(req.body).then((response) => {
    res.redirect('/admin/coupon-list')
  })
})




//banners
router.get('/banners',adminVerify, async (req, res) => {
  await userHelpers.getAllBanners().then((banners) => {
    res.render('admin/list-banner', { banners,layout:'admin-layout'})
  })
})


//add-banner
router.get('/add-banner',adminVerify, async (req, res) => {
  res.render('admin/add-banner',{layout:'admin-layout'})
})



router.post('/add-banner', uploadBanner.single('image'), async (req, res) => {
  userHelpers.addBanner(req.body,req.file).then( (id) => {
    res.redirect('/admin/banners')

  })

})


//change banner status
router.patch('/change-banner-status/:id', (req, res) => {
  let status = req.body.status
  if (status === "true") {
    status = true
  }
  else {
    status = false
  }
  userHelpers.changeBannerStatus(req.params.id, status).then((response) => {
    res.json(response)
  })
  
})


//coupon list
router.get('/coupon-list',adminVerify, async (req, res) => {
  await userHelpers.getAllCoupons().then((coupons) => {
    res.render('admin/list-coupon', { coupons,layout:'admin-layout' })
  })
})


//sales report
router.get('/salesreport',adminVerify, async (req, res) => {
  const { start, end } = req.query
  await userHelpers.getAllOrdersByDate(start, end).then((orders) => {
    res.render('admin/sales', { orders,layout:'admin-layout' })
})
})


//logout
router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/login')
})

router.get('*',(req,res)=>{
  res.send("<h1>page not found</h1>")
})

module.exports = router;
