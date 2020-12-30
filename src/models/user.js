const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const ErrorResponse = require('../utils/errorResponse')

const userSchema = new mongoose.Schema({

    // ten nguoi dung
    first_name: {
        type: String,
        required: false,
        trim: true
    },

    // ho + ten dem nguoi dung
    sur_name: {
        type: String,
        required: false,
        trim: true
    },

    date_of_birth: {
        type: Date,
        required: false
    },

    list_friends: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'User'
    },

    requested_friends: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'User'
    },

    requests_are_pending: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'User'
    },

    number_of_friends: {
        type: Number,
        default: 0
    },

    number_of_requested_friends: {
        type: Number,
        default: 0
    },

    number_of_requests_are_pending: {
        type: Number,
        default: 0
    },

    accepted_at: {
        type: [Date],
        default:[]
    },

    requested_at: {
        type: [Date],
        default: []
    },

    gender: {
        type: String,
        required: false
    },

    password: {
        type: String,
        required: [true, "Please add a password!"],
        minlength: 6,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },

    phone_number: {
        type: String,
        default: 0,
        required: [true, "Please addd a phone number."],
        validate(value) {
            if (value[0] != "0" || value.length != 10) {
                throw new Error("Phone number is invalid.")
            }
        }
    },

    verify_code: { 
        type: [String]
    },

    // link to avatar
    avatar: {
        type: Buffer,
    },

    cover_image: {
        type: Buffer
    },

    username: {
        type: String,
        default: undefined
    },

    address: {
        type: String
    },

    city: {
        type: String
    },

    country: {
        type: String
    },

    link: {
        type: String,
    },

    description: {
        type: String
    },

    token: {
        type: String,
    },

    ids_blocked: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },

    is_blocked: {
        type: Boolean,
        default: false
    },

    uuid: {
        type: String,
        required: false,
    },

    online: {
        type: Boolean,
        default: false
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

userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'author'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.token
    delete userObject.list_id
    delete userObject.verify_code
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.token = token
    await user.save()

    return token
}

userSchema.statics.findByPhoneNumber = async (phone_number) => {
    const user = await User.findOne({ phone_number })

    if (!user) {
        throw new Error('9995')
    }
    if (user.token) {
        throw new Error("1010")
    }
    return user
}

userSchema.statics.findByCredentials = async (phone_number, password, uuid) => {
    const user = await User.findOne({ phone_number })

    if (!user) {
        throw new ErrorResponse('User is not existed', 404)
    }
    
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new ErrorResponse('Password is incorrect', 400)
    }

    const devicedID = (user.uuid === uuid)
    if (!devicedID) {
        throw new ErrorResponse('UUID is incorrect', 400)
    }

    return user
}

userSchema.methods.authPassword = async function (password) {

    const user = this
    
    const isMatch = await bcrypt.compare(password, user.password)

    console.log(isMatch)

    if (!isMatch) {
        throw new ErrorResponse('Password is incorrect', 400)
    }


    return true;
}

// // Hash the plain text password before saving
// userSchema.methods.hashPassword = async function () {
//     const user = this
//     if (user.isModified('password')) {
//         user.password = await bcrypt.hash(user.password, 8)
//     }
//     //await user.save()
// }

const User = mongoose.model('User', userSchema)

module.exports = User