const path = require('path');
const bcrypt = require('bcryptjs')
const multer = require('multer')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const phoneToken = require('generate-sms-verification-code')
const User = require('../models/user');
const Phone = require('../models/phone');


const signup = asyncHandler(async (req, res, next) => {
    console.log(`sign up request is running...`)
    const generatedCode = phoneToken(6, {type: 'string'})
    const user = new User({
        ...req.query,
        verify_code: [generatedCode]
    })

    const {phone_number, password} = req.query

    const test1 = await User.findOne({ phone_number })
    const test2 = phone_number === password
    const test3 = password.length

    if (!test1 && !test2 && test3 <= 10) {
        await user.save()
        console.log("user is saved")
        // const token = await user.generateAuthToken()
        const phone = await Phone.create({
            phone_number,
            author: user._id,
        })
        
        console.log("phone is created")

        res.status(201).json({ 
            code: 1000,
            message: "OK",
        })
    }

    else if (test3 > 10) {
        return next(
            new ErrorResponse('Pass word is too long!', 400)
        )
    }

    else if (test2) {
        return next(
            new ErrorResponse('Password must be different from phone number!', 400)
        )
    }

    else {
        res.status(400).json({
            code: 9996,
            message: "User existed!",
            data:{}
        })
    }
});

const login = asyncHandler(async (req, res, next) => {
    const user = await User.findByCredentials(req.query.phone_number, req.query.password, req.query.uuid)
    const token = await user.generateAuthToken()
    user.token = token
    await user.save()
    res.status(200).json({
        code: 1000,
        message: "OK",
        data: { user, token }
    })
});

const get_verify_code  = asyncHandler(async (req, res, next) => {
    // console.log("req query = ", req.query)
    const phone_number = req.query.phone_number
    const user = await User.findByPhoneNumber(phone_number)
    if (!user) {
        res.status(404).json({ 
            code: 9995,
            message: "Phone number is not registered."
        })
    }
    if (user.verify_code.length === 0) {
        res.status(400).json({ 
            code: 1010,
            message: "Phone number already verified."
        })
    }

    user.verify_code.push(phoneToken(6, {type: 'string'}))
    await user.save()
    const verify_code = user.verify_code[0]

    // const phone = await Phone.findOneAndUpdate({ phone_number }, { is_verified: true})

    // user.hashPassword()

    res.status(200).json({
        code: 1000,
        message: "OK",
        data: { phone_number, password: user.password , verify_code }
    })
});

const check_verify_code = asyncHandler(async (req, res, next) => {
    const phone_number = req.query.phone_number
    const user = await User.findOne({ phone_number })

    if (!user) {
        res.status(404).json({ 
            code: 9995,
            message: "Phone number is not resigtered."
        })
    }

    const phone = await Phone.findOne({ phone_number })

    const isMatch = user.verify_code.includes(req.query.verify_code)

    if (!isMatch) {
        res.status(400).json({
            code: 1004,
            message: "verify code is not exist"
        })
    }

    else if (phone.is_verified) {
        res.status(400).json({
            code: 9996,
            message: "Phone number is already verified"
        })
    }

    else {
        await Phone.findOneAndUpdate({ phone_number }, { is_verified: true})

        user.password = await bcrypt.hash(user.password, 8)
        const token = await user.generateAuthToken()

        res.status(200).json({
            code: 1000,
            message: "OK",
            data: { 
                token,
                id: user._id
            }
        })
    }
});

const logout = asyncHandler(async (req, res, next) => {
    // console.log(req)
    req.user.token = undefined
    await req.user.save()
    res.status(200).json({
        code: 1000,
        message: "OK",
        data: {}
    })
});

