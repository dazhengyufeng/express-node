const db = require('../config/db.js');
const config = require('../config/config');


const md5 = require('md5');
const uuid = require('uuid');
const mongoose = require('mongoose');

const uniqueValidator = require('mongoose-unique-validator');


function handlePassword(password) {
    return md5(config.md5Key + password)
}

const Schema = mongoose.Schema;
//创建Schema
const userSchema = new Schema({
    studentID: {type: String, required: true, unique: true},
    password: String,
    name: {type: String, required: true,},
    phoneNumber: {type: String},
    telephone: String,
    wechat: String,
    email: {type: String},
    skills: String,
    startPassword: String,
    token: String,
    hadAuthentication: Boolean,
    isWorking: {
        type: Boolean,
        default: true
    },
    loadRate: Number,
    role: '',
    createTime: {
        type    : Date,
        default : Date.now
    },
});

userSchema.plugin(uniqueValidator, { message: ' 已存在' });





function handleUserInfo(user) {
    let {name, token, phoneNumber, telephone, wechat, email, skills, studentID, _id, hadAuthentication, role, loadRate, isWorking} = user;
    return {name, token, phoneNumber, telephone, wechat, email, skills, studentID, _id, hadAuthentication,role, loadRate,isWorking}
}
function handleUserInfoWithStartPassword(user) {
    let {name, phoneNumber, telephone, wechat, email, skills, studentID, _id, hadAuthentication, role, startPassword, loadRate,isWorking} = user;
    return {name, phoneNumber, telephone, wechat, email, skills, studentID, _id, hadAuthentication,role,startPassword, loadRate,isWorking}
}

userSchema.statics.updateWorkingStatus = function(userInfo){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103}
        User.findOne({_id: userInfo._id}).then(user=>{
            if(!user){
                return resolve(result)
            }
            user.isWorking =  userInfo.isWorking;
            user.save((err, user)=>{
                if(err){

                    let errors = err.errors;
                    errors = Object.keys(errors).map(key=>{
                        return errors[key].path + '='+ errors[key].value + errors[key].message
                    }).join(',')
                    return resolve({
                        err: errors,
                        user: null,
                        code : 200106
                    })
                }

                resolve({
                    err: err,
                    user: handleUserInfoWithStartPassword(user),
                    code : 200
                })
            })
        });
    }))
};


userSchema.statics.updateLoadingRate = function(userInfo){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103}
        User.findOne({_id: userInfo._id}).then(user=>{
            if(!user){
                return resolve(result)
            }
            user.loadRate =  userInfo.loadRate;
            user.save((err, user)=>{
                if(err){
                    let errors = err.errors;
                    errors = Object.keys(errors).map(key=>{
                        return errors[key].path + '='+ errors[key].value + errors[key].message
                    }).join(',')
                    return resolve({
                        err: errors,
                        user: null,
                        code : 200106
                    })
                }

                resolve({
                    err: err,
                    user: handleUserInfoWithStartPassword(user),
                    code : 200
                })
            })
        });
    }))
};






userSchema.statics.createUser = function (newUser) {
    return new Promise((resolve => {
        newUser.startPassword = parseInt((1 + Math.random()) * 100000);
        newUser.hadAuthentication = false;
        newUser.role = newUser.role||'P3';
        newUser.isWorking = true;

        User.findOne({studentID : newUser.studentID}).then(user=>{
            if(!user){
                new User(newUser).save(function (err, user) {
                    if(err){
                        let errors = err.errors;
                        errors = Object.keys(errors).map(key=>{
                            return errors[key].path + '='+ errors[key].value + errors[key].message
                        }).join(',')

                        return resolve({
                            err: errors,
                            user: null,
                            code : 200106
                        })
                    }

                    resolve({
                        err: err,
                        user: handleUserInfoWithStartPassword(user),
                        code : 200
                    })
                })
            }else{
                if(user.isWorking){
                    return resolve({err:'学号'+ user.studentID +'已存在',user,code: 200106})
                }
                resolve({err:'学号'+ user.studentID + "已存在且处于离职状态",user,code: 200110})
            }
        })

    }))
};



userSchema.statics.getUserByToken = function(userInfo){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103};
        User.findOne({studentID: userInfo.studentID}).then((user) => {
            if (!user) {
                return resolve(result)
            }

           if(!user.token || user.token !== userInfo.token){
               result = {err: '无效token', user: null, code: 200107}
               return resolve(result)
           }
           resolve({err:null, user: handleUserInfo(user) ,code: 200})
        })
    }))
};



