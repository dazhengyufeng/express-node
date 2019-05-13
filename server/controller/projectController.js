const Project = require('../models/projectModel');
const ProjectMember = require('../models/projectMemberModel');
const Label = require('../models/labelModel');
const User = require('../models/userModel');
const _ = require('lodash');
 // require('../../output.xlsx')

const ProjectTask = require('../models/projectTaskModel');
const auth = require('../util/auth');
const router = require('express').Router();
const rule = require('../util/rule');
const Time = require('../util/time');

const dlXlsx = require('../util/dlXlsx');
const fs = require('fs');

function _isProjectAdmin(req, res, next) {
    let currentUser = req.headers.user;
    let projectId = req.params.id;
    ProjectMember.getMembersInfo(currentUser._id, projectId).then(function (result) {
        if (result.code !== 200) {
            return res.json({err: '权限不足', code: '200101'})
        }
        if (result.member.role === 'actor') {
            return res.json({err: '权限不足', code: '200101'})
        }
        next()
    })
}


function _isProjectMember(req, res, next) {
    let currentUser = req.headers.user;
    let projectId = req.params.id;
    if (currentUser.role === 'P1') return next();
    ProjectMember.getMembersInfo(currentUser._id, projectId).then(function (result) {
        if (result.code !== 200) {
            return res.json({err: '权限不足', code: '200101'})
        }
        next()
    })
}


function handleUserTaskList(taskList) {
    taskList = _.groupBy(taskList, (task) => {
        return task.startTime
    });
    let timeList = _.keys(taskList);
    timeList.sort((a,b)=>{
        return b - a
    });
    return _.map(timeList, (startTime) => {
        return taskList[startTime]
    })

}


function _checkProjectProgress(progressList) {
    let isOnGoingCount = 0;
    let nameErrorCount = 0;
    for (let i = 0; i < progressList.length; i++) {
        if (progressList[i].status) {
            isOnGoingCount++
        }
        if (!rule.progress.name(progressList[i].name)) {
            nameErrorCount++
        }
    }

    if (isOnGoingCount > 1  ) {
        return {err: '正在进行中的节点只能有一个', code: 200106}
    }
    if(nameErrorCount > 0){
        return {err: '节点名称格式错误', code: 200106}
    }
    return {err: null, code: 200}

}

//下载已归档工程
router.get('/downloadCloseProject',auth.isLogin, async (req,res) => {
    let filter = {isOnGoing: false, label: req.query.label, class: req.query.class, year:req.query.year};
    let user = req.headers.user;
    Promise.resolve(user.role === "P1" ? null : ProjectMember.getUserProject(user._id))
        .then((result) => {
            if (!result) return result;
            return result.projectList.map(project => {
                return project.project._id
            })
        }).then((projectIdList) => {
        filter.projectIdList = projectIdList;
        Project.getProjectList(filter).then((projectListResult) => {
            if (projectListResult.code !== 200) {
                return res.json(projectListResult)
            }
            let allPromises = projectListResult.projectList.map(project => {
                return ProjectMember.getMembersByProject(project._id)
            });
            Promise.all(allPromises).then((memberOfProjectList) => {
                projectListResult = JSON.parse(JSON.stringify(projectListResult));
                projectListResult.projectList.forEach((project, index) => {
                    project.memberList = memberOfProjectList[index].memberList;
                });
                dlXlsx(deal_data(projectListResult.projectList));
                res.download(process.cwd()+'/output.xlsx', 'output.xlsx', function(err){
                    if (err) {
                        // 处理错误，但响应可能已经部分发送
                        // 这时应该检查 res.headersSent
                    } else {
                        // 下载……
                    }
                });


                // res.json(projectListResult);
            });
        })
    })


    //生成xlsx文件
    // await dlXlsx();
    // //类型
    // res.sendFile('../../output.xlsx');
})

router.get('/', auth.isLogin, function (req, res) {  //获取工程列表
    let filter = {isOnGoing: req.query.isOnGoing, label: req.query.label, class: req.query.class, year:req.query.year};
    let user = req.headers.user;
    Promise.resolve(user.role === "P1" ? null : ProjectMember.getUserProject(user._id))
        .then((result) => {
            if (!result) return result;
            return result.projectList.map(project => {
                return project.project._id
            })
        }).then((projectIdList) => {
        filter.projectIdList = projectIdList;
        Project.getProjectList(filter).then((projectListResult) => {
            if (projectListResult.code !== 200) {
                return res.json(projectListResult)
            }
            let allPromises = projectListResult.projectList.map(project => {
                return ProjectMember.getMembersByProject(project._id)
            });
            Promise.all(allPromises).then((memberOfProjectList) => {

                projectListResult = JSON.parse(JSON.stringify(projectListResult));
                projectListResult.projectList.forEach((project, index) => {

                    project.memberList = memberOfProjectList[index].memberList;
                });
                res.json(projectListResult);

            });


        })

    })

});
router.delete('/:id',auth.isP2,function (req, res) { //删除工程

    let project_id = req.params.id;
    Project.delegateProject(project_id).then((result)=>{
        res.json(result);
    })
});

