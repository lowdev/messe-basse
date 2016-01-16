var console = require('console');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var bodyParser = require('body-parser')

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

var port = process.env.PORT || 5000;
http.listen(port, function(){
  console.log('listening on *:' + port);
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/createConversation', function(req, res) {
	res.json(saveConversation(req.body));
});

app.post('/loadmessages', function(req, res) {
});

app.get('/loadConversations', function(req, res) {
});

var occupancy = 0;
io.on('connection', function(socket){
	//console.log('a user connected');
	occupancy++;
	io.emit('chat message occupancy', {occupancy: io.engine.clientsCount});

	socket.on('disconnect', function(){
		//console.log('user disconnected');
		occupancy--;
		io.emit('chat message occupancy', {occupancy: io.engine.clientsCount});
	});

	socket.on('chat message', function(msg){
		//console.log('message: ' + JSON.stringify(msg));
		//io.emit('chat message', msg);
		saveMessage(msg);
		socket.broadcast.emit('chat message', msg);
	});
});

function saveMessage(message) {
}

function saveConversation(location) {
}

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};


function debugHeaders(req) {
	console.log('URL: ' + req.url);
	for (var key in req.headers) {
		console.log(key + ': ' + req.headers[key]);
	}
	console.log('\n\n');
}
