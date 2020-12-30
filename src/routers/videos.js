const express = require('express')
const Post = require('../models/post')
const multer = require('multer')
const auth = require('../middleware/auth')
const {get_video_id} = require('../controllers/videos')
const router = new express.Router()

router.get('/IT4788/videos/:id', get_video_id)

module.exports = router