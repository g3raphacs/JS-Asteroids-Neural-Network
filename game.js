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

const FPS = 30 //frames per seconds
const FRICTION = 0.7 // friction coefficient of space ( 0= no friction , 1= lot of friction)
const SHIP_SIZE = 30 // ship height in pixels
const SHIP_THRUST = 5 // acceleration of the ship in pixels per seconds
const TURN_SPEED = 360 // turn speed in degrees per seconds
const ROIDS_NUM = 300 // starting number of asteroids
const ROIDS_SIZE = 100 // starting size of asteroids in pixels
const ROIDS_SPD = 50 // max starting speed of asteroids in px per seconds
const ROIDS_VERT = 10 // avergage number of verticies in asteroids

let canv = document.getElementById("gameCanvas");
let context = canv.getContext("2d");

let ship ={
    x: canv.width /2,
    y: canv.height /2,
    r: SHIP_SIZE /2,
    a: toRad(90),
    rot:0,
    thrusting: false,
    thrust: {
        x:0,
        y:0
    }
}

//setup asteroids
let roids = [];
createAsteroidBelt();

// setup event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);



//setup the game loop
setInterval(update, 1000 / FPS);

function keyDown (/** @type {keyboardEvent} */ ev){
    switch(ev.keyCode){
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
    switch(ev.keyCode){
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
    let x , y;
    for (let i = 0; i < ROIDS_NUM; i++) {
        do {
            x= Math.floor(Math.random() * canv.width);
            y= Math.floor(Math.random() * canv.height);
        } while (distBetweenPoints(ship.x , ship.y , x , y) < ROIDS_SIZE * 2 + ship.r);
        roids.push(newAsteroid(x , y))
    }
}
function newAsteroid(x , y){
    let roid = {
        x: x,
        y: y,
        xv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
        xy: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: ROIDS_SIZE / 2,
        a: Math.random() * Math.PI * 2, // in radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2)
    }
    return roid;
}
//UPDATE___________________________________________________________
function update(){
    //draw space
    context.fillStyle='rgb(0,40,60)';
    
    context.fillRect(0,0,canv.width,canv.height);

    // thrust ship
    if(ship.thrusting){
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a)/FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a)/FPS;

    }else{
        ship.thrust.x -= FRICTION * ship.thrust.x /FPS
        ship.thrust.y -= FRICTION * ship.thrust.y /FPS
    }
    
    //move ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
    
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


    //-----------------------------DRAW FRAME
    //draw triangular ship
    context.strokeStyle='white';
    context.lineWidth= SHIP_SIZE / 20
    context.beginPath()
    context.moveTo( //nose of the ship
        ship.x + 4/3 * ship.r * Math.cos(ship.a),
        ship.y - 4/3 * ship.r * Math.sin(ship.a)
    )
    context.lineTo( // rear left
        ship.x - ship.r * (3/4 * Math.cos(ship.a) + Math.sin(ship.a)),
        ship.y + ship.r * (3/4 * Math.sin(ship.a) - Math.cos(ship.a))
    )
    context.lineTo( // rear right
        ship.x - ship.r * (3/4 * Math.cos(ship.a) - Math.sin(ship.a)),
        ship.y + ship.r * (3/4 * Math.sin(ship.a) + Math.cos(ship.a))
    )
    context.closePath();
    context.stroke()

    //draw the thruster
    if(ship.thrusting){
        context.fillStyle = 'red';
        context.strokeStyle='yellow';
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
    // context.fillStyle='red';
    // context.fillRect(ship.x -1, ship.y -1, 2, 2)

    //draw asteroids
    context.strokeStyle = "slategrey";
    context.lineWidth = SHIP_SIZE / 20;
    let x,y,r,a,vert;
    for (let i = 0; i < roids.length; i++){ 
        // get the asteroids properties
        x= roids[i].x;
        y= roids[i].y;
        r= roids[i].r;
        a= roids[i].a;
        vert= roids[i].vert;

        //move the asteroid

        //handle edges of screen

        //draw a path
        context.beginPath();
        context.moveTo(
            x + r * Math.cos(a),
            y + r * Math.sin(a)
        );  
        //draw the polygon
        for (let j = 0; j < vert; j++) {
            context.lineTo(
                x + r * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * Math.sin(a + j * Math.PI * 2 / vert),
            )
        }
        context.closePath();
        context.stroke();
    }

}