const change_info_after_signup = asyncHandler(async (req, res, next) => {
    // console.log("req = ", req)
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    const user = req.user
    user.avatar = buffer
    const {first_name, sur_name} = req.query
    console.log("first name = ", first_name);
    console.log("sur name = ", sur_name);

    // if (!req.files) {
    //     return next(new ErrorResponse(`Please upload a file`, 400));
    // }

    // const file = req.files.avatar
    // // Make sure the image is a photo
    // if (!file.mimetype.startsWith('image')) {
    //     return next(new ErrorResponse(`Please upload an image file`, 400));
    // }

    // if (file.size > 1000000000) {
    //     return next(new ErrorResponse('Please upload an image less than 1000000000',400));
    // }

    // // Create custom filename
    // file.name = `photo_${user._id}${path.parse(file.name).ext}`;

    // file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    //     if (err) {
    //       console.error(err);
    //       return next(new ErrorResponse(`Problem with file upload`, 500));
    //     }

    //     const infoUpdate = {
    //         first_name,
    //         sur_name,
    //         avatar: file.name,
    //         modifiedAt: Date.now()
    //     }
    
    //     await User.findByIdAndUpdate(user._id, infoUpdate);
    
    //     res.status(200).json({
    //         code: 1000,
    //         message: "OK",
    //         data: {
    //             id: user._id,
    //             first_name,
    //             sur_name,
    //             phone_number: user.phone_number,
    //             created: user.createAt,
    //             modified: infoUpdate.modifiedAt,
    //             avatar: file.name
    //         }
    //     });
    // });
    const infoUpdate = {
        first_name,
        sur_name,
        avatar: user.avatar,
        modifiedAt: Date.now()
    }
    await User.findByIdAndUpdate(user._id, infoUpdate)
    res.status(200).json({
        code: 1000,
        message: "OK",
        data: {
            id: user._id,
            first_name,
            sur_name,
            phone_number: user.phone_number,
            created: user.createAt,
            modified: infoUpdate.modifiedAt,
            avatar: `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${user._id}/avatar`
            // avatar: `http://localhost:3000/IT4788/users/${user._id}/avatar`
        }
    })
})

const get_avatar_image = asyncHandler(async (req, res, next) => {
    // console.log("id = ", req.params.id)
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
        throw new ErrorResponse("User or Avatar is not found", 404)
    }
    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
})

const get_cover_image = asyncHandler(async (req, res, next) => {
    // console.log("id = ", req.params.id)
    const user = await User.findById(req.params.id)

    if (!user || !user.cover_image) {
        throw new ErrorResponse("User or cover_image is not found", 404)
    }
    res.set('Content-Type', 'image/png')
    res.send(user.cover_image)
})

const set_request_friend = asyncHandler(async (req, res, next) => {
    
    let client = await User.findById(req.params.id)
    if (!client) {
        return next(new ErrorResponse("Khong tim thay nguoi duoc yeu cau", 404))
    }

    let user = req.user;

    if (req.user.requested_friends.includes(client._id)) {
        return next(new ErrorResponse("Khong the gui lai yeu cau", 400))
    }
    user.requested_friends.push(client._id)
    user.number_of_requested_friends += 1
    await user.save()

    client.requests_are_pending.push(user._id)
    client.number_of_requests_are_pending += 1
    client.requested_at.push(Date.now())
    await client.save()

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": {
            "requested_friends": user.number_of_requested_friends
        }
    })
})

const set_accept_friend = asyncHandler(async (req, res, next) => {
    let client = await User.findById(req.params.id)
    if (!client) {
        return next(new ErrorResponse("Khong tim thay nguoi de accept", 404))
    }

    if (!client.requested_friends.includes(req.user._id)) {
        return next(new ErrorResponse("Khong tim thay nguoi de accept", 404))
    }

    let user = req.user

    if (req.query.is_accept === "1") {

        // xoa client khoi danh sach loi moi ket ban duoc nhan
        let peoples = []
        for (request of user.requests_are_pending) {
            if (request.toString() !== client._id.toString()) {
                peoples.push(request)
            }
        }
        user.requests_are_pending = peoples;
        user.number_of_requests_are_pending -= 1
        
        // them client vao danh sach ban be
        user.list_friends.push(client._id)
        user.number_of_friends += 1
        user.accepted_at.push(Date.now())

        await user.save()

        // them user vao danh sach ban be
        client.list_friends.push(user._id)
        client.number_of_friends += 1
        client.accepted_at.push(Date.now())

        // xoa user khoi danh sach yeu cau ket ban
        let requests = []
        for (re of client.requested_friends) {
            if (re.toString() !== user._id.toString()) {
                requests.push(re)
            }
        }
        client.requested_friends = requests
        client.number_of_requested_friends -= 1

        await client.save()

        res.status(200).json({
            "code": 1000,
            "message": "Cac ban da la ban be cua nhau",
        })
    } else {

        // xoa client khoi danh sach loi moi ket ban duoc nhan
        let peoples = []
        for (request of user.requests_are_pending) {
            if (request.toString() !== client._id.toString()) {
                peoples.push(request)
            } else {
                user.number_of_requests_are_pending -= 1
            }
        }
        user.requests_are_pending = peoples;
        console.log("requests are pending = ", user.requests_are_pending)
        

        await user.save()

        res.status(200).json({
            "code": 1000,
            "message": "Xoa loi moi thanh cong",
        })
    }
})

