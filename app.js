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
var limitTopic = 2;

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
    if(!req.body.anonymous) { // If not an anonymous.
        req.session.name = req.body.name; // Get post parameter 'name' and set session.
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
                var cursorTopic = collection.find({}, {sort:{createtime:-1}, skip:0, limit:limitTopic}); // Find topic.
                cursorTopic.toArray(function(err, documents) { 
                    collection.find().count(function(err, count) { // Count all topic.
                        res.render('topic', {
                            documents:documents,
                            totalTopic:count
                        });
                    });
                });
            });
        });
    } else { // If user not login, redirect to login page.
        res.redirect('/');
    }
});

app.post('/a/moretopic', function(req, res) {
    mongoClient.connect(dbUrl, function(err, db) { 
        db.collection(tbTopic, function(err, collection) {
            var cursorTopic = collection.find({}, {sort:{createtime:-1}, skip:req.body.totalDisplayTopic, limit:limitTopic}); // Find topic.
            cursorTopic.toArray(function(err, documents) { 
                res.json(documents); // Return topic as JSON.   
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
    socket.on('clientSendMessage', function (data) {
        console.log("Socket : " + data.name);
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