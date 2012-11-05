var Summoning = require('./summoning.js').Summoning;

exports.SummonersConvention = function(players, conventionEventHandler){
    
    var FULL_DAMAGE = 35;
    
    var summoning = new Summoning();
	
	this.convene = function(){
		conventionEventHandler({event:'start'});
		setTimeout(summonGolems, 1000);
	};
	
	function summonGolems(){
		players.forEach(function(player){player.health = 100; player.target = undefined; player.currentConventionConfig = JSON.parse(JSON.stringify(player.golemConfig));});
		players.forEach(function(player){conventionEventHandler({event: 'golem-summoned', name: player.name, health: player.health, playerNumber: player.playerNumber, golemConfig: player.currentConventionConfig});});
		setTimeout(stepConventionForward, 1000);
	}
	
	function stepConventionForward(){
		var survivors = players.filter(function(player){return player.health > 0;});
		survivors.forEach(function(survivor){executeStepForPlayer(survivor, survivors.filter(function(otherSurvivor){return survivor !== otherSurvivor;}));});
		survivors.forEach(function(survivor){if(survivor.health <= 0) conventionEventHandler({event:'golem-destroyed', name: survivor.name, playerNumber: survivor.playerNumber});});
		var survivors = players.filter(function(player){return player.health > 0;});
		if(survivors.length === 0) {
			conventionEventHandler({event: 'winner'});
			setTimeout(end, 0);
		} else if (survivors.length === 1) {
			conventionEventHandler({event: 'winner', name: survivors[0].name, playerNumber: survivors[0].playerNumber});
			setTimeout(end, 0);
		} else {
			setTimeout(stepConventionForward, 1000);
		}
	}
	
	function executeStepForPlayer(player, otherSurvivors){
	    examineTarget(player, otherSurvivors);
		if(isHitSuccess(player)){
			var damage = generateHitDamage(player);
			player.target.health -= damage;
			conventionEventHandler({
			    event:'golem-hit',
			    name:player.name,
			    target:player.target.name,
			    damage:damage,
			    playerNumber:player.playerNumber,
			    targetPlayerNumber:player.target.playerNumber,
			    targetHealth:player.target.health});
		} else {
			conventionEventHandler({event:'golem-misses', name:player.name, target:player.target.name, playerNumber: player.playerNumber});
		}
	}
	
	function examineTarget(player, otherSurvivors) {
	    if(typeof player.target === 'undefined' || player.target.health <= 0){
            player.target = otherSurvivors[Math.floor(otherSurvivors.length * Math.random())];
            conventionEventHandler({event:'golem-targeted', name:player.name, target:player.target.name, playerNumber: player.playerNumber, targetPlayerNumber: player.target.playerNumber,});
        }
	}
	
	function isHitSuccess(player){
	    return Math.random() <= 0.8;
	}
	
	function generateHitDamage(player) {
	    var unblockedDamage = FULL_DAMAGE * Math.random();
	    var blockedDamage = unblockedDamage * Math.random() * summoning.MATERIAL[player.target.currentConventionConfig.material][player.currentConventionConfig.attack];
	    return Math.max(0, Math.ceil(unblockedDamage - blockedDamage));
	}
	
	function end(){
		conventionEventHandler({event:'end'});
	}
	
};