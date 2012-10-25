if (!window.WebSocket && window.MozWebSocket)
    window.WebSocket = window.MozWebSocket;
if (!window.WebSocket)
    alert('WebSocket not supported by this browser');

var exports = {};

function SummonersConventionClient() {
    
    var Summoning = new exports.Summoning();
    
    $('#myPlayerName').blur(function(e) {
        myNameChanged();
    }).keypress(function(e) {
        if (e.which === 13) {
            myNameChanged();
        }
    });
    
    var materialSelect = $('#materialSelect');
    for (i in Summoning.MATERIAL) {
        materialSelect.append($('<option></option>').val(i).html(i + ' (' + Summoning.MATERIAL[i].cost + ')'));
    }
    materialSelect.change(function() {
        recalcCost();
    });
    
    var attackSelect = $('#attackSelect');
    for (i in Summoning.ATTACK_MODIFICATION) {
        attackSelect.append($('<option></option>').val(i).html(i + ' (' + Summoning.ATTACK_MODIFICATION[i].cost + ')'));
    }
    attackSelect.change(function() {
        recalcCost();
    });
    
    var abilitiesDiv = $('#abilities');
    for (i in Summoning.ABILITY) {
        var id = 'ability-' + i;
        var text = i + ' (' + Summoning.ABILITY[i].cost + ')';
        abilitiesDiv.append($('<input type="checkbox" id="' + id + '" value="' + id + '" /><label for="' + id + '">' + text + '</label>'));
        $('#' + id).change(function() {
            recalcCost();
        });
    }
    
    var socketEventHandler = function(data) {
        switch (data.event) {
        case 'connected':
            connected(data);
            break;
        case 'playersList':
            playersList(data);
            break;
        case 'playerJoined':
            playerJoined(data);
            break;
        case 'playerLeft':
            playerLeft(data);
            break;
        case 'countdown-begin':
            $('#statusSpan').text('beginning countdown...');
            break;
        case 'countdown':
            $('#statusSpan').text(data.second + '...');
            break;
        case 'start':
            $('#statusSpan').text('in progress');
            break;
        case 'golem-summoned':
            golemSummoned(data);
            break;
        case 'golem-targeted':
            golemTargeted(data);
            break;
        case 'golem-hit':
            golemHit(data);
            break;
        case 'golem-misses':
            break;
        case 'golem-destroyed':
            golemDestroyed(data);
            break;
        case 'winner':
            winner(data);
            break;
        case 'end':
            break;
        case 'nameChange':
            nameChange(data);
            break;
        default:
            console.warn('Unkown event: ' + JSON.stringify(data));
        }
    };
    
    var socket = new WebSocket("ws://localhost:8080");
    socket.onmessage = function(message) {
        try {
            var json = JSON.parse(message.data);
            socketEventHandler(json);
        } catch (e) {
            console.log('Unable to parse socket event: ' + message.data + '\n' + e);
        }
    };
    
    var me = {};
    
    function connected(data){
        $('#myPlayerName').val(data.name);
        me.playerNumber = data.playerNumber;
    }
    
    function winner(data) {
        $('#statusSpan').text(typeof data.name === 'undefined'? 'a draw!' : data.name + ' wins!');
    }
    
    function golemDestroyed(data) {
        $('#playerHealth' + data.playerNumber).text(0);
        $('#playerTarget' + data.playerNumber).text('');
    }
    
    function golemHit(hitData) {
        $('#playerHealth' + hitData.targetPlayerNumber).text(hitData.targetHealth);
    }
    
    function golemSummoned(golemData) {
        $('#playerHealth' + golemData.playerNumber).text(golemData.health);
        $('#playerTarget' + golemData.playerNumber).text('');
    }
    
    function golemTargeted(golemData) {
        $('#playerTarget' + golemData.playerNumber).text(golemData.target);
        if(golemData.playerNumber === me.playerNumber){
            me.targetPlayerNumber = golemData.targetPlayerNumber;
        }
    }
    
    function playersList(playersData) {
        for(playerI in playersData.players){
            var player = playersData.players[playerI];
            $('#players').append(buildPlayerRow(player.playerNumber, player.name));
        }
    };
    
    function playerJoined(playerData) {
        $('#players').append(buildPlayerRow(playerData.playerNumber, playerData.name));
    }
    
    function buildPlayerRow(playerNumber, playerName) {
        return $('<tr id="playerRow' + playerNumber + '"><td id="playerName' + playerNumber + '">' + playerName + '</td><td id="playerHealth' + playerNumber + '"></td><td id="playerTarget' + playerNumber + '"></td></tr>');
    }
    
    function playerLeft(playerData) {
        $('#playerRow' + playerData.playerNumber).remove();
    }
    
    function nameChange(data){
        $('#playerName' + data.playerNumber).text(data.name);
    }
    
    function recalcCost() {
        var material = $('#materialSelect').val();
        var attack = $('#attackSelect').val();
        var abilities = [];
        for (i in Summoning.ABILITY) {
            if ($('#ability-' + i).attr('checked') === 'checked') {
                abilities.push(i);
            }
        }
        $('#cost').text(Summoning.calculateCost(material, attack, abilities));
    }
    
    function myNameChanged(){
        socket.send(JSON.stringify({
            event : 'nameChange',
            name : $('#myPlayerName').val()
        }));
    }
    
}