userSchema.statics.login = function (userInfo) {
    userInfo.passwordMd = handlePassword(userInfo.password);
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103};
        User.findOne({studentID: userInfo.studentID}).then((user) => {
            if (!user) {
                return resolve(result)
            }
            if(!user.isWorking){
                result = {err: '用户已离职', user: null, code: 200104}
                return resolve(result)
            }

            if (user.password && user.password !== userInfo.passwordMd) {
                result = {err: '密码错误', user: null, code: 200104}
                return resolve(result)
            }
            if (!user.password && user.startPassword !== userInfo.password) {
                result = {err: '密码错误', user: null, code: 200104}
                return resolve(result)
            }
            user.token = uuid.v1();
            user.save((err, user) => {
                if (err) {
                    result = {err: '更新token失败', user: null}
                    return resolve(result)
                }
                resolve({err: null, user: handleUserInfo(user),code: 200})
            })
        })
    }))
};


userSchema.statics.initUserInfo = function (userInfo) {
    userInfo.password = handlePassword(userInfo.password);
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103};
        User.findOne({studentID: userInfo.studentID,_id: userInfo._id}).then((user) => {
            if (!user) {
                return resolve(result)
            }
            user.password = userInfo.password;

            user.phoneNumber = userInfo.phoneNumber;
            user.telephone = userInfo.telephone;
            user.wechat = userInfo.wechat;
            user.email = userInfo.email;
            user.skills = userInfo.skills;
            user.hadAuthentication = true;
            user.save((err, user) => {
                if (err) {
                    result = {err: '更新失败', user: null,message:err}
                    return resolve(result)
                }
                resolve({err: null, user: handleUserInfo(user),code: 200})
            })
        })
    }))
};

userSchema.statics.getAllUser = function () {
    return new Promise((resolve => {
        User.find()
            .sort("-createTime")
            .then((userList) => {
             userList =  userList.map(user=>{
                 return handleUserInfoWithStartPassword(user)
             });
            resolve({err: null, userList,code:200})
        })
    }))
};

userSchema.statics.updateUserRole =  function(userInfo){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103};
        User.findOne({_id: userInfo._id}).then((user) => {
            if (!user) {
                return resolve(result)
            }
            user.role = userInfo.role;
            user.save((err, user) => {
                if (err) {
                    result = {err: '更新失败', user: null}
                    return resolve(result)
                }
                resolve({err: null, user: handleUserInfoWithStartPassword(user),code: 200})
            })
        })
    }))
};

userSchema.statics.logout = function(_id){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103};
        User.findOne({_id: _id}).then((user) => {
            if (!user) {
                return resolve(result)
            }
            user.token = undefined;
            user.save((err, user) => {
                if (err) {
                    result = {err: '更新失败', user: null}
                    return resolve(result)
                }
                resolve({err: null, user: null,code: 200})
            })
        })
    }))
};

userSchema.statics.getUserById =  function(_id){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103};


        User.findOne({_id: _id}).then((user) => {

            if (!user) {
                return resolve(result)
            }
          return resolve({err: null, code:200, user:handleUserInfoWithStartPassword(user)})
        })
    }))
};
userSchema.statics.deleteMember = function(user_id){
    return new Promise((resolve => {
        let result = {err: '未找到该用户', user: null,code: 200103}
        User.findOne({_id: user_id}).then(user=>{
            if(!user){
                return resolve(result)
            }
            user.delete((err)=>{
                if (err) {
                    return resolve({err: "删除用户失败", code: 200108})
                }
                resolve({err: null , code: 200})
            })
        });
    }))
};






// userSchema.statics.updateUserInfo = function (userInfo) {
//     userInfo.password = handlePassword(userInfo.password);
//     return new Promise((resolve => {
//         let result = {err: '未找到该用户', user: null,code: 200103};
//         User.findOne({studentID: userInfo.studentID,_id: userInfo._id}).then((user) => {
//             if (!user) {
//                 return resolve(result)
//             }
//             if (user.hadAuthentication && user.password !== userInfo.password) {
//                 result = {err: '密码错误', user: null, code: 200104}
//                 return resolve(result)
//             }
//             if(!user.hadAuthentication){
//                 user.password = userInfo.password;
//             }
//             user.phoneNumber = userInfo.phoneNumber;
//             user.telephone = userInfo.telephone;
//             user.wechat = userInfo.wechat;
//             user.email = userInfo.email;
//             user.skills = userInfo.skills;
//             user.save((err, user) => {
//                 if (err) {
//                     result = {err: '更新失败', user: null}
//                     return resolve(result)
//                 }
//                 resolve({err: null, user: handleUserInfo(user),code: 200})
//             })
//         })
//     }))
// };




const User = db.model('User', userSchema);
module.exports = User;
