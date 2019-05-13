const Label = require('../models/labelModel')
const auth = require('../util/auth');
const rule = require('../util/rule');
const router = require('express').Router();

router.get('/', auth.isLogin ,function (req, res) {

    Label.getAllLabel().then((data) => {
        res.json(data);
    })
});

module.exports = router;
