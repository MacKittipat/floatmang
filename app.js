var express = require('express');
var ejs = require('ejs');
var socketio = require('socket.io');
var mongodb = require('mongodb');
var routes = require('./routes');

// =============== Config
var appHost = '127.0.0.1';
var appPort = 8888;

// =============== Web App Config
var app = express();
var listen =  app.listen(appPort);
var io = socketio.listen(listen);
app.engine('html', ejs.__express); // Use ejs template engine.
app.set('views', __dirname + '/view'); // Set view dir.
app.set('view engine', 'html'); // Set view extension.
app.use(express.static(__dirname + '/resource/js')); // Import all static file in /resource/js.

// =============== Web App Route
app.get('/', routes.login);
app.get('/topic', routes.topic);
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

