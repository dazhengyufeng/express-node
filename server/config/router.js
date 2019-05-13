var express = require('express');
var router = express.Router();

var projectController = require('../controller/projectController');
var userController = require('../controller/userController');
var classController =  require('../controller/classController');
var labelController = require('../controller/labelController');

router.use('/projects', projectController);
router.use('/users',userController);
router.use('/labels', labelController);
router.use('/classes',classController);

module.exports = router;
