const user = {
    name: function (str) {
        return str && str.length >= 1 && str.length < 12
    },
    studentID: function (str) {

        return str && str.length >= 6 && str.length < 12
    },
    password: function (str) {
        return str && str.length >= 6 && str.length < 12
    },
    role: function (str) {
        return ['P1', 'P2', 'P3'].indexOf(str) > -1;
    },
    // phoneNumber:function (str) {
    //     return !!str
    // },
    // telephone:function(){
    //     return !!str
    // },
    // wechat: function(){
    //     return !!str
    // },
    // email: function(){
    //     return !!str
    // },
    // skills: function(){
    //     return !!str
    // }
};
const project ={
    name: function(str){
        return str && str.length >= 1 && str.length < 20
    },
    label: function(str){
        return !!str;
    }
};
const member = {
    user:function(str){
        return !!str;
    },
    role: function (str) {
        return ['owner', 'actor', 'admin'].indexOf(str) > -1;
    }
};

const progress = {
    name: function(str){
        return str && str.length >= 1 && str.length < 12
    },
    status: function(status){
      return typeof status === 'boolean'
    }
}

const label = {
    name: function (str) {
        return str && str.length >= 3 && str.length < 12
    }
};


module.exports = {
    user: user,
    member: member,
    label: label,
    project: project,
    progress: progress,



}