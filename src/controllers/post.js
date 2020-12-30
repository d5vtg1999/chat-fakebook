const path = require('path');
var db = require('../db/mongoose')
const mongoose = require('mongoose')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const User = require('../models/user')
const Post = require('../models/post')
const Image = require('../models/images')
const Video = require('../models/videos')
const Report = require('../models/report')

const add_post = asyncHandler(async (req, res, next) => {
    let videos = []
    req.body.author = req.user._id;
    const postContent = req.body;
    postContent.images = [];
    const postFiles = req.files;

    // create new post
    let post = new Post(postContent)

    console.log("post - content = ", postContent);
    console.log("post - files = ", postFiles);

    // let i = 0;
    let preType, type, buffer, image, video;
    for (file of postFiles) {
        
        type = file.mimetype;
        if (!type.startsWith("image") && !type.startsWith("video")) {
            return next(new ErrorResponse(`Please upload only image type or video type.`))
        }

        preType = file.mimetype.slice(0, 5)

        if (preType === "image") {
            post.media = "image"
            buffer = await sharp(file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

            image = {
                image: buffer,
                of_post: post._id,
                owner: postContent.author
            }

            postContent.images.push(image)
            // post.images.push(buffer)
        }
        else {
            console.log('video upload')
            post.media = "video"
            video = {
                "video": file.buffer,
                "of_post": post._id,
                "owner": postContent.author
            }
            videos.push(video)
            // post.video = file.buffer
        }
    }

    // console.log("hello world")
    if (postContent.images.length !== 0) {
        await Image.insertMany(postContent.images);
    }

    if (videos.length !== 0) {
        await Video.insertMany(videos);
    }

    await post.save()

    res.status(200).json({
        code: 1000,
        message: "OK",
        data: {
            id: post._id,
            state: post.status,
            description: post.described,
            author: post.author,
            createAt: post.createAt
        }
    });

    /*

    **************FOR UPLOAD MUTIL FILES, USING EXPRESS-FILEUPLOAD***********************

    let i = 1;
    for (const type in postFiles) {
        const file = postFiles[type]
        if (file.size > 1000000000) {
            return next(new ErrorResponse(`Please upload ${type} less than 1000000000`,400));
        }
        if (!file.mimetype.startsWith('video') && !file.mimetype.startsWith('image')) {
            return next(new ErrorResponse(`Please upload only image type or video type.`))
        }
        let preType = file.mimetype.slice(0, 5)
        if (preType === "image") {
            file.name = `${preType}${i}_${req.user._id}_${post._id}_${path.parse(file.name).ext}`;
            post.images.push(file.name)
            i++;
        }
        else {
            file.name = `${preType}_${req.user._id}_${post._id}_${path.parse(file.name).ext}`;
            post.video = file.name;
        }

        file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`)
    }

    await post.save()

    res.status(200).json({
        code: 1000,
        message: "OK",
        data: { post }
    });

    */
})

const get_post = asyncHandler(async (req, res, next) => {

    let post = await Post.findById(req.params.id)

    if (!post) {
        return next(new ErrorResponse("Post not exist", 404))
    }

    if (post.is_banned) {
        res.status(400).json({
            code: 9992,
            message: "Post not found."
        })
    }
    else if (post.is_blocked) {
        res.status(400).send("Post not found.")
    }
    else {
        if (!post.video && post.images) {
            const image_ids = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
            // const image_ids = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
            res.status(200).json({
                code: 1000,
                message: "OK",
                data: { 
                    id: post._id,
                    state: post.status,
                    banned: post.is_banned,
                    images: image_ids,
                }
            })
        }
        else if (post.video) {
            res.status(200).json({
                code: 1000,
                message: "OK",
                data: { 
                    id: post._id,
                    state: post.status,
                    banned: post.is_banned,
                    // video: `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${video._id}`,
                    video: `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${post.video}`
                }
            })
        }
        else {
            res.status(200).json({
                code: 1000,
                message: "OK",
                data: { 
                    id: post._id,
                    state: post.status,
                    banned: post.is_banned,
                }
            })
        }
    }
})


// nhan token, last_id, index, count
const get_list_posts = asyncHandler(async (req, res, next) => {

    let {last_id, index, count} = req.query

    console.log("last id = ", last_id)

    let list_posts = await Post.find({})

    const post_length = list_posts.length

    console.log("post length = ", post_length)

    const list_posts_id = list_posts.map(pst => pst._id.toString())

    list_posts.sort(function(a, b) {
        var keyA = a.createAt;
        var keyB = b.createAt;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    }).reverse();

    const last_index = list_posts_id.indexOf(last_id) + 1;

    console.log("last index = ", last_index)

    console.log(last_index);

    const new_post_count = post_length - last_index

    console.log("new post count = ", new_post_count);
    let return_posts;

    // uu tien lay cac phan tu moi ra truoc
    if (new_post_count < count) {
        return_posts = list_posts.slice(0, new_post_count);

        let last_index_post_for_return = index + count

        if (index <= 0) {
            index = new_post_count + 1
        }

        if (last_index_post_for_return > post_length) {
            last_index_post_for_return = post_length
        }

        let bonus_return_posts = list_posts.slice(index-1, last_index_post_for_return)

        return_posts.push(...bonus_return_posts)
    } else {
        return_posts = list_posts.slice(0, count)
    }

    let author, avatar;
    let return_data_of_posts = [];
    let username;
    let image_ids;

    for (post of return_posts) {
        post = post.toObject()
        if (!post.is_banned && !post.is_blocked) {
            if (!post.video && post.images) {
                image_ids = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
                post.images = image_ids
                // post.images = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
            }
            else if (post.video) {
                // video: `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${video._id}`,
                post.video = `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${post.video}`
            }

            author = await User.findById(post.author);

            if (author.avatar) {
                avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${author._id}/avatar`
            } else {
                avatar = undefined;
            }

            if (post.users_liked.toString().includes(req.user._id.toString())) {
                post.is_liked = true;
            } else {
                post.is_liked = false;
            }

            if (author.username) {
                username = author.username
            } else {
                username = `${author.sur_name} ${author.first_name}`
            }

            post.author = {
                "id": post.author,
                "name": username,
                "avatar": avatar,
                "online": author.online
            }

            //console.log("post = ", post)
            return_data_of_posts.push(post);
        }
    }

    //console.log("return post = ", return_posts)

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": return_data_of_posts,
        "new_items": new_post_count,
        "last_id": list_posts[0]._id
    })
})


// hien tai chi cho cap nhat cac image neu post co luu tru image
// nguoc lai, neu post luu tru video, neu co post_files thi se update nhu trong add post
const edit_post = asyncHandler(async (req, res, next) => {
    let post = await Post.findById(req.params.id)
    // console.log(req)

    if (!post) {
        return next(new ErrorResponse("Post not found.", 404))
    }

    // check ascess
    if (post.author.toString() !== req.user._id.toString()) {
        return next(
            new ErrorResponse(
              `User ${req.user._id} is not authorized to update this post`,
              401
            )
          );
    }


    let postUpdate = req.body

    // console.log("post update = ", postUpdate)
    const postNewFiles = req.files

    console.log(postNewFiles)

    // delete image
    if (postUpdate.image_del && post.media === "image") {
        let new_images = []
        // danh sach cac ID anh muon delete phai cach nhau bang dau ","
        const list_images_del = postUpdate.image_del.split(",")
        
        for (one_image of post.images) {
            if (!list_images_del.includes(one_image)) {
                new_images.push(one_image)
            }
        }

        // update list post images
        post.images = new_images

        // xoa bo truong image_del
        delete postUpdate.image_del

        const imgs_del = list_images_del.map(objID => mongoose.Types.ObjectId(objID))
        console.log("image delete = ", imgs_del)
        db.collection("images").deleteMany( { _id : { $in: imgs_del } } );
    }

    // update files
    if (postNewFiles) {
        let tmp_images = [];
        let tmp_videos = [];
        for (file of postNewFiles) {
            let preType, type;
            type = file.mimetype;
            if (!type.startsWith("image") && !type.startsWith("video")) {
                return next(new ErrorResponse(`Please upload only image type or video type.`))
            }
    
            preType = file.mimetype.slice(0, 5)
    
            if (preType === "image") {
                postUpdate.media = "image"
                const buffer = await sharp(file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    
                let image = {
                    image: buffer,
                    of_post: post._id,
                    owner: post.author
                }
    
                tmp_images.push(image)
                // post.images.push(buffer)
            }
            else {
                postUpdate.media = "video"
                let video = {
                    video: file.buffer,
                    of_post: post._id,
                    owner: post.author
                }
                tmp_videos.push(video)
                // post.video = file.buffer
            }
        }

        // console.log("hello world")
        if (tmp_images.length !== 0) {
            Image.collection.insert(tmp_images, function (err, docs) {
                if (err){ 
                    return next(new ErrorResponse("Save Images FAILED!!!", 500))
                } else {
                console.log("Multiple documents inserted to Image Collection");
                }
            });
        }

        if (tmp_videos.length !== 0) {
            Video.collection.insert(tmp_videos, function (err, docs) {
                if (err){ 
                    return next(new ErrorResponse("Save video FAILED!!!", 500))
                } else {
                console.log("video inserted to Video Collection");
                }
            });
        }
    }

    // update post
    // post = await Post.findByIdAndUpdate(post._id, postUpdate, { 
    //     new: true,
    //     runValidators: true
    // })
    for (const property in postUpdate) {
        console.log(`updating ${property} of post ${post._id}...`)
        post[property] = postUpdate[property]
    }

    // saving post
    await post.save()

    res.status(200).json({
        code: 1000,
        message: "OK",
        data: {
            id: post._id
        }
    })

})

const delete_post = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id)

    if (!post) {
        return next(new ErrorResponse("Post not found.", 404))
    }

    // check ascess
    if (post.author.toString() !== req.user._id.toString()) {
        return next(
            new ErrorResponse(
              `User ${req.user._id} is not authorized to update this post`,
              401
            )
          );
    }

    // set all image or video of post to undefined
    if (post.media === "image") {
        // const list_images = await Image.find({"of_post": post._id}).exec()
        // post.images = list_images.map(img => img._id)
        db.collection("images").updateMany({"of_post": post._id}, {"$set":{"of_post": undefined}})
    }
    else if (post.media === "video") {
        // const video = await Video.findOne({"of_post": post._id})
        // post.video = video._id
        db.collection("videos").updateMany({"of_post": post._id}, {"$set":{"of_post": undefined}})
    }

    // delete post
    await Post.findByIdAndDelete(post._id)
    res.status(200).json({ 
        code: 1000,
        message: "OK",
        id: post._id
    })
})

// gui request duoi dang json data
const report_post = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id)

    if (!post) {
        res.status(404).json({ 
            code: 9992,
            message: 'post is not found'
        })
    }

    else {
        const report = new Report({
            "subject": req.body.subject,
            "details": req.body.details,
            "of_post": post._id,
            "owner": req.user._id
        })

        await report.save()

        res.status(200).json({
            code: 1000,
            message: "Bai viet da nhan them mot report.",
            data: report
        })
    }
    
})


const like_post = asyncHandler(async (req, res, next) => {
    let post = await Post.findById(req.params.id)

    if (!post) {
        res.status(404).json({ 
            code: 9992,
            message: 'post is not found'
        })
    }

    if (post.users_liked.includes(req.user._id)) {

        for( var i = 0; i < post.users_liked.length; i++) {
            if (post.users_liked[i].toString() === req.user._id.toString()) {
                post.users_liked.splice(i, 1);
            }
        }

        post.like -= 1

        await post.save()

        res.status(200).json({
            code: 1000,
            message: `post ${post._id} is disliked by user: ${req.user._id}`
        })
    }
    else {

        post.like += 1
        post.users_liked.push(req.user._id)

        await post.save()

        res.status(200).json({
            code: 1000,
            message: `post ${post._id} has a new like by user: ${req.user._id}`
        })
    }
})

// khong co category_id
const check_new_items = asyncHandler(async (req, res, next) => {
    const last_id = req.params.id

    let list_posts = await Post.find({})

    const list_posts_id = list_posts.map(pst => pst._id.toString())

    const post_length = list_posts.length

    console.log("post length = ", post_length)

    list_posts.sort(function(a, b) {
        var keyA = a.createAt;
        var keyB = b.createAt;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    }).reverse();

    const last_index = list_posts_id.indexOf(last_id) + 1;

    const new_post_count = post_length - last_index

    console.log("new post count = ", new_post_count);

    let return_posts = list_posts.slice(0, new_post_count);
    let image_ids;

    for (post of return_posts) {
        if (!post.is_banned && !post.is_blocked) {
            if (!post.video && post.images) {
                image_ids = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
                post.images = image_ids
                // post.images = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
            }
            else if (post.video) {
                // video: `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${video._id}`,
                post.video = `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${post.video._id}`
            }
        }
    }

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "count": new_post_count,
        "new_items": return_posts
    })
})

const get_list_videos = asyncHandler(async (req, res, next) => {

    let {last_id, index, count} = req.query

    console.log("last id = ", last_id)

    let list_posts = await Post.find({"media": "video"})

    const post_length = list_posts.length

    console.log("post length = ", post_length)

    if (post_length !== 0) {

        const list_posts_id = list_posts.map(pst => pst._id.toString())

        list_posts.sort(function(a, b) {
            var keyA = a.createAt;
            var keyB = b.createAt;
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        }).reverse();

        const last_index = list_posts_id.indexOf(last_id) + 1;

        console.log("last index = ", last_index)

        console.log(last_index);

        const new_post_count = post_length - last_index

        console.log("new post count = ", new_post_count);
        let return_posts;

        // uu tien lay cac phan tu moi ra truoc
        if (new_post_count < count) {
            return_posts = list_posts.slice(0, new_post_count);

            let last_index_post_for_return = index + count

            if (index <= 0) {
                index = new_post_count + 1
            }

            if (last_index_post_for_return > post_length) {
                last_index_post_for_return = post_length
            }

            let bonus_return_posts = list_posts.slice(index-1, last_index_post_for_return)

            return_posts.push(...bonus_return_posts)
        } else {
            return_posts = list_posts.slice(0, count)
        }

        let author, avatar;
        let return_data_of_posts = [];
        let username;

        for (post of return_posts) {
            post = post.toObject()
            if (!post.is_banned && !post.is_blocked) {
                // if (!post.video && post.images) {
                //     const image_ids = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
                //     post.images = image_ids
                //     // post.images = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
                // }
                if (post.video) {
                    // video: `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${video._id}`,
                    post.video = `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${post.video}`
                }

                author = await User.findById(post.author);

                if (author.avatar) {
                    avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${author._id}/avatar`
                } else {
                    avatar = undefined;
                }

                if (post.users_liked.toString().includes(req.user._id.toString())) {
                    post.is_liked = true;
                } else {
                    post.is_liked = false;
                }

                if (author.username) {
                    username = author.username
                } else {
                    username = `${author.sur_name} ${author.first_name}`
                }

                post.author = {
                    "id": post.author,
                    "name": username,
                    "avatar": avatar,
                    "online": author.online
                }

                //console.log("post = ", post)
                return_data_of_posts.push(post);
            }
        }

        //console.log("return post = ", return_posts)

        res.status(200).json({
            "code": 1000,
            "message": "OK",
            "data": return_data_of_posts,
            "new_items": new_post_count,
            "last_id": list_posts[0]._id
        })
    } else {
        res.status(200).json({
            "code": 1000,
            "message": "OK",
            "data": [],
            "last_id": "undefined"
        })
    }
})



module.exports = {
    add_post,
    get_post,
    get_list_posts,
    edit_post,
    delete_post,
    report_post,
    like_post,
    check_new_items,
    get_list_videos,
}
