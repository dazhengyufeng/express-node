const db = require('../config/db.js');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//创建Schema
const classSchema = new Schema({
    name:String,
    createTime: {
        type    : Date,
        default : Date.now
    },
});


classSchema.statics.getAllClass =  function(){
    return new Promise((resolve => {
        Class.find({}).then((classList)=>{
            resolve({err:null, classList, code:200})
        })
    }))
}

const Class = db.model('Class',classSchema);
module.exports = Class;
