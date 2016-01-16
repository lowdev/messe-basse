var console = require('console');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://low:low@ds035975.mongolab.com:35975/messe-basse');
var db = mongoose.connection;

var messages = new Array();
var occupancy = 0;

app.use(express.static(__dirname));
app.use(bodyParser.json());

// Model
var conversationSchema = mongoose.Schema({
    title: String,
	loc: {
		type: [Number],  // [<longitude>, <latitude>]
		index: '2d'      // create the geospatial index
    }
});
var Conversation = mongoose.model('Conversation', conversationSchema);

var port = process.env.PORT || 5000;
http.listen(port, function(){
  console.log('listening on *:' + port);
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
	console.log('Db connected!!!');
  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loadConversations', function(req, res) {
	//console.log('loadConversations');
	
	/*Conversation.find({  
		loc: {
			$near: coords,
			$maxDistance: maxDistance
		}
	}).limit(5).exec(function(err, conversations) {
		if (err) {
			return res.json(500, err);
		}

		res.json(200, conversations);
	});*/
	
	Conversation.find(function (err, conversations) {
	  if (err) return console.error(err);
	  res.json(200, conversations);
	});
});

app.post('/createConversation', function(req, res) {
	res.json(saveConversation(req.body));
});
function saveConversation(conversationFromGui) {
	var conversation = new Conversation();
	conversation.title = conversationFromGui.title;
	conversation.loc = [conversationFromGui.location.longitude, conversationFromGui.location.latitude];
	
	conversation.save(function (err, conversation) {
	  if (err) return console.error(err);
	});
	
	return conversationFromGui;
}

app.post('/loadmessages', function(req, res) {
});

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
