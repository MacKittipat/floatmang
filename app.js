var express = require('express');
var ejs = require('ejs');
var socketio = require('socket.io');
var mongodb = require('mongodb');
var humane = require('./lib/humane');

// =============== Config
var appHost = '127.0.0.1';
var appPort = 8888;
var dbHost = '192.168.51.102';
var dbPort = 27017;
var dbName = "floatmang";
var dbUrl = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
var tbTopic = "topic";
var tbIdea = "idea";
var ObjectID = mongodb.ObjectID;
var limit = 10;

// =============== Web App Global Var 
var app = express();
var listen =  app.listen(appPort);
var io = socketio.listen(listen);
var mongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var BSON = require('mongodb').BSONPure;

// =============== Web App Config
app.engine('html', ejs.__express); // Use ejs template engine.
app.set('views', __dirname + '/view'); // Set view dir.
app.set('view engine', 'html'); // Set view extension.
app.use(express.static(__dirname + '/resource/js')); // Import all static file in /resource/js.
app.use(express.static(__dirname + '/floatmang_design/assets'));
//app.use(express.static(__dirname + '/floatmang_design/assets/css'));
//app.use(express.static(__dirname + '/floatmang_design/assets/img'));
//app.use(express.static(__dirname + '/floatmang_design/assets/js'));
//app.use(express.static(__dirname + '/floatmang_design/assets/font'));
app.use(express.bodyParser()); // Enable req.body.PARAMETER.
app.use(express.cookieParser()); // Enable session.
app.use(express.session({secret: "MySessionSecret", key: 'MySessionKey'}));

// =============== Web App Route
app.get('/', function(req, res) {
    if(loggedIn(req)) {
        res.redirect('topic');
    }
    res.redirect('login');
});

app.get('/login', function(req, res) {
    if(loggedIn(req)) {
        res.redirect('topic');
    }
    res.render('login');
});
app.post('/login', function(req, res) {  
    // Create session 'name'.
    req.session.name = 'anonymous';
    // If not an anonymous.
    if(!req.body.anonymous) { 
        // Get post parameter 'name' and set session.
        req.session.name = req.body.name; 
    }
    res.redirect('topic');
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('login');
});

app.get('/topic', function(req, res) {
    if(loggedIn(req)) {
        // Display topic.
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbTopic, function(err, collection) {
                // Find topic.
                var cursorTopic = collection.find({}, {sort:{createtime:-1}, skip:0, limit:limit}); 
                cursorTopic.toArray(function(err, documents) { 
                    // Extend document field.
                    for(var key in documents) {
                        documents[key].prettytime = humane.humaneDate(new Date(documents[key].createtime));
                    }
                    // Count all topic.
                    collection.find().count(function(err, count) { 
                        res.render('topic', {
                            documents:documents,
                            totalTopic:count,
                            appHost:appHost,
                            appPort:appPort,
                            limit:limit,
                            name:req.session.name
                        });
                    });
                });
            });
        });
    } else {
        res.redirect('/');
    }
});

// Idea in list mode.
app.get('/idea', function(req, res) {
    if(loggedIn(req)) {
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {        
                // Find idea by topic id.
               var cursorIdea = collection.find({topic_id:new ObjectID(req.query.id)}, {sort:{like:-1, createtime:-1}, skip:0, limit:limit}); 
               cursorIdea.toArray(function(err, documents) {
                   // Count all idea.
                    collection.find().count(function(err, count) { 
                        // Find topic by topicId.
                        db.collection(tbTopic, function(err, collection) {
                            collection.findOne({_id:new ObjectID(req.query.id)}, function(err, document) {
                                res.render('idea', {
                                    documents:documents,
                                    totalIdea:count,
                                    topicId:req.query.id,
                                    topic:document.topic,
                                    appHost:appHost,
                                    appPort:appPort,
                                    limit:limit,
                                    name:req.session.name
                                });
                            }); 

                        });
                    });
               });
            });    
        });
    } else {
        res.redirect('/');
    }
})

// Idea in animation mode.
app.get('/float', function(req, res) {
    if(loggedIn(req)) {
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {        
                // Find idea by topic id.
               var cursorIdea = collection.find({topic_id:new ObjectID(req.query.id)}, {sort:{like:-1, createtime:-1}, skip:0, limit:5}); 
               cursorIdea.toArray(function(err, documents) {
                   // Count all idea.
                    collection.find().count(function(err, count) { 
                        // Find topic by topicId.
                        db.collection(tbTopic, function(err, collection) {
                            collection.findOne({_id:new ObjectID(req.query.id)}, function(err, document) {
                                res.render('float', {
                                    documents:documents,
                                    totalIdea:count,
                                    topicId:req.query.id,
                                    topic:document.topic,
                                    appHost:appHost,
                                    appPort:appPort,
                                    limit:5,
                                    name:req.session.name
                                });
                            }); 

                        });
                    });
               });
            });    
        });
    } else {
        res.redirect('/');
    }
});

app.post('/a/moretopic', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbTopic, function(err, collection) {
            // Find topic.
            var cursorTopic = collection.find({}, {sort:{createtime:-1}, skip:req.body.totalDisplayTopic, limit:limit}); 
            cursorTopic.toArray(function(err, documents) { 
                // Extend document field.
                for(var key in documents) {
                    documents[key].prettytime = humane.humaneDate(new Date(documents[key].createtime));
                }
                // Return topic as JSON. 
                res.json(documents);   
            });
        });
    });
});

