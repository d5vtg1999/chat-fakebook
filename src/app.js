const path = require('path');
const express = require('express')
const colors = require('colors')
// const fileupload = require('express-fileupload')
const errorHandler = require('./middleware/error')
require('./db/mongoose')

const userRouter = require('./routers/user')
const postRouter = require('./routers/post')
const imageRouter = require('./routers/images')
const videoRouter = require('./routers/videos')
const commentRouter = require('./routers/comment')
const searchRouter = require('./routers/search')
const messageRouter = require('./routers/message')

const app = express()

// Body parser
app.use(express.json());
// app.use(fileupload())
// // Set static folder
// console.log(path.join(__dirname, '../public'))
// app.use(express.static(path.join(__dirname, '../public')));


app.use(userRouter)
app.use(postRouter)
app.use(imageRouter)
app.use(videoRouter)
app.use(commentRouter)
app.use(searchRouter)
app.use(messageRouter)


app.use(errorHandler);

module.exports = app
