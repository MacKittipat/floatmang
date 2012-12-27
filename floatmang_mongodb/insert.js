var mongo = require('mongodb');

// =============== Config
var dbHost = "localhost";
var dbPort = 27017;
var dbName = "floatmang";
var dbUrl = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
var tbTopic = "topic";
var tbIdea = "idea";
var tbComment = "comment";

// =============== Global var
var mongoClient = mongo.MongoClient;

// =============== DB floatmang : Mock Data
mongoClient.connect(dbUrl, function(err, db) {
    if(!err) { // No error when connect to db.
        console.log("[DEBUG] : Connected DB");     
        
        // Remove all table.
        db.dropCollection(tbTopic, function(err, result) {
            console.log("[DEBUG] : Drop " + tbTopic + ". result = " + result);
            db.dropCollection(tbIdea, function(err, result) {
                console.log("[DEBUG] : Drop " + tbIdea + ". result = " + result);
                db.dropCollection(tbComment, function(err, result) {
                    console.log("[DEBUG] : Drop " + tbComment + ". result = " + result);
                    
                    // Insert mock data to table topic.        
                    db.collection(tbTopic, function(err, collection) {
                        for(var i=0; i<11; i++) {
                            console.log("[DEBUG] : Inserting " + tbTopic + ". key = " + i);  
                            collection.insert({
                                topic:"topic" + i,
                                createby:"user" + i,
                                createtime:new Date().getTime()
                            }, {w:-1});
                        }
                        
                        // Insert mock data to table idea base on topic.
                        db.collection(tbTopic, function(err, collection) {
                            var cursorTopic = collection.find({}, {sort:{createtime:-1}});
                            cursorTopic.toArray(function(err, documents) {
                                for(var key in documents) {
                                    console.log("[DEBUG] : Inserting " + tbIdea + ". key = " + key);  
                                    // Insert idea.
                                    for(var i=0; i<Math.ceil((Math.random()*10)+1); i++) {
                                        db.collection(tbIdea, function(err, collection) {
                                            collection.insert({
                                                idea:"idea" + i,
                                                createby:"user" + key,
                                                createtime:new Date().getTime(),
                                                like:Math.ceil((Math.random()*100)+1),
                                                dislike:Math.ceil((Math.random()*20)+1),
                                                topic_id:documents[key]._id
                                            }, {w:-1});

                                            // Insert mock data to comment idea base on idea.
                                            db.collection(tbIdea, function(err, collection) {
                                                var cursorIdea = collection.find({}, {sort:{like:-1 ,createtime:-1}});
                                                cursorIdea.toArray(function(err, documents) {
                                                    for(var key in documents) {
                                                        console.log("[DEBUG] : Inserting " + tbComment + ". key = " + key);  
                                                        for(var i=0; i<Math.ceil((Math.random()*10)+1); i++) {
                                                            db.collection(tbComment, function(err, collection) {
                                                                collection.insert({
                                                                    comment:"comment" + key + "_" + i,
                                                                    commentby:"user" + key,
                                                                    commenttime:new Date().getTime(),
                                                                    like:Math.ceil((Math.random()*100)+1),
                                                                    dislike:Math.ceil((Math.random()*20)+1),
                                                                    idea_id:documents[key]._id
                                                                }, {w:-1});
                                                            });
                                                        }
                                                    }
                                                });
                                            });
                                        });
                                    }
                                }
                            });
                        });       
                    });   
                });                
            });
        });
    } else {
        console.log("[ERROR] : Can not connect DB. dbUrl = " + dbUrl);
    }
});
