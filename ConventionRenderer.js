function ConventionRenderer(canvas, summoners, golems){
    
    var WIDTH = canvas.drawableWidth;
    var HEIGHT = canvas.drawableHeight;
    var BACKGROUND_COLOR = '#DDDDDD';
    
    var GOLEM_SIZE = 0.08 * WIDTH;
    
    var context = canvas.getContext('2d');
    
    function renderLoop() {
        var loopStartTime = new Date().getTime();

        context.clearRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, WIDTH, HEIGHT);
        
        golems.forEach(function(golem){
            drawGolem(golem);
        });
        
        setTimeout(arguments.callee, 60 - (new Date().getTime() - loopStartTime));
    }
    
    function drawGolem(golem){
        context.strokeStyle = '#000000';
        context.beginPath();
        context.arc(golem.x, golem.y, GOLEM_SIZE/2, 0, 2 * Math.PI, false);
        context.stroke();
        
        context.strokeStyle = '#0000FF';
        context.beginPath();
        context.moveTo(golem.x, golem.y);
        context.lineTo(golem.x + Math.sin(golem.direction) * GOLEM_SIZE/2, golem.y + Math.cos(golem.direction) * GOLEM_SIZE/2);
        context.closePath();
        context.stroke();
        
        var summoner = summonerByPlayerNumber(golem.playerNumber);
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(summoner.name + '(' + summoner.energy + ')', golem.x, golem.y + (GOLEM_SIZE/2) + 1);
        
        if(golem.health > 0){
            context.fillStyle = '#00FF00';
            context.fillRect(golem.x - GOLEM_SIZE/2, golem.y - GOLEM_SIZE/2 - 13, GOLEM_SIZE * golem.health / 100, 10);
            context.fillStyle = '#FF0000';
            context.fillRect((golem.x - GOLEM_SIZE/2) + (GOLEM_SIZE * golem.health / 100), golem.y - GOLEM_SIZE/2 - 13, GOLEM_SIZE - (GOLEM_SIZE * golem.health / 100), 10);
        }
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
    
    setTimeout(renderLoop, 60);
    
};