const get_requested_friends = asyncHandler(async (req, res, next) => {
    let {index, count} = req.query

    index = parseInt(index);
    count = parseInt(count)

    if (!index || index < 0) {
        index = 0
    } else {
        index -= 1
    }
    if (!count || count < 0) {
        count = req.user.number_of_requests_are_pending
    }

    let requested_friends = req.user.requests_are_pending
    let requested_at = req.user.requested_at

    if (index + count > req.user.number_of_requests_are_pending) {
        index = 0;
        count = req.user.number_of_requests_are_pending;
    }

    let return_users = requested_friends.slice(index, index + count);
    let return_times = requested_at.slice(index, index + count)

    let return_data = [];
    let avatar, info, same_friends;
    const n = return_times.length

    for (let i = 0; i < n; i++) {
        same_friends = 0;
        let tmp_user = await User.findById(return_users[i]);

        if (tmp_user.avatar) {
            avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${return_users[i]}/avatar`
        } else {
            avatar = "-1";
        }

        for (fr in tmp_user.list_friends) {
            if (req.user.list_friends.includes(fr)) {
                same_friends++;
            }
        }

        info = {
            "id": return_users[i],
            "username": `${tmp_user.sur_name} ${tmp_user.first_name}`,
            "avatar": avatar,
            "same_friends": same_friends,
            "created": return_times[i]
        }

        return_data.push({
            "info": info,
            "total": req.user.number_of_requests_are_pending
        })
    }

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": return_data
    })

})

// nhan du lieu dang json data
const change_password = asyncHandler(async (req, res, next) => {
    let {password, new_password} = req.body
    let user = req.user

    if (!user.authPassword(password)) {
        return next(new ErrorResponse("Mau khong khong dung", 400))
    }

    new_password = await bcrypt.hash(new_password, 8)

    console.log("new password = ", new_password)

    await User.findByIdAndUpdate(user._id, {"password": new_password})

    res.status(200).json({
        "code": 1000,
        "message": "OK"
    })
})

const get_user_friends = asyncHandler(async (req, res, next) => {
    let {user_id, index, count} = req.query

    let client = await User.findById(user_id)

    if (!client) {
        return next(new ErrorResponse("Khong tim thay nguoi dung", 404))
    }

    index = parseInt(index);
    count = parseInt(count)

    if (!index || index <= 0) {
        index = 0
    } else {
        index -= 1
    }
    if (!count || count < 0) {
        count = client.number_of_friends
    }

    let list_friends = client.list_friends
    let accepted_at = client.accepted_at

    if (index + count > client.number_of_friends) {
        index = 0;
        count = client.number_of_friends;
    }

    let return_users = list_friends.slice(index, index + count)
    let return_times = accepted_at.slice(index, index + count)

    let return_data = [];
    let avatar, info, same_friends;
    const n = return_times.length

    for (let i = 0; i < n; i++) {
        same_friends = 0;
        let tmp_user = await User.findById(return_users[i]);

        for (fr in tmp_user.list_friends) {
            if (req.user.list_friends.includes(fr)) {
                same_friends++;
            }
        }

        if (tmp_user.avatar) {
            avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${return_users[i]}/avatar`;
        } else {
            avatar = "-1";
        }

        info = {
            "id": return_users[i],
            "username": `${tmp_user.sur_name} ${tmp_user.first_name}`,
            "avatar": avatar,
            "same_friends": same_friends,
            "created": return_times[i]
        }

        return_data.push({
            "friends": info,
            "total": client.number_of_friends
        })
    }

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": return_data
    })

})

