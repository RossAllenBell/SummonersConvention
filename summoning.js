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
    
    this.PROTECTION_MATRIX = {
        //        Base  Copp  Acid  Fire
        'Straw': [1.00, 0.75, 0.50, 0.15],
        'Wood':  [1.00, 0.85, 0.65, 0.35],
        'Ice':   [1.00, 0.57, 1.00, 0.25],
        'Clay':  [1.00, 0.90, 0.85, 1.00],
        'Iron':  [1.00, 1.00, 0.00, 1.00],
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
	};
	
};