router.post('/', auth.isP2, function (req, res) { //创建工程
    let label = req.body.label;
    let currentUser = req.headers.user;
    let project = {
        name: req.body.name,
        description: req.body.description,
        class: req.body.class,
        startTime: req.body.startTime,
        deadLineTime:req.body.deadLineTime
        };

    if (!rule.project.name(project.name)) {
        return res.json({err: '工程名格式错误', code: 200106})
    }

    Label.getLabelByName(label).then((label) => {
        project.label = label._id;
        Project.createProject(project).then((createProjectResult) => {
            if (!createProjectResult.err) {
                let member = {
                    user: currentUser._id,
                    project: createProjectResult.project._id,
                    role: 'owner',
                };
                ProjectMember.createMember(member).then(() => { //todo
                    res.json(createProjectResult)
                })

            } else {
                res.json(createProjectResult)
            }

        })
    });

});


router.get("/:id", auth.isLogin, _isProjectMember, function (req, res) { // 获取项目信息
    let projectId = req.params.id;   //todo
    Project.getById(projectId).then((result => {
        if (result.err) {
            return res.json(result);
        }
        ProjectMember.getMembersByProject(projectId).then((memberListResult) => {
            result = JSON.parse(JSON.stringify(result))
            result.project.memberList = memberListResult.memberList;
            return res.json(result)
        })
    }))
});


router.put("/:id", auth.isLogin, _isProjectAdmin, function (req, res) { // 更新项目信息
    let label = req.body.label;
    let project = {
        name: req.body.name,
        description: req.body.description,
        class: req.body.class,
        startTime: req.body.startTime,
        deadLineTime:req.body.deadLineTime
    };

    if (!rule.project.name(project.name) ) {
        return res.json({err: '参数格式错误', code: 200106})
    }

    Label.getLabelByName(label).then((label) => {
        project.label = label._id;
        Project.updateProject(req.params.id, project).then((updateProjectResult) => {
            return res.json(updateProjectResult)

        })
    });
});


router.put('/:id/close', auth.isLogin, _isProjectAdmin, function (req, res) { //关闭存档
    let projectId = req.params.id;
    let projectSummary = req.query.data;
    Project.updateIsOnGoing(projectId,projectSummary, false).then(function (member) {
        res.json(member)
    })
});

router.post('/:id/member', auth.isLogin, _isProjectAdmin, function (req, res) { //项目添加成员
    let member = {
        user: req.body.user,
        project: req.params.id,
        role: req.body.role || 'actor',
    };

    if (!rule.member.user(member.user) || !rule.member.role(member.role)) {
        return res.json({err: '参数格式错误', code: 200106})
    }

    User.getUserById(member.user).then(userInfo => {
        if (!userInfo.user) {
            return res.json({err: '未找到改用户', code: 200103})
        }

        if (userInfo.user.role === 'P1') {
            return res.json({err: '不能添加该用户', code: 200106})
        }
        if (userInfo.user.role === 'P3' && (member.role === 'admin' || member.role === 'owner')) {
            return res.json({err: '普通成员不能设置为负责人', code: 200106})
        }
        ProjectMember.createMember(member).then(function (member) {
            res.json(member)
        })


    });


});

router.get('/:id/member/:memberId', auth.isLogin, _isProjectMember, function (req, res) { // 获取项目一个成员信息
    let userId = req.params.memberId;
    let projectId = req.params.id;
    ProjectMember.getOneMemberInfo(userId, projectId).then(function (result) {
        res.json(result)
    })
});

router.get('/:id/member', auth.isLogin, _isProjectMember, function (req, res) { //获取项目成员
    let projectId = req.params.id;
    ProjectMember.getMembersByProject(projectId).then(function (member) {
        res.json(member)
    })
});

router.delete('/:id/member/:memberId', auth.isLogin, _isProjectAdmin, function (req, res) { //删除项目成员
    let userId = req.params.memberId;
    let projectId = req.params.id;
        ProjectMember.findProjectAdmin(projectId).then(projectAdmin => {
            let  adminList = projectAdmin.memberList;
            let admin = adminList.find(adminInfo=> adminInfo.user == userId)
            if (adminList.length < 2 &&  admin) {
                return res.json({err: '项目最少一个负责人',member: admin ,code: 200106})
            }
            ProjectMember.deleteMember(userId, projectId).then(function (result) {
                res.json(result)
            })
        })

});