// truyen user_id la tham so va type nhu la doi so cho truy van (trong duong dan)
const set_block = asyncHandler(async (req, res, next) => {
    
    let client = await User.findById(req.query.user_id)

    if (!client) {
        return next(new ErrorResponse("Khong tim thay nguoi de thiet lap Block", 404))
    }

    let type = req.query.type

    if (type !== "0" && type !== "1") {
        return next(new ErrorResponse("type khong hop le, phai bang 0 hoac 1", 400))
    }

    let user = req.user;

    if (user._id.toString() === client._id.toString()) {
        return next(new ErrorResponse("Khong the block or unblock chinh minh", 400))
    }
    
    let tmp_ids;

    if (req.user.ids_blocked.includes(client._id) && type === "0") {
        return next(new ErrorResponse("Ban da block nguoi nay", 400))
    } else if (!req.user.ids_blocked.includes(client._id) && type === "1") {
        return next(new ErrorResponse("Ban chua block nguoi nay", 400))
    }
    else if (req.user.ids_blocked.includes(client._id)) {

        // xoa client khoi danh sach nhung nguoi minh block
        tmp_ids = [];
        for (i of user.ids_blocked) {
            if (i.toString() !== client._id.toString()) {
                tmp_ids.push(i)
            }
        }

        user.ids_blocked = tmp_ids

        await user.save()

        res.status(200).json({
            "code": 1000,
            "message": "Unblock thanh cong."
        })


    } else {
        // xoa client khoi danh sach ban be cua user
       
        if (user.list_friends.length > 0) {
            tmp_ids = []
            for (f of user.list_friends) {
                if (f.toString() !== client._id.toString()) {
                    tmp_ids.push(f)
                }
            }
            user.list_friends = tmp_ids
        }
        user.ids_blocked.push(client._id)
        await user.save()

        // xoa user khoi danh sach ban be cua client
        if (client.list_friends.length > 0) {
            tmp_ids = []
            for (f2 of client.list_friends) {
                if (f2.toString() !== user._id.toString()) {
                    tmp_ids.push(f2)
                }
            }

            client.list_friends = tmp_ids
            await client.save()
        }

        res.status(200).json({
            "code": 1000,
            "message": "Block thanh cong",
        })
    }
    
})

