if (!window.WebSocket && window.MozWebSocket)
    window.WebSocket = window.MozWebSocket;
if (!window.WebSocket)
    alert('WebSocket not supported by this browser');

var exports = {};

function SummonersConventionClient() {
    
    var canvas = new FluidCanvas({container: $('#renderDiv'), drawableWidth:500, drawableHeight:500, unavailableHeight: function(){return $('#hudDiv').height();}});
    $('#hudDiv').bind('DOMSubtreeModified', canvas.resizeContainerDiv);
    
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
        materialSelect.append($('<option></option>').attr('id', 'materialOption' + i).val(i).html(i + ' (' + Summoning.MATERIAL[i].cost + ')'));
    }
    materialSelect.change(function() {
        golemOptionsChanged();
    });
    
    var attackSelect = $('#attackSelect');
    for (i in Summoning.ATTACK_MODIFICATION) {
        attackSelect.append($('<option></option>').attr('id', 'attackOption' + i).val(i).html(i + ' (' + Summoning.ATTACK_MODIFICATION[i].cost + ')'));
    }
    attackSelect.change(function() {
        golemOptionsChanged();
    });
    
    var abilitiesDiv = $('#abilities');
    for (i in Summoning.ABILITY) {
        var id = 'ability-' + i;
        var text = i + ' (' + Summoning.ABILITY[i].cost + ')';
        abilitiesDiv.append($('<input type="checkbox" id="' + id + '" value="' + id + '" /><label for="' + id + '">' + text + '</label>'));
        $('#' + id).change(function() {
            golemOptionsChanged();
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
        case 'nameChange':
            nameChange(data);
            break;
        case 'countdown-begin':
            $('#statusSpan').text('beginning countdown...');
            break;
        case 'countdown':
            $('#statusSpan').text(data.second + '...');
            break;
//        case 'convention-start':
//            $('#statusSpan').text('in progress');
//            break;
//        case 'convention-golem-summoned':
//            golemSummoned(data);
//            break;
//        case 'convention-golem-targeted':
//            golemTargeted(data);
//            break;
//        case 'convention-golem-hit':
//            golemHit(data);
//            break;
//        case 'convention-golem-misses':
//            break;
//        case 'convention-golem-destroyed':
//            golemDestroyed(data);
//            break;
//        case 'convention-winner':
//            winner(data);
//            break;
//        case 'convention-end':
//            break;
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
        $('#energy').text(data.energy);
        me.playerNumber = data.playerNumber;
        me.energy = data.energy;
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
        $('#playerGolemConfig' + golemData.playerNumber).text(JSON.stringify(golemData.golemConfig));
    }
    
    function golemTargeted(golemData) {
        $('#playerTarget' + golemData.playerNumber).text(golemData.target);
        if(golemData.playerNumber === me.playerNumber){
            me.targetPlayerNumber = golemData.targetPlayerNumber;
        }
    }
    
    function playersList(playersData) {
        playersData.players.forEach(function(player){playerJoined(player);});
    };
    
    function playerJoined(playerData) {
        $('#players').append(buildPlayerRow(playerData.playerNumber));
        $('#playerName' + playerData.playerNumber).text(playerData.name);
        $('#playerEnergy' + playerData.playerNumber).text(playerData.energy);
    }
    
    function buildPlayerRow(playerNumber) {
        return $('<tr id="playerRow' + playerNumber + '"><td id="playerName' + playerNumber + '"></td><td id="playerEnergy' + playerNumber + '"></td><td id="playerHealth' + playerNumber + '"></td><td id="playerTarget' + playerNumber + '"></td><td id="playerGolemConfig' + playerNumber + '"></td></tr>');
    }
    
    function playerLeft(playerData) {
        $('#playerRow' + playerData.playerNumber).remove();
    }
    
    function nameChange(data){
        $('#playerName' + data.playerNumber).text(data.name);
    }
    
    function golemOptionsChanged() {        
        updateCost();
        
        var actualMaterial = $('#materialSelect').val();
        var actualAttack = $('#attackSelect').val();
        var actualAbilities = [];
        for (i in Summoning.ABILITY) {
            if ($('#ability-' + i).attr('checked') === 'checked') {
                actualAbilities.push(i);
            }
        }        

        socket.send(JSON.stringify({
            event : 'golemConfigChange',
            material : actualMaterial,
            attack : actualAttack,
            abilities: actualAbilities
        }));
        
        for (i in Summoning.MATERIAL) {
            if(Summoning.calculateCost(i, actualAttack, actualAbilities) > me.energy){
                $('#materialOption' + i).prop('disabled', true);
            } else {
                $('#materialOption' + i).prop('disabled', false);
            }
        }
        
        for (i in Summoning.ATTACK_MODIFICATION) {
            if(Summoning.calculateCost(actualMaterial, i, actualAbilities) > me.energy){
                $('#attackOption' + i).prop('disabled', true);
            } else {
                $('#attackOption' + i).prop('disabled', false);
            }
        }
        
        for (i in Summoning.ABILITY) {
            var id = 'ability-' + i;
            if(actualAbilities.indexOf(i) === -1){
                var abilitiesWithI = actualAbilities.slice(0);
                abilitiesWithI.push(i);
                if(Summoning.calculateCost(actualMaterial, actualAttack, abilitiesWithI) > me.energy){
                    $('#' + id).prop('disabled', true);
                } else {
                    $('#' + id).prop('disabled', false);
                }
            } else {
                $('#' + id).prop('disabled', false);
            }
        }
    }
    
    function updateCost() {
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