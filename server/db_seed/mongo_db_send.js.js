// 创建初始用户
db.getCollection("users").insert({
    "_id": ObjectId("53636fe831efbf8803b9494c"),
    "name": "admin1",
    "studentID":'admin1',
    "startPassword": "admin12345",
    "isWorking": true,
    'role':'P2'
});

//创建分类
db.getCollection("classes").insert({
    "_id": ObjectId("53636fe831efbf8803b9492c"),
    "name": "横向",

});

db.getCollection("classes").insert({
    "_id": ObjectId("53636fe831efbf8803b9493c"),
    "name": "纵向",

});
db.getCollection("classes").insert({
    "_id": ObjectId("53636fe831efbf8803b9494c"),
    "name": "服务",

});

db.getCollection("classes").insert({
    "_id": ObjectId("53636fe831efbf8803b9495c"),
    "name": "固岗",

});

