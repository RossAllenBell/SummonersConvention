exports.SummonersConvention = function(players, conventionEventHandler){	
	
	this.convene = function(){
		conventionEventHandler({event:'start'});
		setTimeout(summonGolems, 1000);
	};
	
	function summonGolems(){
		players.forEach(function(player){player.health = 100; player.target = undefined;});
		players.forEach(function(player){conventionEventHandler({event: 'golem-summoned', name: player.name, health: player.health, playerNumber: player.playerNumber});});
		setTimeout(melee, 1000);
	}
	
	function melee(){
		var survivors = players.filter(function(player){return player.health > 0;});
		survivors.forEach(function(survivor){executeAttack(survivor, survivors.filter(function(otherSurvivor){return survivor !== otherSurvivor;}));});
		survivors.forEach(function(survivor){if(survivor.health <= 0) conventionEventHandler({event:'golem-destroyed', name: survivor.name, playerNumber: survivor.playerNumber});});
		var survivors = players.filter(function(player){return player.health > 0;});
		if(survivors.length === 0) {
			conventionEventHandler({event: 'winner'});
			setTimeout(end, 0);
		} else if (survivors.length === 1) {
			conventionEventHandler({event: 'winner', name: survivors[0].name, playerNumber: survivors[0].playerNumber});
			setTimeout(end, 0);
		} else {
			setTimeout(melee, 1000);
		}
	}
	
	function executeAttack(player, otherSurvivors){
		if(typeof player.target === 'undefined' || player.target.health <= 0){
			player.target = otherSurvivors[Math.floor(otherSurvivors.length * Math.random())];
			conventionEventHandler({event:'golem-targeted', name:player.name, target:player.target.name, playerNumber: player.playerNumber, targetPlayerNumber: player.target.playerNumber,});
		}
		var hitLanded = Math.random() >= 0.5;
		if(hitLanded){
			var damage = Math.ceil(33 * Math.random());
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
	
	function end(){
		conventionEventHandler({event:'end'});
	}
	
};