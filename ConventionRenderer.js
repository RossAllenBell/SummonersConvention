var COLORS = {
    Straw:  "E0C61B",
    Wood:   "9C7200",
    Ice:    "D4FCFF",
    Clay:   "BA6236",
    Iron:   "5E5E5E",
    Base:   "BABABA",
    Copper: "CC5A21",
    Acid:   "97FF29",
    Fire:   "FF9D00",
};

function ConventionRenderer(canvas, summoners, golems){
    
    var configuration = {};
    this.setConfiguration = function(config){configuration = config;};
    
    var DESIRED_FPS = 60;
    
    var WIDTH = canvas.drawableWidth;
    var HEIGHT = canvas.drawableHeight;
    var BACKGROUND_COLOR = '#EEEEEE';
    var OUTLINE_COLOR = '#CCCCCC';
    var DEATH_TRANSPARENCY = 0.2;
    
    var GOLEM_SIZE = 64;
    
    var context = canvas.getContext('2d');
    
    var loopStartTime = undefined;
    var lastLoopStartTime = undefined;
    var millisThisLoop = 0;
    function renderLoop() {
        loopStartTime = new Date().getTime();
        if(typeof lastLoopStartTime === 'undefined'){
            lastLoopStartTime = loopStartTime;
        }
        millisThisLoop = loopStartTime - lastLoopStartTime;
        golems.forEach(function(golem){
            interpolatePosition(golem);
        }, this);

        context.clearRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, WIDTH, HEIGHT);
        
        golems.forEach(function(golem){
            if(golem.health <= 0)drawGolem(golem);
        });
        golems.forEach(function(golem){
            if(golem.health > 0)drawGolem(golem);
        });
        golems.forEach(function(golem){
            if(golem.health <= 0)drawGolemLabels(golem);
        });
        golems.forEach(function(golem){
            if(golem.health > 0)drawGolemLabels(golem);
        });
        
        lastLoopStartTime = loopStartTime;
        setTimeout(arguments.callee, (1000/DESIRED_FPS) - (new Date().getTime() - loopStartTime));
    };
    
    function interpolatePosition(golem){
        if(golem.health > 0 && golem.velocity > 0){
            var target = golemByGolemNumber(golem.targetGolemNumber);
            if(getDistance(golem.x, golem.y, target.x, target.y) >= configuration.MELEE_RANGE){
                var distancedTraveled = golem.velocity * millisThisLoop / 1000;
                golem.x += Math.sin(golem.direction) * distancedTraveled;
                golem.y += Math.cos(golem.direction) * distancedTraveled;
            }            
        }
    }
    
    function drawGolem(golem){        
        context.save();
        context.translate(golem.x, golem.y);
        context.rotate((2 * Math.PI) - golem.direction);
        if(golem.health <= 0){
            context.globalAlpha = DEATH_TRANSPARENCY;
        }
        
        //body
        context.fillStyle = '#' + COLORS[golem.material];
        context.fillRect(-GOLEM_SIZE/2, -GOLEM_SIZE/6, GOLEM_SIZE, GOLEM_SIZE/3);
        
        //attack type
        context.fillStyle = '#' + COLORS[golem.attack];
        context.fillRect(-GOLEM_SIZE/2, -GOLEM_SIZE/6, GOLEM_SIZE/5, GOLEM_SIZE/3);
        context.fillRect(GOLEM_SIZE/2, -GOLEM_SIZE/6, -GOLEM_SIZE/5, GOLEM_SIZE/3);
        
        //head
        context.fillStyle = '#000000';
        context.fillRect(-GOLEM_SIZE/10, 0, GOLEM_SIZE/5, GOLEM_SIZE/6);
        
        //outline
        context.strokeStyle = OUTLINE_COLOR;
        context.lineWidth = 1;
        context.strokeRect(-GOLEM_SIZE/2, -GOLEM_SIZE/6, GOLEM_SIZE, GOLEM_SIZE/3);
        
        context.restore();
    }
    
    function drawGolemLabels(golem){ 
        context.save();
        context.translate(golem.x, golem.y);
        if(golem.health <= 0){
            context.globalAlpha = DEATH_TRANSPARENCY;
        }
        
        //name
        var summoner = summonerByPlayerNumber(golem.playerNumber);
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(summoner.name, 0, GOLEM_SIZE/2 + 1);
        
        //health bar
        if(golem.health > 0){
            context.fillStyle = '#00FF00';
            context.fillRect(-GOLEM_SIZE/2, -GOLEM_SIZE/2 - 13, GOLEM_SIZE * golem.health / 100, 10);
            if(golem.health < 100){
                context.fillStyle = '#FF0000';
                context.fillRect((-GOLEM_SIZE/2) + (GOLEM_SIZE * golem.health / 100), -GOLEM_SIZE/2 - 13, GOLEM_SIZE - (GOLEM_SIZE * golem.health / 100), 10);
            }
            
            //outline
            context.strokeStyle = OUTLINE_COLOR;
            context.lineWidth = 1;
            context.strokeRect(-GOLEM_SIZE/2, -GOLEM_SIZE/2 - 13, GOLEM_SIZE, 10);
        }
        
        context.restore();
    }
    
    function summonerByPlayerNumber(aPlayerNumber){
        return summoners.filter(function(summoner){
            return summoner.playerNumber === aPlayerNumber;
        })[0];
    }
    
    function golemByGolemNumber(aGolemNumber){
        return golems.filter(function(golem){
            return golem.golemNumber === aGolemNumber;
        })[0];
    }
    
    function getDistance(x1,y1,x2,y2){
        return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
    }
    
    setTimeout(renderLoop, 0);
    
};