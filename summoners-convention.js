var Summoning = require('./summoning.js').Summoning;

exports.SummonersConvention = function(playerList, conventionEventHandler, configuration) {
    if(typeof configuration === 'undefined'){
        configuration = {};
    }
    
    var WIDTH = configuration.WIDTH = typeof configuration.WIDTH === 'undefined'? 500 : configuration.WIDTH;
    var HEIGHT = configuration.HEIGHT = typeof configuration.HEIGHT === 'undefined'? 500 : configuration.HEIGHT;
    var MELEE_RANGE = configuration.MELEE_RANGE = typeof configuration.MELEE_RANGE === 'undefined'? 32 : configuration.MELEE_RANGE;
    var GOLEM_WIDTH = configuration.GOLEM_WIDTH = typeof configuration.GOLEM_WIDTH === 'undefined'? 64 : configuration.GOLEM_WIDTH;
    var GOLEM_HEIGHT = configuration.GOLEM_HEIGHT = typeof configuration.GOLEM_HEIGHT === 'undefined'? 21 : configuration.GOLEM_HEIGHT;
    var TRAVEL_SPEED_PER_SECOND = configuration.TRAVEL_SPEED_PER_SECOND = typeof configuration.TRAVEL_SPEED_PER_SECOND === 'undefined'? MELEE_RANGE * 2 : configuration.TRAVEL_SPEED_PER_SECOND;
    var ATTACKS_PER_SECOND = configuration.ATTACKS_PER_SECOND = typeof configuration.ATTACKS_PER_SECOND === 'undefined'? 1 : configuration.ATTACKS_PER_SECOND;
    var CLIENT_UPDATES_PER_SECOND = configuration.CLIENT_UPDATES_PER_SECOND = typeof configuration.CLIENT_UPDATES_PER_SECOND === 'undefined'? 8 : configuration.CLIENT_UPDATES_PER_SECOND;
    var SIMULATION_LOOPS_PER_SECOND = configuration.SIMULATION_LOOPS_PER_SECOND = typeof configuration.SIMULATION_LOOPS_PER_SECOND === 'undefined'? 60 : configuration.SIMULATION_LOOPS_PER_SECOND;
    var FULL_DAMAGE = configuration.FULL_DAMAGE = typeof configuration.FULL_DAMAGE === 'undefined'? 35 : configuration.FULL_DAMAGE;
    
    this.getConfiguration = function(){
        return configuration;
    };
    
    var summoning = new Summoning();
    
    var golemNumberSequence = 1;
    
    var summoners = playerList.map(playerToSummoner);
    
    function playerToSummoner(player){
        return {
            playerNumber : player.playerNumber,
            name : player.name,
            golemConfig : player.golemConfig,
            energy : player.energy,
            golems : []
        };
    }
    
    this.addPlayer = function(player){
        var summoner = playerToSummoner(player);
        summoners.push(summoner);
        conventionEventHandler({
            event : 'convention-summoner',
            summoner : summoner
        });
    };
    
    this.getSummoners = function(){
        return summoners;
    };
    
    this.convene = function() {
        conventionEventHandler({
            event : 'convention-start',
            configuration : configuration
        });
        summoners.forEach(function(summoner) {
            conventionEventHandler({
                event : 'convention-summoner',
                summoner : summoner
            });
        });
        setTimeout(simulationLoop, 0);
    };
    
    this.summonGolem = function(playerNumber, config) {
        var summoner = summonerByPlayerNumber(playerNumber);
        var golem = {
                health : 100,
                material : config.material,
                attack : config.attack,
                abilities : config.abilities,
                golemNumber : golemNumberSequence++,
                playerNumber : summoner.playerNumber,
                direction : 0,
                velocity : 0
            };
        summoner.golems.push(golem);
        copyProps(golem, getLocationAroundSummoningCircle());
        conventionEventHandler({
            event : 'convention-golem-summoned',
            golem : golem
        });
    };
    
    function getLocationAroundSummoningCircle(){
        var order = Math.random();
        var lengthAroundCircle = order * 2 * Math.PI;
        var x = (Math.sin(lengthAroundCircle) * WIDTH / 2 * 0.8) + (WIDTH / 2);
        var y = -1 * (Math.cos(lengthAroundCircle) * HEIGHT / 2 * 0.8) + (HEIGHT / 2);
        return {x: x, y: y, direction: Math.PI};
    }
    
    var lastSimLoopStartTime = undefined;
    var simLoopStartTime = undefined;
    var lastStateUpdateTime = undefined;
    var travelableDistanceThisStep = 0;
    function simulationLoop() {
        simLoopStartTime = new Date().getTime();
        if(typeof lastSimLoopStartTime === 'undefined'){
            lastSimLoopStartTime = simLoopStartTime;
        }
        if(typeof lastStateUpdateTime === 'undefined'){
            lastStateUpdateTime = simLoopStartTime;
        }
        travelableDistanceThisStep = TRAVEL_SPEED_PER_SECOND * (simLoopStartTime - lastSimLoopStartTime) / 1000;
        var survivingGolems = summoners.reduce(function(list, summoner){
            return list.concat(summoner.golems.filter(function(golem){
                if(typeof golem !== 'undefined' && golem.health > 0){
                    return true;
                }                
            }));
        },[]);
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
        if(simLoopStartTime - lastStateUpdateTime >= 1000 / CLIENT_UPDATES_PER_SECOND){
            lastStateUpdateTime = simLoopStartTime;
            survivingGolems.forEach(function(survivor) {
                conventionEventHandler({
                    event : 'convention-golem-state-update',
                    golem : survivor
                });
            });
        }
        lastSimLoopStartTime = simLoopStartTime;
        setTimeout(simulationLoop, 1000 / SIMULATION_LOOPS_PER_SECOND - (simLoopStartTime - new Date().getTime()));
    }
    
    function executeStepForGolem(golem, otherSurvivors) {
        golem.velocity = 0;
        examineTarget(golem, otherSurvivors);
        if(typeof golem.targetGolemNumber !== 'undefined') {
            var target = golemByGolemNumber(golem.targetGolemNumber);
            var distanceToTarget = getDistance(golem.x, golem.y, target.x, target.y);
            var dx = target.x - golem.x;
            var dy = target.y - golem.y;
            golem.direction = Math.atan2(dx,dy);
            if(distanceToTarget >= MELEE_RANGE){
                golem.x += Math.sin(golem.direction) * travelableDistanceThisStep;
                golem.y += Math.cos(golem.direction) * travelableDistanceThisStep;
                golem.velocity = TRAVEL_SPEED_PER_SECOND;
            } else if (typeof golem.lastSwingTime === 'undefined' || simLoopStartTime - golem.lastSwingTime >= 1000 / ATTACKS_PER_SECOND){
                if (isHitSuccess(golem)) {
                    var damage = generateHitDamage(golem);
                    target.health -= damage;
                    conventionEventHandler({
                        event : 'convention-golem-hit',
                        golem : golem,
                        target : target,
                        damage : damage
                    });
                } else {
                    conventionEventHandler({
                        event : 'convention-golem-missed',
                        golem : golem,
                        target : target
                    });
                }
                golem.lastSwingTime = simLoopStartTime;
            }
        }
    }
    
    function examineTarget(golem, otherSurvivors) {
        if (otherSurvivors.length > 0){
            if (typeof golem.targetGolemNumber === 'undefined' || golemByGolemNumber(golem.targetGolemNumber).health <= 0) {
                golem.targetGolemNumber = otherSurvivors[Math.floor(otherSurvivors.length * Math.random())].golemNumber;
                conventionEventHandler({
                    event : 'convention-golem-targeted',
                    golem : golem
                });
            }
            
            //attack anything you come within melee range of if you're still travelling
            var target = golemByGolemNumber(golem.targetGolemNumber);
            var distanceToCurrentTarget = getDistance(golem.x, golem.y, target.x, target.y);
            if(distanceToCurrentTarget >= MELEE_RANGE){
                otherSurvivors.forEach(function(otherGolem){
                    var thisDistance = getDistance(golem.x, golem.y, otherGolem.x, otherGolem.y);
                    if(thisDistance < MELEE_RANGE && thisDistance < distanceToCurrentTarget){
                        golem.targetGolemNumber = otherGolem.golemNumber;
                        distanceToCurrentTarget = thisDistance;
                    }
                });
            }
        } else {
            golem.targetGolemNumber = undefined;
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
        return summoners.reduce(function(list, summoner){
            return list.concat(summoner.golems);
        },[]).filter(function(golem){
            if(golem.golemNumber === golemNumber){
                return true;
            }
        })[0];
    }
    
    function summonerByPlayerNumber(aPlayerNumber){
        return summoners.filter(function(summoner){
            return summoner.playerNumber === aPlayerNumber;
        })[0];
    }
    
    function getDistance(x1,y1,x2,y2){
        return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
    }
    
    function copyProps(object, newObject){
        for(prop in newObject){
            object[prop] = newObject[prop];
        }
    }
    
};