router.put('/:id/member/:memberId', auth.isLogin, _isProjectAdmin, function (req, res) { //更新项目成员权限
    let userId = req.params.memberId;
    let projectId = req.params.id;
    let role = req.body.role;
    if (!rule.member.role(role)) {
        return res.json({err: '参数格式错误', code: 200106})
    }

    User.getUserById(userId).then((userInfo) => {
        if (userInfo.code !== 200) {
            return res.json(userInfo)
        }
        if (userInfo.user.role === 'P1') {
            return res.json({err: '不能添加该用户', code: 200106})
        }
        if (userInfo.user.role === 'P3' && (role === 'admin' || role === 'owner')) {
            return res.json({err: '普通成员不能设置为负责人', code: 200106})
        }


        if (role === 'actor') {
            ProjectMember.findProjectAdmin(projectId).then(projectAdmin => {
                let  adminList = projectAdmin.memberList;
                let admin = adminList.find(adminInfo=> adminInfo.user == userId)
                if (adminList.length < 2 &&  admin) {
                    return res.json({err: '项目最少一个负责人', member: admin,code: 200106})
                }

                ProjectMember.updateRole(userId, projectId, role).then(function (result) {
                    res.json(result)
                })

            })
        }else{
            ProjectMember.updateRole(userId, projectId, role).then(function (result) {
                res.json(result)
            })
        }



    });

});

router.put('/:id/progress', function (req, res) { //更新项目进度

    console.log(req.body)
    let projectId = req.params.id;
    let progressList = req.body.progressList;
    let progressStatus = _checkProjectProgress(progressList);
    if (progressStatus.err) {
        return res.json(progressStatus);
    }
    Project.updateProgressList(projectId, progressList).then((result) => {
        res.json(result)
    })
});

router.post('/:id/tasks', auth.isP2OrP3, _isProjectMember, function (req, res) { //新建项目任务
    let task = {
        project: req.params.id,
        user: req.headers.user._id,
        description: req.body.description,
        startTime: Time.getCurrentWeekDay(1),
        endTime: Time.getCurrentWeekDay(6),
    };
    ProjectTask.userCurrentWeekTask(req.headers.user._id).then((currentWeekTask) => {
        let currentTask = _.find(currentWeekTask.taskList, (task) => {
            return task.project._id == req.params.id
        });
        if (currentTask) {
            return res.json({err: '本周' + req.params.id + '项目任务已保存', code: 200106})
        }
        ProjectTask.createTask(task).then(function (task) {
            return res.json(task)
        })

    });

});

router.get('/:id/tasks', auth.isLogin, _isProjectMember, function (req, res) { //获得项目任务
    let endTime = Time.getCurrentWeekDay(6);
    endTime = endTime.setHours(23,59,59) > new Date()? new Date(endTime.getTime()-7*24*60*60*1000)  : endTime;
    ProjectTask.getProjectTaskList(req.params.id, endTime).then((result) => {
        result = JSON.parse(JSON.stringify(result))
        result.taskList = handleUserTaskList(result.taskList);
        res.json(result)
    })
});


// function createProject(){
//         Label.getLabelByName('test').then((label)=>{
//             var project = {
//                 name:'1212321',
//                 description:'12312',
//                 label: label._id
//             }
//             Project.createProject(project).then((project)=>{
//                 console.log(project)
//             })
//         });
// }
//
// createProject()

// function createProjectMember() {
//     var memeber = {
//         user: '5c0e1d0db102f92adc25a8a2',
//         project: '5c122a62997c3b34b4a77c56',
//         role: "actor",
//     }
//     ProjectMember.createMember(memeber).then(function (memeber) {
//         console.log(memeber)
//     })
//
// }
//
// createProjectMember();

function deal_data(projectList){
    let haveStartTime = projectList.filter(item => item.deadLineTime)
    let notHaveStartTime = projectList.filter(item => !item.deadLineTime)
    haveStartTime.sort((a, b) => a.deadLineTime.localeCompare(b.deadLineTime));
    let dataList = [...haveStartTime,...notHaveStartTime]

    let dataArr = dataList.map(item => {
        let userList = item.memberList.map(item => {
            return item.user.name
        })
        let data = {
            '任务名称':item.name,
            '分类':item.class.name,
            '标签':item.label ? item.label.name : '',
            '起始时间':item.startTime ? updateShowTime(item.startTime) : '',
            '截止时间':item.deadLineTime ? updateShowTime(item.deadLineTime) : '',
            '简介':item.description ? item.description : '',
            '参与人':userList
        }
        return data
    })
    return dataArr;
}
function updateShowTime(date){
    var newDate = new Date(date);
    return newDate.getFullYear()+'/'+(newDate.getMonth()+1)+'/'+newDate.getDate();
}
module.exports = router;
