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
    
    var renderedEvents = [];
    this.addEvent = function(event){event.startRenderTime = loopStartTime; renderedEvents.push(event);};
    
    var DESIRED_FPS = 60;
    
    var WIDTH = canvas.drawableWidth;
    var HEIGHT = canvas.drawableHeight;
    var BACKGROUND_COLOR = '#EEEEEE';
    var OUTLINE_COLOR = '#CCCCCC';
    var DEATH_TRANSPARENCY = 0.2;
    
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
        
        renderedEvents = renderedEvents.filter(function(event){
        	return event.startRenderTime >= loopStartTime - eventDuration(event);
        });
        renderedEvents.forEach(function(event){
            renderEvent(event);
        });
        
        lastLoopStartTime = loopStartTime;
        setTimeout(arguments.callee, (1000/DESIRED_FPS) - (new Date().getTime() - loopStartTime));
    };
    
    function eventDuration(event){
    	return 1000;
    }
    
    function renderEvent(event) {
        if(event.event === 'convention-golem-hit'){
            context.save();
            
            context.globalAlpha = (eventDuration(event) - (loopStartTime - event.startRenderTime)) / eventDuration(event);
            context.font = 'normal 30px sans-serif';
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.fillStyle = '#FF0000';
            context.fillText(event.damage, event.target.x, event.target.y);
            
            context.restore();
        } else if (event.event === 'convention-golem-missed'){
            context.save();
            
            context.globalAlpha = (eventDuration(event) - (loopStartTime - event.startRenderTime)) / eventDuration(event);
            context.font = 'normal 15px sans-serif';
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.fillStyle = '#777777';
            context.fillText('miss', event.target.x, event.target.y);
            
            context.restore();
        } else if (event.event === 'countdown-begin'){
        	context.save();
            
            context.globalAlpha = (eventDuration(event) - (loopStartTime - event.startRenderTime)) / eventDuration(event);
            context.font = 'normal 50px sans-serif';
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.fillStyle = '#000000';
            context.fillText('Beginning...', WIDTH/2, HEIGHT/2);
            
            context.restore();
        } else if (event.event === 'countdown'){
        	context.save();
            
            context.globalAlpha = (eventDuration(event) - (loopStartTime - event.startRenderTime)) / eventDuration(event);
            context.font = 'normal 50px sans-serif';
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.fillStyle = '#000000';
            context.fillText(event.second, WIDTH/2, HEIGHT/2);
            
            context.restore();
        }
    }
    
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
        context.fillRect(-configuration.GOLEM_WIDTH/2, -configuration.GOLEM_HEIGHT/2, configuration.GOLEM_WIDTH, configuration.GOLEM_HEIGHT);
        
        //attack type
        context.fillStyle = '#' + COLORS[golem.attack];
        context.fillRect(-configuration.GOLEM_WIDTH/2, -configuration.GOLEM_HEIGHT/2, configuration.GOLEM_WIDTH/5, configuration.GOLEM_HEIGHT);
        context.fillRect(configuration.GOLEM_WIDTH/2, -configuration.GOLEM_HEIGHT/2, -configuration.GOLEM_WIDTH/5, configuration.GOLEM_HEIGHT);
        
        //head
        context.fillStyle = '#000000';
        context.fillRect(-configuration.GOLEM_WIDTH/10, 0, configuration.GOLEM_WIDTH/5, configuration.GOLEM_HEIGHT/2);
        
        //outline
        context.strokeStyle = OUTLINE_COLOR;
        context.lineWidth = 1;
        context.strokeRect(-configuration.GOLEM_WIDTH/2, -configuration.GOLEM_HEIGHT/2, configuration.GOLEM_WIDTH, configuration.GOLEM_HEIGHT);
        
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
        context.fillText(summoner.name, 0, configuration.GOLEM_WIDTH/2 + 1);
        
        //health bar
        if(golem.health > 0){
            context.save();
            context.globalAlpha = 0.5;
            context.fillStyle = '#00FF00';
            context.fillRect(-configuration.GOLEM_WIDTH/2, -configuration.GOLEM_WIDTH/2 - 13, configuration.GOLEM_WIDTH * golem.health / 100, 10);
            if(golem.health < 100){
                context.fillStyle = '#FF0000';
                context.fillRect((-configuration.GOLEM_WIDTH/2) + (configuration.GOLEM_WIDTH * golem.health / 100), -configuration.GOLEM_WIDTH/2 - 13, configuration.GOLEM_WIDTH - (configuration.GOLEM_WIDTH * golem.health / 100), 10);
            }
            
            //outline
            context.strokeStyle = OUTLINE_COLOR;
            context.lineWidth = 1;
            context.strokeRect(-configuration.GOLEM_WIDTH/2, -configuration.GOLEM_WIDTH/2 - 13, configuration.GOLEM_WIDTH, 10);
            context.restore();
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