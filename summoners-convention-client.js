if (!window.WebSocket && window.MozWebSocket)
	window.WebSocket = window.MozWebSocket;
if (!window.WebSocket)
	alert('WebSocket not supported by this browser');

var exports = {};

function SummonersConventionClient() {

	$('#changeName').click(function(e) {
		socket.send(JSON.stringify({
			event : 'changeName',
			name : $('#playerName').val()
		}));
	});
	
	var Summoning = new exports.Summoning();
	var materialSelect = $('#materialSelect');
	for(i in Summoning.MATERIAL){
		//materialsSelect
	}

	var socketEventHandler = function(data) {
		switch (data.event) {
		case 'connected':
			$('#playerName').val(data.name);
			break;
		default: console.warn('Unkown event: ' + JSON.stringify(data));
		}
	};

	var socket = new WebSocket("ws://localhost:8080");
	socket.onmessage = function(message) {
		try {
			var json = JSON.parse(message.data);
			socketEventHandler(json);
		} catch (e) {
			console.log('Unable to parse socket event: ' + message.data + '\n'
					+ e);
		}
	};

}