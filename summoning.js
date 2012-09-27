exports.Summoning = function(){
	
	this.MATERIAL = {
			Straw: {cost: 0},
			Wood: {cost: 15},
			Ice: {cost: 15},
			Clay: {cost: 20},
			Iron: {cost: 30},
		};
	
	this.ATTACK_MODIFICATION = {
			Base: {cost: 0},
			Copper: {cost: 20},
			Acid: {cost: 30},
			Fire: {cost: 30},
		};
	
	this.ABILITY = {
			Regeneration: {cost: 25},
			Draining: {cost: 25},
		};
	
	this.calculateCost = function(material, attackModification, abilities){
		var abilitiesCost = 0;
		for(var i=0; i<abilities.length; i++){
			abilitiesCost += this.ABILITY[abilities[i]].cost;
		}
		return this.MATERIAL[material].cost + this.ATTACK_MODIFICATION[attackModification].cost + abilitiesCost; 
	}
	
};