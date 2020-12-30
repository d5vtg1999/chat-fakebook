const path = require('path');
var db = require('../db/mongoose')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const Post = require('../models/post');
const Image = require('../models/images');

const get_image_id = asyncHandler(async (req, res, next) => {
    console.log("id = ", req.params.id)
    const img = await Image.findById(req.params.id)

    if (!img || !img.image) {
        throw new ErrorResponse("Image Not Found.", 404)
    }
    res.set('Content-Type', 'image/png')
    res.send(img.image)
})

module.exports = {
    get_image_id
}
