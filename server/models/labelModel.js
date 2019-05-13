const db = require('../config/db.js');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//创建Schema
const labelSchema = new Schema({
    name:{
        type: String,
        required: true,
        unique: true
    },
    createTime: {
        type    : Date,
        default : Date.now
    },
});

labelSchema.statics.getLabelByName =  function(name){ //todo
    return new Promise(resolve => {
        if(!name) return resolve({});
        Label.findOne({name: name}).then((label)=>{
            if(!label){
                new Label({name:name}).save(function(err,label){
                    if(err){
                        resolve(Label.getLabelByName(name))
                    }else{
                        resolve(label)
                    }

                })
            }else{
                resolve(label)
            }

        })
    })

};

labelSchema.statics.getAllLabel =  function(){
    return new Promise(resolve => {
        Label.find({}).then((labelList)=>{
            resolve({err:null, code:200, labelList: labelList})
        })
    })

};

const Label = db.model('Label',labelSchema);
module.exports = Label;