app.post('/a/moreidea', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbIdea, function(err, collection) {
            // Find idea by topic id.
            var cursorIdea = collection.find({topic_id:new ObjectID(req.body.topicId)}, {sort:{like:-1, createtime:-1}, skip:req.body.totalDisplayIdea, limit:limit}); 
            cursorIdea.toArray(function(err, documents) { 
                // Return idea as JSON. 
                res.json(documents);   
            });
        });
    });
});

app.post('/a/gettopic', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbTopic, function(err, collection) {
            // Find topic by topicId.
            collection.findOne({_id:new ObjectID(req.body.topicId)}, function(err, document) {
                // Return topic as JSON. 
                res.json(document);  
            }); 
        });
    });
});

app.post('/a/getidea', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbIdea, function(err, collection) {
            // Find idea by idea.
            collection.findOne({_id:new ObjectID(req.body.ideaId)}, function(err, document) {
                // Return idea as JSON. 
                res.json(document);  
            }); 
        });
    });
});

console.log('App is running : http://localhost:' + appPort);

// =============== Socket.IO
io.sockets.on('connection', function (socket) {
    socket.on('clientLikeIdea', function (data) {
        console.log("[DEBUG] clientLikeIdea, idea id : " + data.ideaId);
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {
                // Find idea by id.
                collection.findOne({_id:new ObjectID(data.ideaId)}, function(err, document) {
                    // Update idea. +1 for like field.
                    var like = parseInt(document.like) + 1;
                    collection.update({_id:new ObjectID(data.ideaId)}, {$set:{like:like}}, {w:-1}); 
                    // Update client.
                    socket.emit('serverUpdateLike', {ideaId:data.ideaId, like:like});
                    socket.broadcast.emit('serverUpdateLike', {ideaId:data.ideaId, like:like});
                });                  
            });
        });
    });   
    
    socket.on('clientDislikeIdea', function (data) {
        console.log("[DEBUG] clientDislikeIdea, idea id : " + data.ideaId);
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {
                // Find idea by id.
                collection.findOne({_id:new ObjectID(data.ideaId)}, function(err, document) {
                    // Update idea. -1 for dislike field.
                    var dislike = parseInt(document.dislike) - 1;
                    collection.update({_id:new ObjectID(data.ideaId)}, {$set:{dislike:dislike}}, {w:-1}); 
                    // Update client.
                    socket.emit('serverUpdateDislike', {ideaId:data.ideaId, dislike:dislike});
                    socket.broadcast.emit('serverUpdateDislike', {ideaId:data.ideaId, dislike:dislike});
                });                  
            });
        });
    });   
    
    socket.on('clientEditTopic', function (data) {
        console.log("[DEBUG] clientEditTopic, topic id : " + data.topicId + ", topic :" + data.topic);
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbTopic, function(err, collection) {
                // Edit topic
                collection.update({_id:new ObjectID(data.topicId)}, {$set:{topic:data.topic}}, {w:-1});
                // Update client.
                socket.emit('serverUpdateEditTopic', {topicId:data.topicId, topic:data.topic});
                socket.broadcast.emit('serverUpdateEditTopic', {topicId:data.topicId, topic:data.topic});
            });
        });
    });
    
    socket.on('clientEditIdea', function (data) {
        console.log("[DEBUG] clientEditIdea, idea id : " + data.ideaId + ", idea : " + data.idea);
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {
                // Find idea by idea.
                collection.update({_id:new ObjectID(data.ideaId)}, {$set:{idea:data.idea}}, {w:-1});
                // Update client.
                socket.emit('serverUpdateEditIdea', {ideaId:data.ideaId, idea:data.idea});
                socket.broadcast.emit('serverUpdateEditIdea', {ideaId:data.ideaId, idea:data.idea});
            });
        });
    });
    
    socket.on('clientAddTopic', function (data) {
        console.log("[DEBUG] clientAddTopic");
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbTopic, function(err, collection) {
                // Add new topic.
               collection.insert({
                    topic:data.topic,
                    createby:data.name,
                    createtime:new Date().getTime()
                }, {w:-1}, function(err, document) {
                    // Extend document field.
                    document[0].prettytime = humane.humaneDate(new Date(document[0].createtime));
                    // Update client.
                    socket.emit('serverUpdateAddTopic', {topicId:document[0]._id, topic:data.topic, createtime:document[0].createtime, createby:document[0].createby, prettytime:document[0].prettytime});
                    socket.broadcast.emit('serverUpdateAddTopic', {topicId:document[0]._id, topic:data.topic, createtime:document[0].createtime, createby:document[0].createby, prettytime:document[0].prettytime});
                });
            });
        });
    });
    
    socket.on('clientAddIdea', function(data) {
        console.log("[DEBUG] clientAddTopic, topicId : " + data.topicId + " | " + data.name + " | " + data.idea);
    	mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {
                // Add new idea.
                collection.insert({
                        idea:data.idea,
                        createby:data.name,
                        createtime:new Date().getTime(),
                        like:0,
                        dislike:0,
                        topic_id:new ObjectID(data.topicId)
                }, {w:-1}, function(err, document) {
                    console.log(document._id + " | " + document.idea);
                    // Update client.
                    socket.emit('serverUpdateAddIdea', {ideaId: document[0]._id, idea: data.idea});
                    socket.broadcast.emit('serverUpdateAddIdea', {ideaId: document[0]._id, idea: data.idea});
                });
            });
    	});
    });
});

// =============== Utility Function
/*
 * Check user log in.
 * If user login already, return true.
 */
function loggedIn(req) {
    if(req.session.name) {
        return true;
    }
    return false;
}