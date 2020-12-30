const express = require('express')
const Post = require('../models/post')
const multer = require('multer')
const auth = require('../middleware/auth')
const {get_image_id} = require('../controllers/images')
const router = new express.Router()

router.get('/IT4788/images/:id', get_image_id)

module.exports = router