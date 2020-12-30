const path = require('path');
var db = require('../db/mongoose')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const Post = require('../models/post');
const Video = require('../models/videos');

const get_video_id = asyncHandler(async (req, res, next) => {
    console.log("loading... video id = ", req.params.id)
    const vdo = await Video.findById(req.params.id)

    if (!vdo || !vdo.video) {
        throw new ErrorResponse("Video Not Found.", 404)
    }
    res.set('Content-Type', 'video/mp4')
    res.send(vdo.video)
})

module.exports = {
    get_video_id
}
