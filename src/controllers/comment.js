const path = require('path');
var db = require('../db/mongoose')
const mongoose = require('mongoose')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const Post = require('../models/post');
const Image = require('../models/images');
const Comment = require('../models/comment');


// truyen json data, chua xy ly truong hop lay danh sach comment bao gom ca index, count
const set_comment = asyncHandler(async (req, res, next) => {
    var post = await Post.findById(req.params.post_id);
    const user = await User.findById(req.user._id)

    if (!post) {
        res.status(404).json({
            code: 9992,
            message: 'Post not found'
        })
    }
    else if (!user) {
        return next(new ErrorResponse('please login first', 400))
    }
    else if (post.is_blocked) {
        res.status(400).json({
            code: 1010,
            message: 'Khong the dang binh luan.'
        })
    }
    else {

        var data;
        var commentInfo = req.body
        var count = parseInt(req.body.count);
        var index = parseInt(req.body.index);
        delete commentInfo.count
        delete commentInfo.index

        commentInfo.of_post = req.params.post_id;
        commentInfo.owner = req.user._id;
        commentInfo.index = post.comments_count + 1;

        const comment = await Comment.create(commentInfo)

        post.comments.push(comment._id);
        post.comments_count += 1;
        
        await Post.findByIdAndUpdate(req.params.post_id, post)

        if (!index || index < 0) {
            index = 0
        } else {
            index -= 1
        }
        if (!count || count < 0) {
            count = post.comments_count
        }

        if (index + count > post.comments_count) {
            index = 0;
            count = post.comments_count;
        }

        // if (count + index - 1 > post.comments_count) {
        //      data = post.comments.slice(index, post.comments_count)
        // }
        // else {
        //     data = post.comments.slice(index, index + count)
        // }

        /********* TODO **********/

        // data = data.map((cmt) => {
            
        //     let tmp_comment = db.collection("comments").find({_id: cmt}).exec()
        //     console.log("cmt = ", tmp_comment)
        //     let tmp_user = db.collection("users").find({_id: tmp_comment.owner}).exec()

        //     let avatar;
        //     if (tmp_user.avatar) {
        //         avatar = `http://localhost:3000/IT4788/users/${tmp_user._id}/avatar`;
        //     }
        //     else {
        //         avatar = undefined;
        //     }
        //     return {
        //         "id": tmp_comment._id,
        //         "comment": tmp_comment.comment,
        //         "poster": {
        //             "id": tmp_comment.owner,
        //             "first_name": tmp_user.first_name,
        //             "sur_name": tmp_user.sur_name,
        //             "avatar": avatar,
        //         },
        //         "is_blocked": tmp_user.is_blocked,
        //     }
        // })

        res.status(200).json({
            "code": 1000,
            "message": `user ${req.user._id} vua dang binh luan`,
            // "data": `http://localhost:3000/IT4788/comment/get_comment/${post._id}/?index=${index}&count=${count}`,
            "data": `https://fakebook-mobileapp.herokuapp.com/IT4788/comment/get_comment/${post._id}/?index=${index}&count=${count}`,
            "is_blocked": req.user.is_blocked,
        })
    }

})

const get_comment = asyncHandler(async (req, res, next) => {

    let data, tmp_data;
    data = [];
    tmp_data = []

    let post = await Post.findById(req.params.post_id)

    if (!post) {
        res.status(404).json({
            code: 9992,
            message: 'Post not found'
        })
    }

    var index = parseInt(req.query.index)
    var count = parseInt(req.query.count)

    if (index < 0) {
        index = 0;
    }

    if (index >= post.comments_count) {
        index = post.comments_count - 1
    }

    if (index + count - 1 >= post.comments_count) {
        data = post.comments.slice(index, post.comments_count)
    }
    else {
        data = post.comments.slice(index, index + count)
    }

    let tmp_comments = [];

    for (cmt of data) {
        const tmp_cmt = await Comment.findById(cmt)
        tmp_comments.push(tmp_cmt)
    }

    for (tmp_comment of tmp_comments) {
        const tmp_usr = await User.findById(tmp_comment.owner)

        let avatar;

        if (tmp_usr.avatar) {
            avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${tmp_usr._id}/avatar`;
            // avatar = `http://localhost:3000/IT4788/users/${tmp_usr._id}/avatar`;
        }
        else {
            avatar = "-1";
        }

        console.log("avatar = ", avatar);

        tmp_data.push({
            "id": tmp_comment._id,
            "comment": tmp_comment.comment,
            "poster": {
                "id": tmp_comment.owner,
                "first_name": tmp_usr.first_name,
                "sur_name": tmp_usr.sur_name,
                "avatar": avatar
            }
        })
    }

    res.set('Content-Type', 'application/json')

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": tmp_data
    })

})

module.exports = {
    set_comment,
    get_comment,
}
