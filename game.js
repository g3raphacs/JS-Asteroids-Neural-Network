/** @type {HTMLCanvasElement} */

//convert degrees to radians
function toRad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

const FPS = 30 //frames per seconds
const SHIP_SIZE = 30 // ship height in pixels
const TURN_SPEED = 360 // turn speed in degrees per seconds

let canv = document.getElementById("gameCanvas")
let context = canv.getContext("2d")

let ship ={
    x: canv.width /2,
    y: canv.height /2,
    r: SHIP_SIZE /2,
    a: toRad(90),
    rot:0
}

// setup event handlers
document.addEventListener("keydown", keyDown)
document.addEventListener("keyup", keyUp)



//setup the game loop
setInterval(update, 1000 / FPS)

function keyDown (/** @type {keyboardEvent} */ ev){
    switch(ev.keyCode){
        case 37: // left arrow (rotate ship left)
            ship.rot = toRad(TURN_SPEED)/FPS
        break;

        case 38: // up arrow (thrust)

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

        break;

        case 39: // right arrow (stop rotate ship right)
        ship.rot = 0
        break;
    }

}

function update(){
    //draw space
    context.fillStyle='black';
    
    context.fillRect(0,0,canv.width,canv.height)



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

    //center dot
    context.fillStyle='red';
    context.fillRect(ship.x -1, ship.y -1, 2, 2)
    
    
    

    //rotate ship
    ship.a += ship.rot

    //move ship
}