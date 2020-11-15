/** @type {HTMLCanvasElement} */

//convert degrees to radians
function toRad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function distBetweenPoints(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x2 - x1 , 2) + Math.pow(y2 - y1 , 2));
}

const FPS = 60 //frames per seconds
const FRICTION = 0.7 // friction coefficient of space ( 0= no friction , 1= lot of friction)
const LASER_MAX = 10 // maximum number on screen at once
const LASER_SPD = 500 // speed of lasers in px per second
const LASER_DIST = 0.6 // max distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = 0.1 // Duration of the lasers explosion
const SHIP_SIZE = 30 // ship height in pixels
const SHIP_THRUST = 5 // acceleration of the ship in pixels per seconds
const SHIP_EXPLODE_DUR = 0.3 // Duration of the ship's explosion
const SHIP_BLINK_DUR = 0.1; // duration in seconds of a single blink during ship's invisibility
const SHIP_INV_DUR = 3; // duration of the ship's invisibility in seconds
const TURN_SPEED = 360 // turn speed in degrees per seconds
const ROIDS_NUM = 1 // starting number of asteroids
const ROIDS_SIZE = 100 // starting size of asteroids in pixels
const ROIDS_SPD = 50 // max starting speed of asteroids in px per seconds
const ROIDS_VERT = 16 // avergage number of verticies in asteroids
const ROIDS_JAG = 0.2 // jaggedness of asteroids ( 0= none , 1= lot)
const ROIDS_PTS_LGE = 20
const ROIDS_PTS_MED = 50
const ROIDS_PTS_SML = 100
const TEXT_FADE_TIME = 2.5; //Text fade time in seconds
const TEXT_SIZE = 40; // text font size in pixels
const GAME_LIVES = 3;
const SAVE_KEY_SCORE = "highscore"; // save key for local storage of highscore

// Developper Flags
const AUTOMATION_ON = true;
const SHOW_CENTER_DOT = false;
const SHOW_BOUNDING = false;
const SOUND_ON = false;
const MUSIC_ON = false;

let canv = document.getElementById("gameCanvas");
let context = canv.getContext("2d");

// setup the game sound effects
let fxLaser = new Sound("sounds/laser.m4a", 5, 0.1);
let fxExplode = new Sound("sounds/explode.m4a",1,0.3);
let fxHit = new Sound("sounds/hit.m4a", 5, 0.3);
let fxThrust = new Sound("sounds/thrust.m4a", 1, 0.3);

//setup th music
var music = new Music("sounds/music-low.m4a" , "sounds/music-high.m4a")
let roidsLeft, roidsTotal;

//setup the game parameters
let level, lives, roids, ship, text, textAlpha, score, scoreHigh;
newGame();

//setup the neural network
if(AUTOMATION_ON){
    // TODO neural network

    let m0 = new Matrix (2,3, [
        [2, 1, -1],
        [4, 3, 0]
    ])
    let m1 = new Matrix (2,3, [
        [0, 1, -1],
        [2, -3, 0]
    ])
    let m2 = new Matrix (2,2, [
        [1, -1],
        [3, 0]
    ])
    //m0.randomWeights();
    console.table(Matrix.subtract(m0,m1).data);
}



// setup event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);



//setup the game loop
setInterval(update, 1000 / FPS);

function keyDown (/** @type {keyboardEvent} */ ev){
    if(ship.dead || AUTOMATION_ON){
        return;
    }
    switch(ev.keyCode){
        case 32: // Space Bar (shoot laser)
            shootLaser();
        break;

        case 37: // left arrow (rotate ship left)
            ship.rot = toRad(TURN_SPEED)/FPS
        break;

        case 38: // up arrow (thrust)
            ship.thrusting = true
        break;

        case 39: // right arrow (rotate ship right)
        ship.rot = -toRad(TURN_SPEED)/FPS
        break;
    }
}

function keyUp(/** @type {keyboardEvent} */ ev){
    if(ship.dead || AUTOMATION_ON){
        return;
    }
    switch(ev.keyCode){
        case 32: // Space Bar (allow shooting again)
            ship.canShoot = true;
        break;

        case 37: // left arrow ( stop rotate ship left)
            ship.rot = 0
        break;

        case 38: // up arrow (stop thrust)
        ship.thrusting = false
        break;

        case 39: // right arrow (stop rotate ship right)
        ship.rot = 0
        break;
    }

}

