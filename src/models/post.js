const mongoose = require('mongoose')
const Image = require('./images')
const Video = require('./videos')

const postSchema = new mongoose.Schema({
    described: {
        type: String,
        required: [true, "Please add a description of your status."]
    },
    status: {
        type: String,
    },
    images: {
        type: [String],
    },
    video: {
        type: String
    },

    media: {
        type: String,
        enum: ["image", "video"]
    },

    users_liked: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'User'
    },

    like: {
        type: Number,
        default: 0
    },

    can_comment: {
        type: Boolean,
        default: true,
    },

    comments: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'Comment'
    },

    comments_count: {
        type: Number,
        default: 0
    },

    is_liked: {
        type: Boolean,
        default: false
    },

    is_blocked: {
        type: Boolean,
        default: false,
    },

    is_banned: {
        type: Boolean,
        default: false,
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    
    createAt: {
        type: Date,
        default: Date.now()
    },
    modifiedAt: {
        type: Date,
        default: Date.now()
    }
})

postSchema.pre('save', async function(next) {
    const post = this
    if (post.media === "image") {
        const list_images = await Image.find({"of_post": post._id}).exec()
        post.images = list_images.map(img => img._id)
    }
    else if (post.media === "video") {
        const video = await Video.findOne({"of_post": post._id}).exec()
        // console.log("video = ", video)
        post.video = video._id
    }
    console.log("post = ", post)
    next();
});
  

const Post = mongoose.model('Post', postSchema)

module.exports = Post