exports.Summoning = function(){
	
	this.MATERIAL = {
			Straw: {cost:  0, Base: 0.70, Copper: 0.75, Acid: 0.50, Fire: 0.15},
			Wood:  {cost: 15, Base: 0.80, Copper: 0.85, Acid: 0.65, Fire: 0.35},
			Ice:   {cost: 15, Base: 0.80, Copper: 0.57, Acid: 1.00, Fire: 0.25},
			Clay:  {cost: 20, Base: 0.90, Copper: 0.60, Acid: 0.75, Fire: 0.80},
			Iron:  {cost: 30, Base: 1.00, Copper: 1.00, Acid: 0.30, Fire: 1.00},
		};
	
	this.ATTACK_MODIFICATION = {
			Base:   {cost: 0},
			Copper: {cost: 20},
			Acid:   {cost: 30},
			Fire:   {cost: 30},
		};
	
	this.ABILITY = {
			//Regeneration: {cost: 25},
			//Draining: {cost: 25},
		};
	
	this.calculateCost = function(material, attackModification, abilities){
		var abilitiesCost = 0;
		for(var i=0; i<abilities.length; i++){
			abilitiesCost += this.ABILITY[abilities[i]].cost;
		}
		return this.MATERIAL[material].cost + this.ATTACK_MODIFICATION[attackModification].cost + abilitiesCost; 
	};
	
};