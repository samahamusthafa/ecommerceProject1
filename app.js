const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars')
const db = require('./config/connection')
const session = require('express-session')
// const fileUpload = require('express-fileupload')
// ...


const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');
// const hbs = require('express-handlebars');

const app = express();


app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next()
})
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
  helpers: {
    ifeq: function (v1, v2) {
      
      return v1 === v2;
    },
    multiply: (n1, n2) => {
      return n1 * n2
    },
    inc: (value) => {
      console.log(value)
      return parseInt(value) + 1;
    },
    bool:(arg)=>{
      console.log(arg)
      console.log(Boolean(arg))
      return Boolean(arg)
    }
  }

}))
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({
  secret: 'my secret key',
  saveUninitialized: true,
  resave: false
}))

db.connect((err) => {
  if (err) { console.log("Connection Error" + err) }
  else { console.log("Database Connected to port 27017") }
})

app.use('/admin', adminRouter);
app.use('/', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
