var express = require('express');
var ejs = require('ejs');
var socketio = require('socket.io');
var mongodb = require('mongodb');
var routes = require('./routes');

// =============== Config
var appHost = '127.0.0.1';
var appPort = 8888;
var dbHost = '192.168.51.102';
var dbPort = 27017;
var dbName = "floatmang";
var dbUrl = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
var tbTopic = "topic";
var tbIdea = "idea";
var tbComment = "comment";
var limitTopic = 2;
var ObjectID = mongodb.ObjectID;
var limit = 3;


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
                    // Count all topic.
                    collection.find().count(function(err, count) { 
                        res.render('topic', {
                            documents:documents,
                            totalTopic:count,
                            appHost:appHost,
                            appPort:appPort,
                            limit:limit
                        });
                    });
                });
            });
        });
    } else {
        res.redirect('/');
    }
});

///Show Topic To Edit
app.get('/topic/edit',function(req,res){
  
    //req.boby.id
     if(loggedIn(req)){
          //Display Topic To Edit
          mongoClient.connect(dbUrl,function(err,db){
              db.collection(tbTopic,function(err,collection){
                   var obj_id = BSON.ObjectID.createFromHexString(req.query.id);
                //  var cursorTopic = collection.find({_id : obj_id});
                      collection.findOne({_id : obj_id}, function(err, documents) {
                      console.log(req.query.id)
                       res.render('editTopic',{
                           documents:documents 
                       });
                  });
              })
          })
     }
})

//Update Edit Topic
app.post('/updatetopic', function(req, res) {
       
        var editTopic = req.body.edittopic;
        var createBy = req.session.name;
        console.log("edittopic : "+ editTopic);
        console.log("createBy : " + createBy);
    
        // insert data
        mongoClient.connect(dbUrl, function(err, db) {
                db.collection(tbTopic, function(err, collection) {
                        collection.insert({
                                topic: newTopic,
                                createby: username,
                                createtime:new Date().getTime()
                        }, {w:-1});
                });
        });
});











// Idea in list mode.
app.get('/idea/list', function(req, res) {
    if(loggedIn(req)) {
        mongoClient.connect(dbUrl, function(err, db) { 
            db.collection(tbIdea, function(err, collection) {        
                // Find idea by topic id.
               var cursorIdea = collection.find({topic_id:new ObjectID(req.query.id)}, {sort:{like:-1, createtime:-1}, skip:0, limit:limit}); 
               cursorIdea.toArray(function(err, documents) {
                   // Count all idea.
                    collection.find().count(function(err, count) { 
                        res.render('idealist', {
                            documents:documents,
                            totalIdea:count,
                            topicId:req.query.id,
                            appHost:appHost,
                            appPort:appPort,
                            limit:limit
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
app.get('/idea', function(req, res) {
    
});

//render new topic page
app.get('/newtopic', function(req, res) {
	console.log("returning newtopicpage.");
	res.render('newtopic');
});

//save new topic
app.post('/newtopic', function(req, res) {
	console.log("saving new topic");
	console.log("data : "+ req.body.topic);
	var newTopic = req.body.topic;
	var username = req.session.name;
	console.log("newtopic : "+newTopic);
	console.log("user : "+username);
	// insert data
	mongoClient.connect(dbUrl, function(err, db) { 
		db.collection(tbTopic, function(err, collection) {
			collection.insert({
				topic: newTopic,
				createby: username,
				createtime:new Date().getTime() 		
			}, {w:-1});	
		});
	});
}); 

//request new idea page
app.get('/newidea', function(req, res) {
	console.log("returning new topicpage");
	res.render('newidea');
});

//save new idea
app.post('/newidea', function(req, res) {
	console.log("saving new idea of topic : ");	
});

app.post('/a/moretopic', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbTopic, function(err, collection) {
            // Find topic.
            var cursorTopic = collection.find({}, {sort:{createtime:-1}, skip:req.body.totalDisplayTopic, limit:limit}); 
            cursorTopic.toArray(function(err, documents) { 
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
})

app.post('/a/updateidea', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbIdea, function(err, collection) {
            // Find idea by idea.
            collection.update({_id:new ObjectID(req.body.ideaId)}, {$set:{idea:req.body.idea}}, {w:-1});
            // Update client.
            io.sockets.on('connection', function (socket) {
                console.log("1 : " + req.body.ideaId + " " + req.body.idea);
                socket.emit('serverUpdateEditIdea', {ideaId:req.body.ideaId, idea:req.body.idea});
                socket.broadcast.emit('serverUpdateEditIdea', {ideaId:req.body.ideaId, idea:req.body.idea});
            });
        });
    });
});

app.get('/test', function(req, res) {
    res.render('test');
});

app.get('/json', function(req, res) {
    res.json({a:1});
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
    
    socket.on('clientEditIdea', function (data) {
        console.log("[DEBUG] clientEditIdea, idea id : " + data.ideaId);
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