const jwt = require('jsonwebtoken')
const User = require('../models/user')
const ErrorResponse = require('../utils/errorResponse')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'token': token })

        if (!user) {
            throw new ErrorResponse('User is not exist.', 404)
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        return next(new ErrorResponse('Please authenticate.', 401))
    }
}

module.exports = auth