const express = require('express')
const Post = require('../models/post')
const multer = require('multer')
const auth = require('../middleware/auth')
const {add_post, get_post, get_list_posts, edit_post, delete_post, report_post, like_post, check_new_items, get_list_videos} = require('../controllers/post')
const router = new express.Router()

const upload = multer()


router.post('/IT4788/posts/add_post', auth, upload.array("post_files", 4), add_post)


router.get('/IT4788/posts/get_post/:id', auth, get_post)


// @desc      edit a post
// @route     PUT /IT4788/posts/edit_post/:id
// @access    Private, only author of post can edit that post.
router.put('/IT4788/posts/edit_post/:id', auth, upload.array("post_files", 4), edit_post)


router.delete('/IT4788/posts/delete_post/:id', auth, delete_post)


router.post('/IT4788/posts/report_post/:id', auth, report_post)

router.post('/IT4788/posts/like_post/:id', auth, like_post)

router.post('/IT4788/posts/get_list_posts', auth, get_list_posts)

router.post('/IT4788/posts/check_new_items/:id', auth, check_new_items)

router.post('/IT4788/posts/get_list_videos', auth, get_list_videos)

module.exports = router