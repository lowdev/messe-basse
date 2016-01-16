var console = require('console');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usergrid = require('usergrid');
var bodyParser = require('body-parser')

var messages = new Array();
var occupancy = 0;

var apigeeClient = new usergrid.client({
	orgName:'lowentropydev',
	appName:'sandbox'
});

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
	var options = {
		type:'chuchottement',
		qs:{ql:"conversationId = 'active' &limit=50"}
	}

	var messageWithValue = [];
	apigeeClient.createCollection(options, function (err, messages) {
		if (err) {
			console.log("error : " + err);
		} else {
			while(messages.hasNextEntity()) {
				messageWithValue.push(JSON.parse(messages.getNextEntity()._json));
			}

			res.json(messageWithValue)
		}
	});
});

app.get('/loadConversations', function(req, res) {
	var options = {
		type:'conversations',
		qs:{limit:50}
	}

	var messageWithValue = [];
	apigeeClient.createCollection(options, function (err, messages) {
		if (err) {
			console.log("error : " + err);
		} else {
			while(messages.hasNextEntity()) {
				messageWithValue.push(JSON.parse(messages.getNextEntity()._json));
			}

			res.json(messageWithValue)
		}
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

function saveMessage(message) {
	var uuid = generateUUID();
	var options = {
		type: 'chuchottement',
		name: uuid
	}
	apigeeClient.createEntity(options, function (err, response) {
		if (err) { // Error - the book was not saved properly
			console.log('error create entity ' + JSON.stringify(err));
		} else { // Success - the book was created properly
			response.set(message);
			response.save(function(err){
				if (err){
					console.log('error save entity ' + err);
				} else {
					console.log('Successufuly saved !');
					link(uuid, message.conversationId);
				}
			});
		}
	});
}

function link(message, conversation) {
	// create an Entity object that models the connecting entity
	var connecting_entity_options = {
		client: apigeeClient,
		data: {
			type:'chuchottement',
			name: 'f320801f-0c6e-4e16-97ae-d5638d2f4a29'
		}
	};
	var connecting_entity = new usergrid.entity(connecting_entity_options);

	// create an Entity object that models the entity being connected to
	var connected_entity_options = {
		client: apigeeClient,
		data: {
			type:'conversation',
			name:'1fd72430-860e-4538-95d6-3c239b6c6d01'
		}
	};

	var connected_entity = new usergrid.entity(connected_entity_options);

	// the connection type
	var relationship = 'isIn';

	// send the POST request
	connecting_entity.connect(relationship, connected_entity, function (error, result) {

		if (error) { 
			// Error
			console.log('error linked ' + error);
		} else { 
			// Success
			console.log('Successufuly linked !');
		}

	});
}

function saveConversation(location) {
	var uuid = generateUUID();
	var options = {
		type: 'conversation',
		name: uuid
	}
	apigeeClient.createEntity(options, function (err, response) {
		if (err) { // Error - the book was not saved properly
			console.log('error create entity ' + JSON.stringify(err));
		} else { // Success - the book was created properly
			response.set(location);
			response.save(function(err){
				if (err){
					console.log('error save entity ' + err);
				} else {
					console.log('Successufuly saved !');
				}
			});
		}
	});
	return uuid;
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
