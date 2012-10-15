if (!window.WebSocket && window.MozWebSocket)
	window.WebSocket = window.MozWebSocket;
if (!window.WebSocket)
	alert('WebSocket not supported by this browser');

var exports = {};

function SummonersConventionClient() {

	var Summoning = new exports.Summoning();

	$('#changeName').click(function(e) {
		socket.send(JSON.stringify({
			event : 'changeName',
			name : $('#playerName').val()
		}));
	});
	
	var materialSelect = $('#materialSelect');
	for(i in Summoning.MATERIAL){
		materialSelect.append($('<option></option>').val(i).html(i + ' (' + Summoning.MATERIAL[i].cost + ')'));
	}
	materialSelect.change(function(){recalcCost();});
	
	var attackSelect = $('#attackSelect');
	for(i in Summoning.ATTACK_MODIFICATION){
		attackSelect.append($('<option></option>').val(i).html(i + ' (' + Summoning.ATTACK_MODIFICATION[i].cost + ')'));
	}
	attackSelect.change(function(){recalcCost();});
	
	var abilitiesDiv = $('#abilities');
	for(i in Summoning.ABILITY){
		var id = 'ability-' + i;
		var text = i + ' (' + Summoning.ABILITY[i].cost + ')';
		abilitiesDiv.append($('<input type="checkbox" id="'+id+'" value="'+id+'" /><label for="'+id+'">'+text+'</label>'));
		$('#' + id).change(function(){recalcCost();});
	}

	var socketEventHandler = function(data) {
		switch (data.event) {
		case 'connected':
			$('#playerName').val(data.name);
			playerJoined(data);
			break;
		case 'playerJoined':
			playerJoined(data);
			break;
		case 'playerLeft':
			playerLeft(data);
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
	
	function playerJoined(playerData){
		$('#players').append($('<tr id="playerRow' + playerData.playerNumber + '"><td>' + playerData.name + '</td><td></td><td></td></tr>'));
	}
	
	function playerLeft(playerData){
		$('#playerRow' + playerData.playerNumber).remove();
	}
	
	function recalcCost(){
		var material = $('#materialSelect').val();
		var attack = $('#attackSelect').val();
		var abilities = [];
		for(i in Summoning.ABILITY){
			if($('#ability-' + i).attr('checked') == 'checked'){
				abilities.push(i);
			}
		}
		$('#cost').text(Summoning.calculateCost(material, attack, abilities));
	}

}