var db = require('../config/db.js');
const Time = require('../util/time');


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//创建Schema
var projectTaskSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    startTime: Date,
    endTime: Date,
    description: String,
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    createTime: {
        type: Date,
        default: Date.now
    },
});

projectTaskSchema.statics.createTask = function (task) {
    return new Promise(resolve => {
        new ProjectTask(task).save(function (err, task) {
            if (err) {
                return resolve({err: err, task: task, code: 200106})
            }
            resolve({err: null, task: task, code: 200})
        })
    })
};

projectTaskSchema.statics.getUserTaskList = function (userId, endTime) {

    endTime = endTime || new Date();

    return new Promise(resolve => {
        ProjectTask.find({
            user: userId, endTime: {
                "$lte": endTime
            }
        })
            .sort("-createTime")
            .populate([
            {path: 'project', select: 'name'}
        ])
            .then(function (taskList) {
                resolve({err: null, taskList: taskList, code: 200})
            }, () => {
                resolve({err: '错误查找', code: 200108, taskList: null})

            })
    })
};

projectTaskSchema.statics.getProjectTaskList = function (projectId, endTime) {
    endTime = endTime || new Date();
    return new Promise(resolve => {
        ProjectTask.find({
            project: projectId, endTime: {
                "$lte": endTime
            }
        })
            .sort("-createTime")
            .populate([
            {path: 'user', select: 'name'}
        ])
            .then(function (taskList) {
                resolve({err: null, taskList: taskList, code: 200})
            }, () => {
                resolve({err: '错误查找', code: 200108, taskList: null})
            })
    })
};


projectTaskSchema.statics.userCurrentWeekTask = function (userId) {
    let endTime = Time.getCurrentWeekDay(6);
    return new Promise(resolve => {
        ProjectTask.find({user: userId, endTime: endTime}).populate([
            {path: 'project', select: 'name'}
        ])
            .then(function (taskList) {
                resolve({err: null, taskList: taskList, code: 200})
            }, () => {
                resolve({err: '错误查找', code: 200108, taskList: null})

            })
    })
};


var ProjectTask = db.model('ProjectTask', projectTaskSchema);
module.exports = ProjectTask;