const get_list_blocks = asyncHandler(async (req, res, next) => {
    let {index, count} = req.query

    index = parseInt(index);
    count = parseInt(count)

    if (!index || index < 0) {
        index = 0
    } else {
        index -= 1
    }
    if (!count || count < 0) {
        count = req.user.ids_blocked.length
    }

    let list_blocks = req.user.ids_blocked
    let number_of_ids_blocked = list_blocks.length

    if (index + count > number_of_ids_blocked) {
        index = 0;
        count = number_of_ids_blocked;
    }

    let return_users = list_blocks.slice(index, index + count)

    let return_data = [];
    let avatar, info;
    let n;
    if (return_users) { 
        n = return_users.length;
    }
    else {
        n = 0;
    }

    for (let i = 0; i < n; i++) {
        let tmp_user = await User.findById(return_users[i]);

        if (tmp_user.avatar) {
            avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${return_users[i]}/avatar`;
        } else {
            avatar = "-1";
        }

        info = {
            "id": return_users[i],
            "username": `${tmp_user.sur_name} ${tmp_user.first_name}`,
            "avatar": avatar,
        }

        return_data.push(info)
    }

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": return_data
    })

})

const get_user_info = asyncHandler(async (req, res, next) => {
    let client
    if (!req.query.user_id) {
        client = req.user
    } else {
        client = await User.findById(req.query.user_id)
        if (!client) {
            return next(new ErrorResponse("Khong tim thay nguoi nay", 404))
        }

        // kiem tra xem user co bi client block hay khong
        if (client.ids_blocked.includes(req.user._id)) {
            return next(new ErrorResponse("Co the ban da bi block boi nguoi nay", 400))
        }

        // kiem tra xem user da block client hay chua
        if (req.user.ids_blocked.includes(client._id)) {
            return next(new ErrorResponse("Co the ban da block nguoi nay", 400))
        }
    }

    let avatar, cover_image, is_friend = false;
    if (client.avatar) {
        avatar = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${client._id}/avatar`;
    } else {
        avatar = "-1";
    }
    if (client.cover_image) {
        cover_image = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${client._id}/cover_image`;
    } else {
        cover_image = "-1"
    }

    if (client.list_friends.includes(req.user._id)) {
        is_friend = true
    }

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": {
            "id": client._id,
            "username": `${client.sur_name} ${client.first_name}`,
            "created": client.createAt,
            "avatar": avatar,
            "cover_image": cover_image,
            "listing": client.number_of_friends,
            "is_friend": is_friend,
            "online": "-1"
        }
    })
})

const set_user_info = asyncHandler(async (req, res, next) => {
    let user = req.user;
    let avatar, buffer_avatar;
    let cover_image, buffer_cover_image;
    let ava, cover;

    if (req.files) {
        if (req.files['avatar']) {
            avatar = req.files['avatar'][0]
        }
        if (req.files['cover_image']) {
            cover_image = req.files['cover_image'][0]
        }
    }

    console.log("avatar = ", avatar)
    console.log("cover_image = ", cover_image)

    if (avatar) {
        buffer_avatar = await sharp(avatar.buffer).resize({width: 250, height: 250}).png().toBuffer()
        ava = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${user._id}/avatar`
    } else if (user.avatar) {
        ava = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${user._id}/avatar`
    }

    if (cover_image) {
        buffer_cover_image = await sharp(cover_image.buffer).resize({width: 250, height: 250}).png().toBuffer()
        cover = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${user._id}/cover_image`
    } else if (user.cover_image) {
        cover = `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${user._id}/cover_image`
    }

    let infoUpdate = req.body;
    if (buffer_avatar) {
        infoUpdate.avatar = buffer_avatar;
    }
    if (buffer_cover_image) {
        infoUpdate.cover_image = buffer_cover_image;
    }

    console.log("info update = ", infoUpdate);

    await User.findByIdAndUpdate(user._id, infoUpdate);

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": {
            "avatar": ava,
            "cover_image": cover,
            "link": req.body.link,
            "country": req.body.country
        }
    })

    
    // console.log("req = ", req)
    // const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    // const user = req.user
    // user.avatar = buffer
    // const {first_name, sur_name} = req.query
    // console.log("first name = ", first_name);
    // console.log("sur name = ", sur_name);

    // const infoUpdate = {
    //     first_name,
    //     sur_name,
    //     avatar: user.avatar,
    //     modifiedAt: Date.now()
    // }
    // await User.findByIdAndUpdate(user._id, infoUpdate)
    // res.status(200).json({
    //     code: 1000,
    //     message: "OK",
    //     data: {
    //         id: user._id,
    //         first_name,
    //         sur_name,
    //         phone_number: user.phone_number,
    //         created: user.createAt,
    //         modified: infoUpdate.modifiedAt,
    //         avatar: `https://fakebook-mobileapp.herokuapp.com/IT4788/users/${user._id}/avatar`
    //         // avatar: `http://localhost:3000/IT4788/users/${user._id}/avatar`
    //     }
    // })
})

module.exports = {
    signup,
    login,
    get_verify_code,
    check_verify_code,
    logout,
    change_info_after_signup,
    get_avatar_image,
    get_cover_image,
    set_request_friend,
    set_accept_friend,
    get_requested_friends,
    change_password,
    get_user_friends,
    set_block,
    get_list_blocks,
    get_user_info,
    set_user_info,
}