function createAsteroidBelt(){
    roids = [];
    roidsTotal = (ROIDS_NUM + level) * 7;
    roidsLeft = roidsTotal;
    let x , y;
    for (let i = 0; i < ROIDS_NUM + level; i++) {
        do {
            x= Math.floor(Math.random() * canv.width);
            y= Math.floor(Math.random() * canv.height);
        } while (distBetweenPoints(ship.x , ship.y , x , y) < ROIDS_SIZE * 2 + ship.r);
        roids.push(newAsteroid(x , y, Math.ceil(ROIDS_SIZE / 2)))
    }
}
function destroyAsteroid(i){
    let x = roids[i].x
    let y = roids[i].y
    let r = roids[i].r

    // split the asteroid in two if necessary
    if(r == Math.ceil(ROIDS_SIZE / 2)){
        roids.push(newAsteroid(x,y,Math.ceil(ROIDS_SIZE / 4)))
        roids.push(newAsteroid(x,y,Math.ceil(ROIDS_SIZE / 4)))
        score += ROIDS_PTS_LGE;
    }else if(r == Math.ceil(ROIDS_SIZE / 4)){
        roids.push(newAsteroid(x,y,Math.ceil(ROIDS_SIZE / 8)))
        roids.push(newAsteroid(x,y,Math.ceil(ROIDS_SIZE / 8)))
        score += ROIDS_PTS_MED;
    }else{
        score += ROIDS_PTS_SML;
    }

    
    //check highscore
    if(score > scoreHigh){
        scoreHigh = score;
        localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
    }
    
    // destroy the asteroid
    roids.splice(i,1)
    fxHit.play();

    //calculate the ratio of remaining asteroids to determine music tempo
    roidsLeft--;
    music.setAsteroidRatio(roidsLeft == 0 ? 1 : roidsLeft / roidsTotal)

    // new level when no more asteroids
    if(roids.length == 0 ){
        level++;
        console.log(level)
        newLevel();
    }

}
function newAsteroid(x , y , r){
    let lvlMult = 1 + 0.1 * level;
    let roid = {
        x: x,
        y: y,
        xv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r,
        a: Math.random() * Math.PI * 2, // in radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
        offs: []
    }
    // create the vertex offsets array
    for (let i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random()* ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
}

function newGame(){
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    ship = newShip();

    // get the highscore from local storage
    let scoreString = localStorage.getItem(SAVE_KEY_SCORE);

    if (scoreString == null){
        scoreHigh = 0;
    }else{
        scoreHigh = parseInt(scoreString)
    }

    newLevel();
}

function newLevel(){
    text = "Level " + (level+1);
    textAlpha = 1.0;
    createAsteroidBelt();
}

function gameOver(){
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
}

function newShip(){
    return {
        x: canv.width /2,
        y: canv.height /2,
        r: SHIP_SIZE /2,
        a: toRad(90),
        rot:0,
        thrusting: false,
        thrust: {
            x:0,
            y:0
        },
        explodeTime:0,
        dead: false,
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        canShoot: true,
        lasers: []
    }
}

function shootLaser(){
    //create the laser
    if(ship.canShoot && ship.lasers.length < LASER_MAX){
        ship.lasers.push({ //from the nose of the ship
            x: ship.x + 4/3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4/3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS + ship.thrust.x,
            yv: -LASER_SPD * Math.sin(ship.a) / FPS + ship.thrust.y,
            dist: 0,
            explodeTime: 0
        })
        fxLaser.play();
    }

    //prevent shooting
    ship.canShoot = false;
}

function explodeShip(){
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
        context.fillStyle = "lime";
        context.strokeStyle = "lime";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        context.fill();
        context.stroke();
    fxExplode.play();
}

function drawShip(x,y,a,colour = "white"){
            context.strokeStyle=colour;
            context.lineWidth= SHIP_SIZE / 20
            context.beginPath()
            context.moveTo( //nose of the ship
                x + 4/3 * ship.r * Math.cos(a),
                y - 4/3 * ship.r * Math.sin(a)
            )
            context.lineTo( // rear left
                x - ship.r * (3/4 * Math.cos(a) + Math.sin(a)),
                y + ship.r * (3/4 * Math.sin(a) - Math.cos(a))
            )
            context.lineTo( // rear right
                x - ship.r * (3/4 * Math.cos(a) - Math.sin(a)),
                y + ship.r * (3/4 * Math.sin(a) + Math.cos(a))
            )
            context.closePath();
            context.stroke()
}

function Sound(src, maxStreams = 1, vol = 1.0){
    this.streamNum = 0;
    this.streams = [];
    for(let i = 0 ; i < maxStreams ; i++){
        this.streams.push(new Audio(src));
        this.streams[i].volume = vol;
    }

    this.play = ()=>{
        if (SOUND_ON){
            this.streamNum = (this.streamNum + 1) % maxStreams;
            this.streams[this.streamNum].play();
        }
    }
    this.stop = ()=>{
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0;
    }
}

function Music(srcLow,srcHigh){
    this.soundLow = new Audio(srcLow);
    this.soundHigh = new Audio(srcHigh);
    this.low = true;
    this.tempo = 1.0; // seconds per beat
    this.beatTime = 0; // frames left until next beat

    this.play = ()=>{
        if(MUSIC_ON){
            if(this.low){
                this.soundLow.play();
            }else{
                this.soundHigh.play();
            }
            this.low = !this.low;
        }
    }

    this.tick = ()=>{
        if(this.beatTime == 0){
            this.play();
            this.beatTime = Math.ceil(this.tempo*FPS)
        }else{
            this.beatTime--;
        }
    }

    this.setAsteroidRatio = (ratio)=>{
        this.tempo = 1.0 - 0.75 * (1.0 - ratio);
    }
    
}


//UPDATE___________________________________________________________
function update(){
    let blinkOn = ship.blinkNum % 2 == 0;
    let exploding = ship.explodeTime > 0;

    //Use the neural network to rotate the ship and shoot
    if(AUTOMATION_ON){
        // TODO control ship
    }
    
    //tick the music
    music.tick()
    //draw space
    context.fillStyle='rgb(0,40,60)';
    
    context.fillRect(0,0,canv.width,canv.height);

    // thrust ship
    if(ship.thrusting && !ship.dead){
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a)/FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a)/FPS;
        fxThrust.play();

    }else{
        ship.thrust.x -= FRICTION * ship.thrust.x /FPS
        ship.thrust.y -= FRICTION * ship.thrust.y /FPS
        fxThrust.stop();
    }
    
    if(!exploding){
        //move ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
        //check for asteroid collision
        if(ship.blinkNum ==0 && !ship.dead){
            for (let i = 0; i < roids.length; i++) {
                if(distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r){
                    explodeShip();
                    destroyAsteroid(i)
                    break;
                }
            }
        }
    }else{
        ship.explodeTime--;
        //reset the ship after explosion has finished
        if(ship.explodeTime == 0){
            lives--;
            if(lives == 0){
                gameOver();
            }else{
                ship = newShip();
            }
        }
    }
    
    //handle edges of screen
    if(ship.x < 0 - ship.r){
        ship.x = canv.width + ship.r
    }else if(ship.x > canv.width + ship.r){
        ship.x = 0 - ship.r
    }
    if(ship.y < 0 - ship.r){
        ship.y = canv.height + ship.r
    }else if(ship.y > canv.height + ship.r){
        ship.y = 0 - ship.r
    }
    
    //rotate ship
    ship.a += ship.rot

    //move the asteroid
    for (let i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;
        
        //handle edges of screen
        if(roids[i].x < 0 - roids[i].r){
            roids[i].x = canv.width + roids[i].r
        }
        else if(roids[i].x > canv.width + roids[i].r){
            roids[i].x = 0 - roids[i].r
        }
        if(roids[i].y < 0 - roids[i].r){
            roids[i].y = canv.height + roids[i].r
        }
        else if(roids[i].y > canv.height + roids[i].r){
            roids[i].y = 0 - roids[i].r
        }
    }

    // move lasers
    if(ship.lasers.length > 0){
        
        for(let i = ship.lasers.length - 1; i >= 0; i--){
            //check distance traveled
            if(ship.lasers[i].dist > LASER_DIST * canv.width){
                ship.lasers.splice(i,1);
                continue;
            }
            //handle explosion
            if(ship.lasers[i].explodeTime > 0){
                ship.lasers[i].explodeTime--;
                if(ship.lasers[i].explodeTime == 0){
                    ship.lasers.splice(i,1);
                    continue;
                }
            }else{
                //move
                ship.lasers[i].x += ship.lasers[i].xv
                ship.lasers[i].y += ship.lasers[i].yv

                // calculate the distance traveled
                ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));

                //handle edge of screen
                if (ship.lasers[i].x < 0){
                    ship.lasers[i].x = canv.width
                }
                else if (ship.lasers[i].x > canv.width){
                    ship.lasers[i].x = 0;
                }
                if (ship.lasers[i].y < 0){
                    ship.lasers[i].y = canv.height
                }
                else if (ship.lasers[i].y > canv.height){
                    ship.lasers[i].y = 0;
                }
            }
        }
    }

    //detect laser hits on asteroids
    if(ship.lasers.length > 0){
        let ax, ay, ar, lx, ly;
        for (let i = roids.length-1 ; i>=0; i--){
            //grap the asteroid properties
            ax = roids[i].x;
            ay = roids[i].y;
            ar = roids[i].r;

            // loop over the lasers
        
            for(let j = ship.lasers.length-1 ; j>=0; j--){
            //grap the laser properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

                //detect hits
                if(ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax,ay,lx,ly)< ar){
                    
                    // destroy asteroid and activate laser explosion
                    destroyAsteroid(i);
                    ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS)
                    break;
                }
            }
        }
    }
    
    


    //-----------------------------DRAW FRAME
    
    if(!exploding){
        if(blinkOn && !ship.dead){
            //draw triangular ship
            drawShip(ship.x,ship.y,ship.a);

            //draw the thruster
            if(ship.thrusting){
                context.fillStyle = 'rgb(0,100,200)';
                context.strokeStyle = 'rgb(0,200,255)';
                context.lineWidth= SHIP_SIZE / 20
                context.beginPath()
                context.moveTo( //rear left
                    ship.x - ship.r * (3/4 * Math.cos(ship.a) + 0.4 * Math.sin(ship.a)),
                    ship.y + ship.r * (3/4 * Math.sin(ship.a) - 0.4 * Math.cos(ship.a))
                )
                context.lineTo( // rear center behind the ship
                    ship.x - ship.r * (6/3 * Math.cos(ship.a)),
                    ship.y + ship.r * (6/3 * Math.sin(ship.a))
                )
                context.lineTo( // rear right
                    ship.x - ship.r * (3/4 * Math.cos(ship.a) - 0.4 * Math.sin(ship.a)),
                    ship.y + ship.r * (3/4 * Math.sin(ship.a) + 0.4 * Math.cos(ship.a))
                )
                context.closePath();
                context.fill()
                context.stroke()
            }
            //center dot
            if(SHOW_CENTER_DOT){
                context.fillStyle='red';
                context.fillRect(ship.x -1, ship.y -1, 2, 2)
            }

        }
        // draw the lasers
        for (let i = 0; i < ship.lasers.length; i++) {
            if(ship.lasers[i].explodeTime == 0){
                context.fillStyle = "salmon"
                context.beginPath();
                context.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15 , 0, Math.PI * 2, false)
                context.fill();
            }else{
                //draw the explosion
                context.fillStyle = "orange"
                context.beginPath();
                context.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r *0.75 , 0, Math.PI * 2, false)
                context.fill();
                context.fillStyle = "salmon"
                context.beginPath();
                context.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r *0.5 , 0, Math.PI * 2, false)
                context.fill();
                context.fillStyle = "pink"
                context.beginPath();
                context.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r *0.25 , 0, Math.PI * 2, false)
                context.fill();
            }
            
        }
        // handle blinking
        if (ship.blinkNum > 0) {

            // reduce the blink time
            ship.blinkTime--;

            // reduce the blink num
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }
        //draw ship bounding
        if(SHOW_BOUNDING){
            context.strokeStyle = "lime";
            context.beginPath();
            context.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
            context.stroke();
        }

    }else {
        //draw the explosion
        context.fillStyle = "darkred";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "red";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "orange";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "yellow";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "white";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r *0.5, 0, Math.PI * 2, false);
        context.fill();
    }
    

    //draw asteroids
    context.lineWidth = SHIP_SIZE / 20;
    let x,y,r,a,vert,offs;
    for (let i = 0; i < roids.length; i++){ 
        context.strokeStyle = "slategrey";
        // get the asteroids properties
        x= roids[i].x;
        y= roids[i].y;
        r= roids[i].r;
        a= roids[i].a;
        vert= roids[i].vert;
        offs = roids[i].offs;

        //draw a path
        context.beginPath();
        context.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a) * offs
        );  
        //draw the polygon
        for (let j = 1; j < vert; j++) {
            context.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert),
            )
        }
        context.closePath();
        context.stroke();

        //draw ship bounding
        if(SHOW_BOUNDING){
            context.strokeStyle = "red";
            context.beginPath();
            context.arc(x, y, r, 0, Math.PI * 2, false);
            context.stroke();
        }
    }

    // draw the game text
    if(textAlpha >= 0 ){
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(255,255,255,"+textAlpha+")";
        context.font = "small-caps " + TEXT_SIZE + "px arial";
        context.fillText(text, canv.width / 2 , canv.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS)
    }else if (ship.dead){
        newGame();
    }

    // draw the lives
    let lifeColor;
    for(let i = 0; i< lives; i++){
        lifeColor = exploding && i == lives -1 ? "red" : "white";
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2 , SHIP_SIZE, 0.5*Math.PI, lifeColor);
    }

    //draw the score
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.font = TEXT_SIZE + "px arial";
    context.fillText(score, canv.width - SHIP_SIZE / 2 , SHIP_SIZE);
    //draw the highscore
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.font = TEXT_SIZE * 0.4 + "px arial";
    context.fillText("Highscore: "+scoreHigh, canv.width / 2 , SHIP_SIZE);
    


}