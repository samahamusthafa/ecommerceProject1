const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const userHelpers = require('../helpers/user-helpers')
const path = require('path');

const multer = require('multer')



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







router.get('/products', function (req, res) {
  const { page, search, cat } = req.query
  productHelpers.getAllProducts(page, search, cat).then((products) => {
    // console.log(products.length)
    res.render('admin/view-products', { products, admin: true,layout:'admin-layout'})
  })
})



router.get('/home', async function (req, res) {
  
  
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
  if (req.session.admin) {
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
  } else {
    console.log();
    res.redirect('/login')
  }
})



router.get('/add-product', async function (req, res) {
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



router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/products')
  })
})



router.get('/edit-product/:id', async (req, res) => {
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



router.get('/categories', function (req, res) {
  categoryHelpers.getAllCategories().then((categories) => {
    res.render('admin/view-categories', { categories, admin: true,layout:'admin-layout' })
  })
})



router.get('/add-category', function (req, res) {
  res.render("admin/add-category", { admin: true,layout:'admin-layout'})
})



// router.post('/add-category', function (req, res) {
//   console.log(req.body)
//   console.log(req.files.image)
//   categoryHelpers.addCategory(req.body, (id) => {
//     let image = req.files.image
//     image.mv('./public/category-images/' + id + '.jpg', (err, done) => {
//       if (!err) {
//         res.redirect('/admin/categories')
//       } else {
//         console.log(err);
//       }
//     })
//   })
// })


router.post('/add-category', uploadCategory.single('image'), async (req, res) => {
  categoryHelpers.addCategory(req.body,req.file).then( (id) => {
    res.redirect('/admin/categories')

  })

})



router.get('/delete-category/:id', (req, res) => {
  let catId = req.params.id
  console.log(catId)
  categoryHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/categories')
  })
})



router.get('/edit-category/:id', async (req, res) => {
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




router.get('/user-list', function (req, res) {
  userHelpers.getAllUsers().then((users) => {
    res.render('admin/view-users', { users, admin: true,layout:'admin-layout'})
  })
})



router.patch('/change-user-status/:id', (req, res) => {
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



router.get('/orders', async (req, res) => {
  await userHelpers.getAllOrderDetails().then((orders) => {
    res.render('admin/view-orders', { orders,layout:'admin-layout'})
  })
})



router.patch('/deliver-order/:id', async (req, res) => {
  await userHelpers.deliverOrder(req.params.id).then((response) => {
    res.json(response)
  })
})

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



router.get('/add-coupon', (req, res) => {
  res.render('admin/add-coupon',{layout:'admin-layout'})
})



router.post('/add-coupon', async (req, res) => {
  await userHelpers.addCoupon(req.body).then((response) => {
    res.redirect('/admin/coupon-list')
  })
})

router.get('/edit-coupon/:id',(req,res)=>{
  res.render('admin/edit-coupon',{layout:'admin-layout'})
})



router.get('/banners', async (req, res) => {
  await userHelpers.getAllBanners().then((banners) => {
    res.render('admin/list-banner', { banners,layout:'admin-layout'})
  })
})



router.get('/add-banner', async (req, res) => {
  res.render('admin/add-banner',{layout:'admin-layout'})
})



router.post('/add-banner', uploadBanner.single('image'), async (req, res) => {
  userHelpers.addBanner(req.body,req.file).then( (id) => {
    res.redirect('/admin/banners')

  })

})

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
  console.log(typeof status, status)
})



router.get('/coupon-list', async (req, res) => {
  await userHelpers.getAllCoupons().then((coupons) => {
    res.render('admin/list-coupon', { coupons,layout:'admin-layout' })
  })

})

router.get('/salesreport', async (req, res) => {
  const { start, end } = req.query
  await userHelpers.getAllOrdersByDate(start, end).then((orders) => {
    res.render('admin/sales', { orders,layout:'admin-layout' })
  })


})



module.exports = router;
