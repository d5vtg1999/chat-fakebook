const express = require('express')
const Search = require('../models/search')
const auth = require('../middleware/auth')
const {set_search, get_saved_search, del_saved_search} = require('../controllers/search')
const router = new express.Router()

router.post('/IT4788/search', auth, set_search);
router.post('/IT4788/search/get_saved_search', auth, get_saved_search);
router.post('/IT4788/search/del_saved_search', auth, del_saved_search);

module.exports = router