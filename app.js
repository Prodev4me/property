
// change url in calc file and store js file to proper one

require('dotenv').config()
require('express-async-errors');
const express = require('express')
const expressLayout = require('express-ejs-layouts')

const bodyParser = require('body-parser')
const connectDB = require('./db/connect')
const mainRouter = require('./routes/main')
const userRouter = require('./routes/user')
const methodOverride = require('method-override')
const {authMiddleware} = require('./middleware/authentication.js')

const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')
const session = require('express-session')

const {fivedaysSchedule, EfourdaysSchedule,deadlineDay, deadlineDayNew, resetToken} = require('./middleware/calc')
const cron = require('node-cron');

// Schedule the cron job begining of every day
cron.schedule('0 0 * * * ', fivedaysSchedule);
cron.schedule('0 0 * * * ', EfourdaysSchedule);
cron.schedule('0 0 * * * ', deadlineDay);
cron.schedule('0 0 * * * ', deadlineDayNew);
cron.schedule('0 0 * * * ', resetToken);

// cron.schedule('*/2 * * * * *', deadlineDay);
// cron.schedule('*/59 * * * * *', deadlineDayNew);


// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const app = express()

app.use(bodyParser.json())


app.use(expressLayout)
app.set('layout', './layouts/index')
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    // cookie: { maxAge: new Date ( Date.n00ow() + (36000) ) } 

}))


app.use(express.static('public'))
app.use('', userRouter)
app.use('', mainRouter)

//error handler
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);







const port = process.env.PORT || 3000


const start = async () => {
    try{
        //connect DB
        await connectDB()
        console.log("Connected to DB")
        app.listen(port, "0.0.0.0", console.log(`Server is listening to port ${port}`))
    } catch (error) {
        console.log(error)
    }
}

start();
