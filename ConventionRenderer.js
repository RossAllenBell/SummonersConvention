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
        
        golems.forEach(function(golem, index){
            var order = (index - 1) / golems.length;
            var lengthAroundCircle = order * 2 * Math.PI;
            var x = (Math.sin(lengthAroundCircle) * WIDTH / 2 * 0.8) + (WIDTH / 2);
            var y = -1 * (Math.cos(lengthAroundCircle) * HEIGHT / 2 * 0.8) + (HEIGHT / 2);
            
            drawGolem(golem, x, y);
        });
        
        setTimeout(arguments.callee, 60 - (new Date().getTime() - loopStartTime));
    }
    
    function drawGolem(golem, x, y){
        context.strokeStyle = '#000000';
        context.beginPath();
        context.arc(x, y, GOLEM_SIZE/2, 0, 2 * Math.PI, false);
        context.stroke();
        
        var summoner = summonerByPlayerNumber(golem.playerNumber);
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(summoner.name + '(' + summoner.energy + ')', x, y + (GOLEM_SIZE/2) + 1);
        
        context.fillStyle = '#00FF00';
        context.fillRect(x - GOLEM_SIZE/2, y - GOLEM_SIZE/2 - 13, GOLEM_SIZE * golem.health / 100, 10);
        context.fillStyle = '#FF0000';
        context.fillRect((x - GOLEM_SIZE/2) + (GOLEM_SIZE * golem.health / 100), y - GOLEM_SIZE/2 - 13, GOLEM_SIZE - (GOLEM_SIZE * golem.health / 100), 10);
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