const express = require('express')
const multer = require('multer')
const phoneToken = require('generate-sms-verification-code')
const User = require('../models/user')
const auth = require('../middleware/auth')
const ErrorResponse = require('../utils/errorResponse')
const {signup, login, get_verify_code, check_verify_code, logout, change_info_after_signup, get_avatar_image, set_request_friend, set_accept_friend, get_requested_friends, change_password, get_user_friends, set_block, get_list_blocks, get_user_info, set_user_info, get_cover_image} = require('../controllers/user')
const router = new express.Router()

const upload = multer({
    limits: {
        fileSize: 1000000000
    },
    fileFilter(req, file, cb) {
        // console.log("file = ", file)
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new ErrorResponse('Please upload an image', 404))
        }

        cb(undefined, true)
    }
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }])

router.post('/IT4788/signup', signup)
router.post('/IT4788/login', login)
router.post('/IT4788/logout', auth, logout)
router.put('/IT4788/users/change_info_after_signup', auth, upload.single('avatar'), change_info_after_signup)
router.get('/IT4788/users/:id/avatar', get_avatar_image)
router.get('/IT4788/users/:id/cover_image', get_cover_image)
router.post('/IT4788/users/get_verify_code', get_verify_code)
router.post('/IT4788/users/check_verify_code', check_verify_code)
router.post('/IT4788/users/set_request_friend/:id', auth, set_request_friend)
router.post('/IT4788/users/set_accept_friend/:id', auth, set_accept_friend)
router.post('/IT4788/users/get_requested_friends', auth, get_requested_friends)
router.post('/IT4788/users/change_password', auth, change_password)
router.post('/IT4788/users/get_user_friends', auth, get_user_friends);
router.post('/IT4788/users/set_block', auth, set_block)
router.post('/IT4788/users/get_list_blocks', auth, get_list_blocks)
router.post('/IT4788/users/get_user_info',auth, get_user_info)
router.post('/IT4788/users/set_user_info', auth,  cpUpload, set_user_info)

module.exports = router