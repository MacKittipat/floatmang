var express = require('express');
var ejs = require('ejs');
var socketio = require('socket.io');
var mongodb = require('mongodb');
var routes = require('./routes');

// =============== Config
var appHost = '127.0.0.1';
var appPort = 8888;
var dbHost = "192.168.51.102";
var dbPort = 27017;
var dbName = "floatmang";
var dbUrl = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
var tbTopic = "topic";
var tbIdea = "idea";
var tbComment = "comment";

// =============== Web App Global Var 
var app = express();
var listen =  app.listen(appPort);
var io = socketio.listen(listen);
var mongoClient = mongodb.MongoClient;

// =============== Web App Config
app.engine('html', ejs.__express); // Use ejs template engine.
app.set('views', __dirname + '/view'); // Set view dir.
app.set('view engine', 'html'); // Set view extension.
app.use(express.static(__dirname + '/resource/js')); // Import all static file in /resource/js.
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: "MySessionSecret", key: 'MySessionKey'}));

// =============== Web App Route
app.get('/', function(req, res) {
    if(req.session.name) { // If user login already.
        res.redirect('topic'); // Redirect to topic page.
    }
    res.render('login');
});
app.post('/', function(req, res) {  
    // Create session 'name'.
    req.session.name = 'anonymous';
    if(!req.body.anonymous) { // If not an anonymous.
        req.session.name = req.body.name; // Get post parameter 'name' and set session.
    }
    res.redirect('topic');
});
app.get('/topic', function(req, res) {
    if(req.session.name) { // If user login already.
        // Display topic.
        mongoClient.connect(dbUrl, function(err, db) { 
            console.log(1);
            db.collection(tbTopic, function(err, collection) {
                var cursorTopic = collection.find({}, {sort:{createtime:-1}});
                console.log(2);
                cursorTopic.toArray(function(err, documents) {
                    console.log(3);
                    for(var key in documents) {
                        console.log(documents[key].topic + " | " + documents[key].createby + " | " + documents[key].createtime);
                    }
                });
            });
        });
        res.render('topic');
    } else { // If user not login, redirect to login page.
        res.redirect('/');
    }
});
app.get('/test', function(req, res) {
    res.render('test');
});
    

console.log('App is running : http://localhost:' + appPort);

// =============== Socket.IO
io.sockets.on('connection', function (socket) {
    socket.on('clientSendMessage', function (data) {
        console.log("Socket : " + data.name);
    });   
});

