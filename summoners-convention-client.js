if (!window.WebSocket && window.MozWebSocket)
    window.WebSocket = window.MozWebSocket;
if (!window.WebSocket)
    alert('WebSocket not supported by this browser');

if(navigator.userAgent.toLowerCase().indexOf('chrome') == -1)
    alert('This application has only been tested in the Chrome browser:\n\nhttps://www.google.com/intl/en/chrome/browser/');

var exports = {};

function SummonersConventionClient() {

    var me = {};
    var summoners = [];
    
    var canvas = new FluidCanvas({container: $('#renderDiv'), drawableWidth:500, drawableHeight:500, unavailableWidth: function(){return $('#connectedPlayersDiv').width();}, unavailableHeight: function(){return $('#hudDiv').height();}});
    $('#hudDiv').bind('DOMSubtreeModified', canvas.resizeContainerDiv);
    $('#connectedPlayersDiv').bind('DOMSubtreeModified', canvas.resizeContainerDiv);
    var conventionRenderer = new ConventionRenderer(canvas, summoners);
    
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
    
    $('#summonButton').click(function(){
        var material = $('#materialSelect').val();
        var attack = $('#attackSelect').val();
        var abilities = [];
        for (i in Summoning.ABILITY) {
            if ($('#ability-' + i).attr('checked') === 'checked') {
                abilities.push(i);
            }
        }        

        socket.send(JSON.stringify({
            event : 'summonGolem',
            material : material,
            attack : attack,
            abilities: abilities
        }));
    });
    
    var socketEventHandler = function(data) {
        switch (data.event) {
        case 'connected':
            connected(data);
            break;
        case 'existing-convention':
            existingConvention(data);
            break;
        case 'convention-summoner-name-change':
            nameChange(data);
            break;
        case 'convention-summoner-joined':
            convetionSummonerJoined(data.summoner);
            break;
        case 'convention-summoner-left':
            conventionSummonerLeft(data.playerNumber);
            break;
        case 'convention-golem-summoned':
            summonerByPlayerNumber(data.golem.playerNumber).golems.push(data.golem);
            break;
        case 'convention-golem-state-update':
            copyProps(golemByGolemNumber(data.golem.golemNumber),data.golem);
            break;
        case 'convention-golem-targeted':
            conventionGolemTargeted(data);
            break;
        case 'convention-golem-hit':
            golemHit(data);
            break;
        case 'convention-golem-missed':
            golemMissed(data);
            break;
        case 'convention-golem-destroyed':
            golemDestroyed(data);
            break;
        case 'convention-golem-unspawn':
            golemUnspawned(data.golem);
            break;
        case 'convention-energy-update':
            energyUpdate(data.summoner);
            break;
        default:
            console.warn('Unkown event: ' + JSON.stringify(data));
        }
    };
    
    var socket = new WebSocket(window.location.href.replace('http', 'ws'));
    socket.onmessage = function(message) {
        socketEventHandler(JSON.parse(message.data));
    };
    
    function connected(data){
        $('#myPlayerName').val(data.name);
        me.playerNumber = data.playerNumber;
    }
    
    function existingConvention(data){
        conventionRenderer.setConfiguration(data.configuration);
        data.summoners.forEach(function(summoner){
            summoners.push(summoner);
            $('#connectedPlayersTable').append(playerRow(summoner.playerNumber, summoner.name));
        });
        $('#summonButton').removeAttr('disabled');
    }
    
    function energyUpdate(summoner){
        summonerByPlayerNumber(summoner.playerNumber).energy = summoner.energy;
        if(summoner.playerNumber === me.playerNumber){
            $('#energy').text(me.energy);
            if(me.energy >= updateCost()){
                $('#summonButton').removeAttr('disabled');
            } else {
                $('#summonButton').attr('disabled', true);
            }
        }
    }
    
    function convetionSummonerJoined(summoner){
        summoners.push(summoner);
        $('#connectedPlayersTable').append(playerRow(summoner.playerNumber, summoner.name));
        if(typeof me.name === 'undefined' && summoner.playerNumber === me.playerNumber){
            me = summoner;
        }
    }
    
    function conventionSummonerLeft(playerNumber){
        for(var i=0; i<summoners.length; i++){
            if(summoners[i].playerNumber === playerNumber){
                summoners.splice(i,1);
                break;
            }
        }
        $('#playerRow' + playerNumber).remove();
    }
    
    function golemUnspawned(unspawnedGolem){
        var summoner = summonerByPlayerNumber(unspawnedGolem.playerNumber);
        for(var i=0; i<summoner.golems.length; i++){
            var golem = summoner.golems[i];
            if(golem.golemNumber === unspawnedGolem.golemNumber){
                summoner.golems.splice(i,1);
                break;
            }
        }
    }
    
    function golemDestroyed(data) {

    }
    
    function golemHit(hitData) {
        copyProps(golemByGolemNumber(hitData.golem.golemNumber),hitData.golem);
        copyProps(golemByGolemNumber(hitData.target.golemNumber),hitData.target);
        conventionRenderer.addEvent(hitData);
    }
    
    function golemMissed(missData) {
        conventionRenderer.addEvent(missData);
    }
    
    function golemSummoned(golemData) {

    }
    
    function conventionGolemTargeted(data) {

    }
    
    function playerRow(playerNumber, playerName){
        var newRow = $('<tr>', {id: 'playerRow' + playerNumber});
        newRow.append($('<td>', {id: 'playerName' + playerNumber}).text(playerName));
        return newRow;
    }
    
    function nameChange(data){
        $('#playerName' + data.playerNumber).text(data.name);
        summonerByPlayerNumber(data.playerNumber).name = data.name;
    }
    
    function golemOptionsChanged() {           
        if(me.energy >= updateCost()){
            $('#summonButton').removeAttr('disabled');
        } else {
            $('#summonButton').attr('disabled', true);
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
        var cost = Summoning.calculateCost(material, attack, abilities);
        $('#cost').text(cost);
        return cost;
    }
    
    function myNameChanged(){
        socket.send(JSON.stringify({
            event : 'nameChange',
            name : $('#myPlayerName').val()
        }));
    }
    
    function summonerByPlayerNumber(aPlayerNumber){
        return summoners.filter(function(summoner){
            return summoner.playerNumber === aPlayerNumber;
        })[0];
    }
    
    function golemByGolemNumber(aGolemNumber){
        return summoners.reduce(function(list, summoner){
            return list.concat(summoner.golems);
        },[]).filter(function(golem){
            if(golem.golemNumber === aGolemNumber){
                return true;
            }
        })[0];
    }
    
    function copyProps(object, newObject){
        for(prop in newObject){
            object[prop] = newObject[prop];
        }
    }
    
}