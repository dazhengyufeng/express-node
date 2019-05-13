const Class = require('../models/classModel')
const auth = require('../util/auth');
const rule = require('../util/rule');
const router = require('express').Router();

router.get('/', auth.isLogin, function (req, res) {
    Class.getAllClass().then((data) => {
        res.json(data);
    })
});

module.exports = router;
