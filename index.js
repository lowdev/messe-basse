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

// Model
var conversationSchema = mongoose.Schema({
    title: String,
	loc: {
		type: [Number],  // [<longitude>, <latitude>]
		index: '2d'      // create the geospatial index
    }
});
var Conversation = mongoose.model('Conversation', conversationSchema);

var messageSchema = mongoose.Schema({
    speudo: String,
	text: String,
	createdAt: Date,
	conversationId: String
});
var Message = mongoose.model('Message', messageSchema);

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
	//console.log('a user connected : ' + req.body.id);
	Message.find({ conversationId: req.body.id }, function (err, messages) {
	  if (err) return console.error(err);
	  res.json(200, messages);
	});
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
function saveMessage(messageFromGui) {
	console.log('Save message');
	var message = new Message();
	message.speudo = messageFromGui.speudo;
	message.text = messageFromGui.text;
	message.createdAt = messageFromGui.createdAt;
	message.conversationId = messageFromGui.conversationId;

	message.save(function (err, message) {
	  if (err) return console.error(err);
	});
}
