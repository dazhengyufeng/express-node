const User = require('../models/userModel')
const auth = require('../util/auth');
const rule = require('../util/rule');
const Time = require('../util/time');
const router = require('express').Router();
const ProjectTask = require('../models/projectTaskModel');
const ProjectMember = require('../models/projectMemberModel');
var _ = require('lodash');

function getUserInfoEorror(user) {
    for (let key in user) {
        if (rule.user[key] && !rule.user[key](user[key])) {
            return {err: '参数' + key + "错误", code: 200106};
        }
    }
    return null;
}

function handleUserTaskList(taskList) {
    taskList = _.groupBy(taskList, (task) => {
        return task.startTime
    });
    let timeList = _.keys(taskList)
    timeList.sort((a,b)=>{
        return b - a
    });
    return _.map(timeList, (startTime) => {
        return taskList[startTime]
    })

}

router.post('/login', function (req, res) { //登陆
    let {studentID, password} = req.body;
    User.login({studentID, password}).then((data) => {
        res.json(data);
    })
});

router.put('/logout',auth.isLogin,function(req,res){
    User.logout(req.headers.user._id).then(result=>{
        res.json(result)
    })
});
router.post('/', auth.isP2, function (req, res) { //创建

    let userList = req.body.userList;
    let promiseAll = userList.map(user => {
        let err = getUserInfoEorror(user)
        if (err) {
            return err;
        }
        return User.createUser(user)
    });
    Promise.all(promiseAll).then(result => {
        res.json(result)
    })

});

router.put('/:id/init', auth.isSelf, function (req, res) {  //初始化信息
    let currentUser = req.headers.user;
    let {password, phoneNumber, telephone, wechat, email, skills} = req.body;
    let _id = req.params.id;


    let user = {password, phoneNumber, telephone, wechat, email, skills}
    let err = getUserInfoEorror(user);
    if (err) {
        return res.json(err)
    }

    let studentID = currentUser.studentID;

    User.initUserInfo({password, phoneNumber, telephone, wechat, email, skills, _id, studentID}).then((result) => {
        res.json(result)
    })
});

router.put('/:id/workingStatue', auth.isP2, function (req, res) {  //初始化信息
    let user = {_id: req.params.id, isWorking: req.body.isWorking}
    User.updateWorkingStatus(user).then((result) => {
        res.json(result)
    })
});

router.delete('/:id', auth.isP2, function (req, res) {  //初始化信息
    let user_id = req.params.id;
    User.deleteMember(user_id).then((result)=>{
        res.json(result)
    })
});


router.put('/:id/loadRate', auth.isLogin, function (req, res) {  //初始化信息

    let currentUser = req.headers.user;
    let _id = req.params.id;
    if (currentUser._id != _id) {
        return res.json({err: '权限不足', code: 200101});
    }
    let user = {_id: req.params.id, loadRate: req.body.loadRate}

    User.updateLoadingRate(user).then((result) => {
        res.json(result)
    })
});


router.put('/:id/role', auth.isP2, function (req, res) { //更新角色
    let userInfo = {_id: req.params.id, role: req.body.role};
    if (!rule.user.role(userInfo.role)) {
        return res.json({err: "角色名称不存在", code: 200106})
    }
    User.updateUserRole(userInfo).then((result) => {
        res.json(result)
    })
});
router.get("/", auth.isP1OrP2, function (req, res) { //用户列表
    User.getAllUser().then((allUserResult) => {
        ProjectMember.getAllMember().then(memberResult=>{
            allUserResult = JSON.parse(JSON.stringify(allUserResult));
            let memberList = _.groupBy(memberResult.memberList, member=>{
                return member.user
            });
            allUserResult.userList.forEach(user=>{
                // console.log(memberList[user._id]);

                user.projectList = (memberList[user._id]||[]).map(memberProject=> memberProject.project)
            });



            res.json(allUserResult)

        });

    })
});

router.get('/:id', auth.isSelfOrP1OrP2, function (req, res) { //获取用户信息

    User.getUserById(req.params.id).then((result) => {
        res.json(result)
    })
});

router.get('/:id/tasks', auth.isSelfOrP1OrP2, function (req, res) {
    let endTime = Time.getCurrentWeekDay(6);
    endTime = endTime.setHours(23,59,59) > new Date()? new Date(endTime.getTime()-7*24*60*60*1000)  : endTime;

    ProjectTask.getUserTaskList(req.params.id, endTime).then((result) => {
        result.taskList =  handleUserTaskList(result.taskList);
        res.json(result)
    })
});
router.get('/:id/projects',auth.isSelfOrP1OrP2, function(req, res){
    ProjectMember.getUserProjectList(req.params.id).then((result)=>{
       res.json(result)
   })
});
router.get('/:id/currentWeekTask', auth.isSelf, function(req, res){
    ProjectTask.userCurrentWeekTask(req.params.id).then((result)=>{
        res.json(result)
    })
});



//
// router.post('/updateUser' ,function(req,res){
//
//     var update_data = {$set:req.body};
//     User.update({studentID: req.body.studentID},update_data,function(err,userInfo){
//         var result;
//         if (userInfo.studentID == 'LH1234567' && userInfo.role == 'P1' && userInfo.isStartPassword == true)
//         {
//             result ={
//                 message:'更新成功',code:200,data:userInfo
//             }
//         }
//         else {
//             result ={
//                 message:'更新成功',code:200,data:userInfo
//             }
//         }
//         res.json(result);
//     })
// });

// createAUser({});
//
// function createAUser(){
//     var user = {
//         studentID:'LG123456781',
//         name:'test132',
//         role: 'P1'
//     };
//     User.createUser(user).then(result=>{
//         console.log(result)
//     })
// }

// loginUser()
// function loginUser(){
//     var user = {
//         studentID:'LH12345678',
//         password: '168201',
//     };
//     User.login(user).then(result=>{
//         console.log(result)
//     })
// }

// update()
// function update(){
//     var user = {
//         studentID:'LH12345678',
//         name:'liguagnsong',
//         wechat:"sdfasdf",
//         _id:'5c0ddbb0ac3ce9295886dbca',
//         password:'123456',
//     };
//     User.initUserInfo(user).then((result)=>{
//             console.log(result)
//     })
//
// }


module.exports = router;
