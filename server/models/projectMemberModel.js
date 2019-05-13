const db = require('../config/db.js');


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//创建Schema
const projectMemberSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    role: {
        type: String,
        default: 'actor' //owner ,actor, admin
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    createTime: {
        type: Date,
        default: Date.now
    },
});

function handleProject(porjectInfo) {
    let {project, role, createTime} = porjectInfo;
    return {project, role, createTime}
}

function handleUser(userInfo) {
    let {user, role, createTime} = userInfo;
    return {user, role, createTime}
}

projectMemberSchema.statics.getMembersByProject = function (projectId) {
    return new Promise((resolve => {
        ProjectMember.find({project: projectId}).populate([
            {path: 'user', select: 'name isWorking'}
        ]).then(function (memberList) {
            memberList = memberList.map(member => handleUser(member))
            resolve({err: null, memberList, code: 200})
        }, () => {
            resolve({err: '错误查找', code: 200108, memberList: null})

        })
    }))
};
projectMemberSchema.statics.getUserProject = function (userId) {
    return new Promise((resolve => {
        ProjectMember.find({user: userId}).populate([
            {path: 'user', select: 'name, _id'}
        ]).then(function (projectList) {
            projectList = projectList.map(project => handleProject(project))
            resolve({err: null, projectList, code: 200})
        }, () => {
            resolve({err: "查找错误", projectList: null, code: 200108})
        })
    }))
};

projectMemberSchema.statics.createMember = function (projectMember) {
    return new Promise((resolve => {

        ProjectMember.findOne({user: projectMember.user, project: projectMember.project}).then(member => {
            if (member) {
                return resolve({err: '成员已存在', code: 200106, member: member})
            }
            new ProjectMember(projectMember).save(function (err, member) {
                if (err) {
                    return resolve({err: err, member: null, code: 200106})
                }

                resolve({err: null, member, code: 200})

            })
        })

    }))
};

projectMemberSchema.statics.updateRole = function (userId, projectId, role) {
    return new Promise((resolve => {
        ProjectMember.findOne({user: userId, project: projectId}).then(function (member) {
            if (!member) {
                return resolve({err: '没有该成员', member: null, code: 200108})
            }
            member.role = role;
            member.save((err, newMember) => {
                if (err) {
                    return resolve({err: err, member: member, code: 200105})
                }
                resolve({err: null, member: newMember, code: 200})
            })

        })
    }))
};


projectMemberSchema.statics.deleteMember = function (userId, projectId) {
    return new Promise((resolve => {
        ProjectMember.remove({user: userId, project: projectId}).then(function (err) {
            if (!err.ok) {
                return resolve({err: err, code: 200109})
            }
            resolve({err: null, code: 200})

        })
    }))
};

projectMemberSchema.statics.getMembersInfo = function (userId, projectId) {
    return new Promise((resolve) => {
        ProjectMember.findOne({user: userId, project: projectId}).then(function (member) {
            if (!member) {
                return resolve({err: '没有该成员', member: null, code: 200108})
            }
            resolve({err: null, member, code: 200})

        })
    })
};

projectMemberSchema.statics.getUserProjectList = function (userId) { //todo

    let condition = {
        user: userId
    };


    return new Promise((resolve) => {
        ProjectMember.find(condition)
            .sort("-createTime")
            .populate([
                {path: 'project', select: 'name isOnGoing'}
            ])
            .then((projectList) => {

                resolve({err: null, projectList: projectList.map((project) => handleProject(project)), code: 200})
            }, () => {
                resolve({err: '查找错误', projectList: null, code: 200108})
            });
    })

};
projectMemberSchema.statics.getOneMemberInfo = function (userId, projectId) {
    return new Promise((resolve) => {
        ProjectMember.findOne({user: userId, project: projectId}).then(function (member) {
            if (!member) {
                return resolve({err: '没有该成员', member: null, code: 200108})
            }

            resolve({err: null, member, code: 200})


        })
    })

};
projectMemberSchema.statics.getAllMember = function () {
    return new Promise(resolve => {
        ProjectMember.find({}).populate([
            {path: 'project', select: 'name isOnGoing'}
        ]).then((memberList) => {
            resolve({err: null, memberList, code: 200})
        })
    })
};

projectMemberSchema.statics.findProjectAdmin = function (projectId) {
    return new Promise(resolve => {
        ProjectMember.find({project: projectId, role: {$in: ['admin', 'owner']}}).then((memberList) => {
            resolve({err: null, memberList, code: 200})
        })
    })
};


var ProjectMember = db.model('ProjectMember', projectMemberSchema);
module.exports = ProjectMember;
