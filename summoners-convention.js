var Summoning = require('./summoning.js').Summoning;

exports.SummonersConvention = function(playerList, conventionEventHandler) {

    var FULL_DAMAGE = 35;
    var summoning = new Summoning();
    
    var golemNumberSequence = 1;
    
    var summoners = playerList.map(function(player) {
        return {
            playerNumber : player.playerNumber,
            name : player.name,
            golemConfig : player.golemConfig,
            energy : player.energy
        };
    });
    
    this.convene = function() {
        conventionEventHandler({
            event : 'convention-start'
        });
        summoners.forEach(function(summoner) {
            conventionEventHandler({
                event : 'convention-summoner',
                summoner : summoner
            });
        });
        setTimeout(summonGolems, 1000);
    };
    
    function summonGolems() {
        summoners.forEach(function(summoner) {
            var currentConfig = JSON.parse(JSON.stringify(summoner.golemConfig));
            summoner.golem = {
                health : 100,
                material : currentConfig.material,
                attack : currentConfig.attack,
                abilities : currentConfig.abilities,
                golemNumber : golemNumberSequence++,
                playerNumber : summoner.playerNumber
            };
            conventionEventHandler({
                event : 'convention-golem-summoned',
                golem : summoner.golem
            });
        });
        setTimeout(stepConventionForward, 1000);
    }
    
    function stepConventionForward() {
        var survivingGolems = summoners.map(function(summoner){
            return summoner.golem;
        }).filter(function(golem) {
            return golem.health > 0;
        });
        survivingGolems.forEach(function(survivor) {
            executeStepForGolem(survivor, survivingGolems.filter(function(otherSurvivor) {
                return survivor.golemNumber !== otherSurvivor.golemNumber;
            }));
        });
        survivingGolems.forEach(function(survivor) {
            if (survivor.health <= 0)
                conventionEventHandler({
                    event : 'convention-golem-destroyed',
                    golem : survivor
                });
        });
        survivingGolems = survivingGolems.filter(function(golem) {
            return golem.health > 0;
        });
        if (survivingGolems.length === 0) {
            conventionEventHandler({
                event : 'convention-winner'
            });
            setTimeout(end, 0);
        } else if (survivingGolems.length === 1) {
            conventionEventHandler({
                event : 'convention-winner',
                golem : survivingGolems[0]
            });
            setTimeout(end, 0);
        } else {
            setTimeout(stepConventionForward, 1000);
        }
    }
    
    function executeStepForGolem(golem, otherSurvivors) {
        examineTarget(golem, otherSurvivors);
        if (isHitSuccess(golem)) {
            var damage = generateHitDamage(golem);
            var target = golemByGolemNumber(golem.targetGolemNumber);
            target.health -= damage;
            conventionEventHandler({
                event : 'convention-golem-hit',
                golem : golem,
                target : target,
                damage : damage
            });
        } else {
            conventionEventHandler({
                event : 'convention-golem-misses',
                golem : golem
            });
        }
    }
    
    function examineTarget(golem, otherSurvivors) {
        if ((typeof golem.target === 'undefined' || golemByGolemNumber(golem.targetGolemNumber).health <= 0) && otherSurvivors.length > 0) {
            golem.targetGolemNumber = otherSurvivors[Math.floor(otherSurvivors.length * Math.random())].golemNumber;
            conventionEventHandler({
                event : 'convention-golem-targeted',
                golem : golem
            });
        }
    }
    
    function isHitSuccess(golem) {
        return Math.random() <= 0.8;
    }
    
    function generateHitDamage(golem) {
        var unblockedDamage = FULL_DAMAGE * Math.random();
        var target = golemByGolemNumber(golem.targetGolemNumber);
        var blockedDamage = unblockedDamage * Math.random() * summoning.MATERIAL[target.material][golem.attack];
        return Math.max(0, Math.ceil(unblockedDamage - blockedDamage));
    }
    
    function end() {
        conventionEventHandler({
            event : 'convention-end'
        });
    }
    
    function golemByGolemNumber(golemNumber){
        return summoners.map(function(summoner){
            return summoner.golem;
        }).filter(function(golem){
            return golem.golemNumber === golemNumber;
        })[0];
    }
    
};