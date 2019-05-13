const db = require('../config/db.js');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

//创建Schema
const projectSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: 'Class'
    },
    description: String,
    label: {
        type: Schema.Types.ObjectId,
        ref: 'Label'
    },
    isOnGoing: Boolean,
    progressList: [{
        name: String,
        status: Boolean,
    }],
    createTime: {
        type    : Date,
        default : Date.now
    },
    startTime: {
        type    : Date,
    },
    deadLineTime: {
        type    : Date,
    },
    projectSummary: String
});

//创建model，这个地方的ch_user对应mongodb数据库中ch_users的conllection。
//mongoose会自动改成复数，如模型名：xx―>xxes, kitten―>kittens, money还是money


projectSchema.plugin(uniqueValidator, { message: ' 已存在' });

projectSchema.statics.createProject = function (projectInfo) {
    projectInfo.isOnGoing = true;
    return new Promise((resolve) => {
        new Project(projectInfo).save(function (error, project) {

            if (error) {
                let errors = error.errors;
                errors = Object.keys(errors).map(key=>{
                    return errors[key].path + '='+ errors[key].value + errors[key].message
                }).join(',')
                resolve({err: errors, code: 200105, project: null})
            } else {
                resolve({err: null, code: 200, project: project})
            }
        })
    })

};

projectSchema.statics.updateProject =  function(_id, projectInfo){
    return new Promise((resolve, reject) => {
        Project.findOne({_id: _id}).then(project => {
            if (!project) {
                return resolve({err: '未找到该项目', code: 200108, project: null})
            }
            project.class = projectInfo.class;
            project.name = projectInfo.name;
            project.label = projectInfo.label;
            project.description =  projectInfo.description;
            project.startTime = projectInfo.startTime;
            project.deadLineTime = projectInfo.deadLineTime;

            project.save((err, project) => {
                if (err) {
                    let errors = err.errors;
                    errors = Object.keys(errors).map(key=>{
                        return errors[key].path + '='+ errors[key].value + errors[key].message
                    }).join(',')
                    return resolve({err: errors, code: 200108, project: null})
                }
                resolve({err: null , code: 200, project: project})
            })

        })
    })
};
projectSchema.statics.delegateProject =  function(_id){
    return new Promise((resolve, reject) => {
        Project.findOne({_id: _id}).then(project => {
            if (!project) {
                return resolve({err: '未找到该项目', code: 200108})
            }
            project.delete((err)=>{
                if (err) {
                    return resolve({err: "删除项目失败", code: 200108})
                }
                resolve({err: null , code: 200})
            })

        })
    })
};


projectSchema.statics.getById = function (_id) {
    return new Promise((resolve) => {
        Project.findOne({_id: _id}).populate([
            {path: 'class', select: 'name'},
            {path: 'label', select: 'name'},
        ]).then(function (project) {
            if (!project) {
                resolve({err: '未找到该项目', code: 200108, project: null})
            } else {
                resolve({err: null, code: 200, project: project})
            }
        },()=>{
            resolve({err: '错误查找', code: 200108, project: null})

        })
    })
};

projectSchema.statics.updateProgressList = function (_id, progressList) {
    return new Promise((resolve, reject) => {
        Project.findOne({_id: _id}).populate([
            {path: 'class', select: 'name'},
            {path: 'label', select: 'name'},
        ]).then(project => {
            if (!project) {
                return resolve({err: '未找到该项目', code: 200108, project: null})
            }
            project.progressList = progressList;
            project.save((err, project) => {
                if (err) {
                    return resolve({err: '未找到该项目', code: 200108, project: null})
                }
                resolve({err: null , code: 200, project: project})
            })

        },()=>{
             resolve({err: '错误查找', code: 200108, project: null})

        })
    })
};

projectSchema.statics.updateIsOnGoing = function (_id,summary, isOnGoing) {
    return new Promise((resolve, reject) => {
        Project.findOne({_id: _id}).populate([
            {path: 'class', select: 'name'},
            {path: 'label', select: 'name'},
        ]).then(project => {
            if (!project) {
                return resolve({err: '未找到该项目', code: 200108, project: null})
            }
            project.isOnGoing = isOnGoing;
            project.projectSummary = summary;
            console.log("=======projectSummary11111========");
            console.log(project.projectSummary);

            project.save((err, project) => {
                console.log("============updateIsOnGoing============");
                console.log(project);
                if (err) {
                    return resolve({err: '未找到该项目', code: 200108, project: null})
                }
                resolve({err: null , code: 200, project: project})
            })

        },()=>{
            resolve({err: '错误查找', code: 200108, project: null})

        })
    })
};





projectSchema.statics.getProjectList = function(filter){ //todo

    // let skip;
    // let page  = filter.page !== undefined ? parseInt(filter.page): 0;
    // let limit = filter.limit !== undefined ? parseInt(filter.limit): 10;
    let isOnGoing = filter.isOnGoing !== undefined ? filter.isOnGoing : true;
    // skip  = page * limit;

    let condition = {
        isOnGoing: isOnGoing
    };
    if(filter.projectIdList){
        condition._id = { "$in": filter.projectIdList}
    };
    if(filter.label){
        condition.label = filter.label;
    }
    if(filter.class){
        condition.class = filter.class;
    }
    console.log("=========filter=======");
    console.log(filter);
    if(filter.year) {
        condition.deadLineTime = {$gte : new Date(filter.year+"-01-01"), $lte:new Date(filter.year+"-12-31 23:59:00")};
    }
    return new Promise((resolve)=>{
        Project.find(condition)
        // .skip(skip).limit(limit)
            .sort("-createTime")
            .populate([
                {path: 'class', select: 'name'},
                {path: 'label', select: 'name'},
            ])
            .then((projectList)=>{
                console.log('=====before=====');
                console.log(projectList);
                console.log('=====after=====');
                resolve({err:null, projectList, code:200})
            },(err)=>{
                resolve({err: '错误查找', code: 200108, projectList: null})
            });
    })

};



const Project = db.model('Project', projectSchema);



module.exports = Project;
