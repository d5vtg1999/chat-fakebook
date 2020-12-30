const path = require('path');
var db = require('../db/mongoose')
const mongoose = require('mongoose')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const Post = require('../models/post');
const Image = require('../models/images');
const Search = require('../models/search');


const set_search = asyncHandler(async (req, res, next) => {
    console.log("is searching...")
    let {keyword, index, count} = req.query

    if (keyword[0] !== "#") {
        await Search.create({
            "keyword": keyword,
            "author": req.user._id,
        })
    } else {
        keyword = keyword.slice(1)
        console.log(`searching for hastag ${keyword}`)
    }
    
    keyword = keyword.toLowerCase()
    let arr_words = keyword.split(' ');

    index = parseInt(index);
    count = parseInt(count)

    console.log("arr words = ", arr_words)
    if (!index || index < 0) {
        index = 0
    } else {
        index -= 1
    }
    if (!count || count < 0) {
        count = 1
    }
    
    let list_posts = await Post.find({});
    const len = list_posts.length

    const list_descriptions = list_posts.map(pst => pst.described);

    let description, cnt, j = 0;
    let sortable = [];
    for(j; j < len; j++) {
        cnt = 0
        description = list_descriptions[j].toLowerCase()
        //console.log("description = ", description)
        for (word of arr_words) {
            if (description.includes(word)) {
                cnt++;
            }
        }
        
        sortable.push([j, cnt])
    }

    sortable.sort(function(a, b) {
        return a[1] - b[1];
    }).reverse();

    let return_posts = [];

    if (index + count > len) {
        index = 0;
        count = len
    }

    let i = index, limit = 0;
    for (i; i < index+count; i++) {
        return_posts.push(list_posts[sortable[i][0]])
        limit++;
        if (limit === 10) {
            break;
        } else if (limit >= 1) {
            if (sortable[i][1] === 0) {
                break;
            }
        }
    }

    let author;
    let return_data_of_posts = [];

    for (post of return_posts) {
        post = post.toObject()
        if (!post.is_banned && !post.is_blocked) {
            if (!post.video && post.images) {
                const image_ids = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
                post.images = image_ids
                // post.images = post.images.map(image => `https://fakebook-mobileapp.herokuapp.com/IT4788/images/${image}`)
            }
            else if (post.video) {
                // video: `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${video._id}`,
                post.video = `https://fakebook-mobileapp.herokuapp.com/IT4788/videos/${post.video}`
            }

            author = await User.findById(post.author);

            //console.log("author = ", author)

            post.author = {
                "id": post.author,
                "name": `${author.sur_name} ${author.first_name}`,
                "avatar": `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${author._id}/avatar`,
                "online": author.online
            }

            //console.log("post = ", post)
            return_data_of_posts.push(post);
        }
    }

    console.log("sortable = ", sortable)
    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": return_data_of_posts
    })
})

const get_saved_search = asyncHandler(async (req, res, next) => {
    let {index, count} = req.query
    
    index = parseInt(index);
    count = parseInt(count)

    if (!index || index < 0) {
        index = 0
    } else {
        index -= 1
    }

    let list_searches = await Search.find({"author": req.user._id});
    const len_searches = list_searches.length

    if (!count || count < 0) {
        count = len_searches
    }

    if (index + count > len_searches) {
        index = 0;
        count = len_searches;
    }

    let return_searches = list_searches.slice(index, index + count);

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": return_searches
    })

})

const del_saved_search = asyncHandler(async (req, res, next) => {
    const search_id = req.query.search_id;
    const all = req.query.all;
    if (all === "1") {
        await Search.deleteMany( { "author" : req.user._id } );
    } else {
        const search = await Search.findById(search_id)
        if (search) {
            await search.remove();
        }
    }
    res.status(200).json({
        "code": 1000,
        "message": "OK"
    })
})

module.exports = {
    set_search,
    get_saved_search,
    del_saved_search
}
