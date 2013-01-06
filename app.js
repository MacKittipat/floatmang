var express = require('express');
var ejs = require('ejs');
var socketio = require('socket.io');
var mongodb = require('mongodb');
var humane = require('./lib/humane');
var passport = require('passport');
var async = require('async');

// =============== Config
var appHost = 'localhost';
var appPort = 8888;
var dbHost = 'localhost';
var dbPort = 27017;
var dbName = "floatmang";
var dbUrl = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
var tbTopic = "topic";
var tbIdea = "idea";
var limit = 10;
var fbAppId = "145982255474152";
var fbAppSecret = "7c9dbcb785a465357017d9177faf6b48";
var fbCallbackUrl = 'http://' + appHost + ':' + appPort + '/fb/auth/callback'

// =============== Web App Global Var 
var app = express();
var listen =  app.listen(appPort);
var io = socketio.listen(listen);
var mongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var BSON = require('mongodb').BSONPure;
var FacebookStrategy = require('passport-facebook').Strategy;

// =============== Web App Config
app.engine('html', ejs.__express); // Use ejs template engine.
app.set('views', __dirname + '/view'); // Set view dir.
app.set('view engine', 'html'); // Set view extension.
app.use(express.static(__dirname + '/resource/js')); // Import all static file in /resource/js.
app.use(express.static(__dirname + '/floatmang_design/assets'));
app.use(express.bodyParser()); // Enable req.body.PARAMETER.
app.use(express.cookieParser()); // Enable session/cookie.
app.use(express.session({secret: "MySessionSecret", key: 'MySessionKey'}));
app.use(passport.initialize());
app.use(passport.session());

// =============== FB passport

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: fbAppId,
    clientSecret: fbAppSecret,
    callbackURL: fbCallbackUrl
}, 
function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
        return done(null, profile);
    });
}));

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
    // Create cookie 'name'.
    res.cookie('name', 'anonymous');
    // If not an anonymous.
    if(!req.body.anonymous) { 
        // Get post parameter 'name' and set cookie.
        res.cookie('name', req.body.name);
    }
    res.redirect('topic');
});

app.get('/fb/login', passport.authenticate('facebook'), 
    function(req, res){
    });

app.get('/fb/auth/callback', passport.authenticate('facebook'), 
    function(req, res) {
        console.log("[DEBUG] FB login : " + req.user.id + " | " + req.user.displayName);
        // Create cookie 'name'.
        res.cookie('name', req.user.displayName);
        res.redirect('/topic');
    });

app.get('/logout', function(req, res) {
    req.logout();
    res.clearCookie('name');
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
                    if(documents==0) {
                        collection.find().count(function(err, count) { 
                            res.render('topic', {
                                documents:documents,
                                totalTopic:count,
                                appHost:appHost,
                                appPort:appPort,
                                limit:limit,
                                name:req.cookies.name
                            });
                        });
                    } else {
                        var documentIndex = 0;
                        async.map(documents, function(item) {
                            mongoClient.connect(dbUrl, function(err, db) { 
                                db.collection(tbIdea, function(err, collectionIdea) {
                                    collectionIdea.find({
                                        topic_id:item._id
                                    }).count(function(err, count) { 
                                        // Extend count idea field and render view if it is a last index of document.
                                        item.count_idea = count;
                                        if(documentIndex == documents.length-1) {
                                            // Count all topic.
                                            collection.find().count(function(err, count) { 
                                                res.render('topic', {
                                                    documents:documents,
                                                    totalTopic:count,
                                                    appHost:appHost,
                                                    appPort:appPort,
                                                    limit:limit,
                                                    name:req.cookies.name
                                                });
                                            });
                                        }
                                        documentIndex++;
                                    });
                                });
                            });
                        }, function(err, result) {});
                    }
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
                                    name:req.cookies.name
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
                                    name:req.cookies.name
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
                if(documents==0) {
                    // Return topic as JSON. 
                    res.json(documents);  
                } else {
                    var documentIndex = 0;
                    async.map(documents, function(item) {
                        mongoClient.connect(dbUrl, function(err, db) { 
                            db.collection(tbIdea, function(err, collectionIdea) {
                                collectionIdea.find({
                                    topic_id:item._id
                                }).count(function(err, count) { 
                                    // Extend count idea field and render view if it is a last index of document.
                                    item.count_idea = count;
                                    if(documentIndex == documents.length-1) {
                                        // Return topic as JSON. 
                                        res.json(documents);  
                                    }
                                    documentIndex++;
                                });
                            });
                        });
                    }, function(err, result) {});
                }                                               
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

console.log('App is running : http://' + appHost + ':' + appPort);

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
                    // Update myself. Clear textbox in my browser only.
                    socket.emit('serverUpdateAddTopicMe');
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
                    // Update client.
                    socket.emit('serverUpdateAddIdea', {ideaId: document[0]._id, idea: data.idea, createby:document[0].createby, topicId:document[0].topic_id});
                    socket.broadcast.emit('serverUpdateAddIdea', {ideaId: document[0]._id, idea: data.idea, createby:document[0].createby, topicId:document[0].topic_id});
                    // Update myself. Clear textbox in my browser only.
                    socket.emit('serverUpdateAddIdeaMe');
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
    if(req.cookies.name) {
        return true;
    }
    return false;
}