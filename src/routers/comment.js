const express = require('express')
const Comment = require('../models/comment')
const auth = require('../middleware/auth')
const {set_comment, get_comment} = require('../controllers/comment')
const router = new express.Router()

router.post('/IT4788/comment/set_comment/:post_id', auth, set_comment);
router.get('/IT4788/comment/get_comment/:post_id', get_comment);

module.exports = router