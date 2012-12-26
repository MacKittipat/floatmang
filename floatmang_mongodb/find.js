var mongo = require('mongodb');

// =============== Config
var dbHost = "192.168.51.102";
var dbPort = 27017;
var dbName = "floatmang";
var dbUrl = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
var tbTopic = "topic";
var tbIdea = "idea";
var tbComment = "comment";


// =============== Global var
var mongoClient = mongo.MongoClient;

// =============== DB floatmang : Find topic
mongoClient.connect(dbUrl, function(err, db) {
    if(!err) { // No error when connect to db.
        console.log("[DEBUG] : Connected DB");     
        // Find topic order by createtime.
        db.collection(tbTopic, function(err, collection) {
            var cursorTopic = collection.find({}, {sort:{createtime:-1}});
            cursorTopic.toArray(function(err, documents) {
                console.log("===== Find topic order by createtime. =====");
                for(var key in documents) {
                    console.log(documents[key].topic + " | " + documents[key].createby + " | " + documents[key].createtime);
                }
            });
        });
        
        // Find idea order by like and createby.
        db.collection(tbIdea, function(err, collection) {            
            var cursorIdea = collection.find({}, {sort:{like:-1, createtime:-1}});
            cursorIdea.toArray(function(err, documents) {
                console.log("===== Find idea order by like and createby. =====");
                for(var key in documents) {
                    console.log(documents[key].idea + " | " + documents[key].createby + " | " + documents[key].createtime + " | " + documents[key].like);
                }
            });
        });
        
        
        // Find comment by like and commentby.
        db.collection(tbComment, function(err, collection) {            
            var cursorComment = collection.find({}, {sort:{like:-1, createtime:-1}});
            cursorComment.toArray(function(err, documents) {
                console.log("===== Find comment by like and commentby. =====");
                for(var key in documents) {
                    console.log(documents[key].comment + " | " + documents[key].commentby + " | " + documents[key].commenttime + " | " + documents[key].like);
                }
            });
        });
        
        // Find comment by like and commentby with skip and limit.
        db.collection(tbComment, function(err, collection) {            
            var cursorComment = collection.find({}, {sort:{like:-1, createtime:-1}, skip:10, limit:6});
            cursorComment.toArray(function(err, documents) {
                console.log("===== Find comment by like and commentby with skip and limit. =====");
                for(var key in documents) {
                    console.log(documents[key].comment + " | " + documents[key].commentby + " | " + documents[key].commenttime + " | " + documents[key].like);
                }
            });
        });
        
        // Find comment by like and commentby with skip and limit 2.
        db.collection(tbComment, function(err, collection) {            
            var cursorComment = collection.find({}, {sort:{like:-1, createtime:-1}, skip:10, limit:6});
            cursorComment.each(function(err, documents) {
                console.log("===== Find comment by like and commentby with skip and limit 2. =====");
                for(var key in documents) {
                    console.log(key + " = " + documents[key]);
                }
            });
        });
        
        // Find Topic by ID 
        db.collection(tbTopic, function(err,collection,topicId){
            var cursorTopic = collection.find({_id : ObjectId(topicId)});
            console.log("===== Find topic  by id and return only one document =====");
            
        });
        
        // Find Idea By ID 
        db.collection(tbIdea,function(err,collection,ideaId){
           var cursorIdea = collection.find({_id : ObjectId(ideaId)});
           console.log("===== Find idea  by id and return only one document =====");
        });
        
        
        
        
        
                    
    } else {
        console.log("[ERROR] : Can not connect DB. dbUrl = " + dbUrl);
    }
});
