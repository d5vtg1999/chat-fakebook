const express = require('express')
const multer = require('multer')
const phoneToken = require('generate-sms-verification-code')
const User = require('../models/user')
const auth = require('../middleware/auth')
const ErrorResponse = require('../utils/errorResponse')
const {get_list_conversation, get_conversation, set_read_message, delete_message, delete_conversation} = require('../controllers/message')
const router = new express.Router()


router.post('/IT4788/message/get_list_conversation', get_list_conversation)
router.post('/IT4788/message/get_conversation', get_conversation)
router.post('/IT4788/message/set_read_message', set_read_message)
router.post('/IT4788/message/delete_message', delete_message)
router.post('/IT4788/message/delete_conversation', delete_conversation)

module.exports = router
