var express = require('express');
var ejs = require('ejs');
var socketio = require('socket.io');
var mongodb = require('mongodb');
var clientSessions = require('client-sessions');
var routes = require('./routes')

// =============== Config
var appHost = '127.0.0.1';
var appPort = 8888;

// =============== Web App Config
var app = express();
app.engine('html', ejs.__express); // Use ejs template engine.
app.set('views', __dirname + '/view'); // Set view dir.
app.set('view engine', 'html'); // Set view extension.
app.use(express.static(__dirname + '/resource/js')); // Import all static file in /resource/js.
app.use(clientSessions({
                       cookieName: 'session_state',    // defaults to session_state
                       secret: 'blargadeeblargblarg', // MUST be set
                       // true session duration:
                       // will expire after duration (ms)
                       // from last session.reset() or
                       // initial cookieing.
                       duration: 24 * 60 * 60 * 1000 // defaults to 1 day
                       }));

app.get('/', function(req, res) {
        res.render('login', {
                   data: {
                   message: 'hello from node'
                   }
                   });
        });

app.get('/info', function(req, res) {
        res.render('info', {
                   data: {
                   message: 'hello from node'
                   }
                   });
        });

var listen =  app.listen(appPort);
console.log('App is running : http://localhost:' + appPort);