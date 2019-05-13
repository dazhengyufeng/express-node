const User = require('../models/userModel');


// 200 成功
// 200101 权限不足
// 200102 登陆失败
// 200103 没用该用户
// 200104 密码错误
// 200105 异常操作失败
// 200106 参数异常
// 200107 无效token
// 200108 未找到该数据
// 200109 删除数据失败
// 200110 添加的用户已离职
module.exports = {
    isP1:function(req, res, next){
        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }
            if(result.user.role !== 'P1' ){
                return  res.json({err:'权限不足',code: 200101})
            }
            req.headers.user =  result.user
            next()
        })

    },
    isP2: function(req, res, next){

        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }
            if(result.user.role !== 'P2' ){
                return  res.json({err:'权限不足',code: 200101})
            }

            req.headers.user =  result.user
            next()
        })

    },
    isP1OrP2: function(req, res, next){
        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }
            if(result.user.role !== 'P2' && result.user.role !== 'P1'){
                return  res.json({err:'权限不足',code: 200101})
            }
            req.headers.user =  result.user
            next()
        })
    },
    isP2OrP3: function(req, res, next){
        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }
            if(result.user.role === 'P1'){
                return  res.json({err:'权限不足',code: 200101})
            }
            req.headers.user =  result.user
            next()
        })
    },
    isLogin: function(req,res, next){
        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }
            req.headers.user =  result.user
            next()
        })
    },
    isSelfOrP1OrP2 : function(req, res, next){
        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }

            if ((result.user.role === 'P3' && req.params.id == result.user._id) ||
                result.user.role === 'P1' || result.user.role === 'P2') {
                req.headers.user =  result.user
                return next()
            }
            return   res.json({err: '权限不足', code: 200101, user: null})
        })
    },
    isSelf: function(req, res, next){
        let {studentid, token} = req.headers;
        User.getUserByToken({studentID:studentid, token}).then((result)=>{
            if(result.err){
                return res.json(result)
            }


            if (req.params.id == result.user._id){
                req.headers.user =  result.user
                return next()
            }
            return   res.json({err: '权限不足', code: 200101, user: null})
        })
    }
}
