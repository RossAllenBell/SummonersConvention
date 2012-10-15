var connect = require('connect');
var WebSocketServer = require('websocket').server;
var SummonersConvention = require('./summoners-convention.js').SummonersConvention;
var Summoning = require('./summoning.js').Summoning;

var server = connect.createServer(connect.static(__dirname)).listen(8080);
var wsServer = new WebSocketServer({httpServer: server});

var latestTimeoutId = undefined;

var SETUP_SECONDS = 5;

var players = [];
var connectionsToPlayers = {};
var playerNameSequence = 1;

wsServer.on('request', function(request) {
	var connection = request.accept();
	var playerNumber = playerNameSequence++;
	var player = {playerNumber: playerNumber, connection: connection, playerId: connection.socket.remoteAddress + ":" + connection.socket.remotePort, name: "Player " + playerNumber, energy: 30};
	connection.sendUTF(JSON.stringify({event: 'connected', name: player.name, playerNumber: playerNumber}));
	messagePlayers({event:'playerJoined', name: player.name, playerNumber: playerNumber});
	players.push(player);
	connectionsToPlayers[connection] = player;
	
	if(typeof latestTimeoutId == 'undefined' && players.length >= 2){
		latestTimeoutId = setTimeout(start, 0);
	}
	
	connection.on('message', function(message) {
		try{
			var data = JSON.parse(message.utf8Data);
			socketEventHandler(this, data);
		} catch (e){
			console.warn('Unable to parse socket event: ' + message.utf8Data + '\n' + e);
		}
	});
	connection.on('close', function(reasonCode, description) {
		var player = connectionsToPlayers[this];
		messagePlayers({event:'playerLeft', name: player.name, playerNumber: player.playerNumber});
		var that = this;
		players = players.filter(function(player){return player.connection != that;});
		connectionsToPlayers[this] = undefined;
	});
});

function messagePlayers(message){
	var text = JSON.stringify(message);
	console.log(text);
	players.forEach(function(player){player.connection.sendUTF(text);});
}

function start(){
	messagePlayers({event: 'countdown-begin'});
	setTimeout(countdown, 0);
}

function countdown(secondsLeft){
	secondsLeft = secondsLeft || SETUP_SECONDS;
	messagePlayers({event: 'countdown', second: secondsLeft});
	secondsLeft--;
	if(secondsLeft > 0){
		setTimeout(function(){countdown(secondsLeft);}, 1000);
	} else {
		var summonersConvention = new SummonersConvention(players, conventionEventHandler);
		setTimeout(summonersConvention.convene, 1000);
	}
}

function end(){
	if(players.length >= 2){
		latestTimeoutId = setTimeout(start, 1000);
	} else {
		latestTimeoutId = undefined;
	}	
}

var conventionEventHandler = function(data){
	switch(data.event){
	case 'end':
		end();
		break;
	}

	messagePlayers(data);
};

var socketEventHandler = function(connection, data){
	switch(data.event){
	case 'changeName':
		connectionsToPlayers[connection].name = data.name;
		break;
	};
};