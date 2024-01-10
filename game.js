
var config = {
    "ballNumber": 50,
    "ballColors": [
        "#E4E6E1", "#E8D3C0", "#C2CEDC", "#D6C38B", 
        "#D4BAAD", "#B0B1B6", "#849B91", "#D89C7A" 
    ],
    "ballSizes": [
        10, 20, 30, 40, 
        50, 60, 70, 80 
    ],
    "ballMasses": [
        10, 20, 30, 40, 
        50, 60, 70, 80 
    ]
}

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Events = Matter.Events,
    Body = Matter.Body,
    Bodies = Matter.Bodies;

var engine;
var world;
var balls = [];

var mouseXSaved;
var mouseYSaved;

var staticFlag = false;

function setup() {
    config["width"] = window.innerWidth;
    if (!config.width) config.width = 800;
    config["height"] = window.innerHeight;
    if (!config.height) config.height = 600;
    createCanvas(config.width, config.height);
    engine = Engine.create();
    engine.world.gravity.y = 0;
    world = engine.world;
    Engine.run(engine);
    for (let i = 0; i < config.ballNumber; i++) {
        let ballClass = i % 3;
        let ball = Bodies.circle(
            config.width / 2, 
            config.height / 2, 
            config.ballSizes[ballClass], 
            {
                restitution: 1,
                mass: config.ballMasses[ballClass],
            }
        );
        ball["class"] = ballClass;
        balls.push(ball);
        World.add(world, ball);
    }

    [
        [config.width/2, config.height, config.width, 10],
        [config.width/2, 0, config.width, 10],
        [0, config.height/2, 10, config.height],
        [config.width, config.height/2, 10, config.height],
    ].forEach((wallParameters) => 
        World.add(world, 
            Bodies.rectangle(...wallParameters, {isStatic: true})
        )
    );

    setTimeout(() => staticFlag = true, 1000);

    Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;
        if (!staticFlag) return;
        for (let pair of pairs) {
            if (pair.bodyA.class === pair.bodyB.class) {
                mergeBalls(pair.bodyA, pair.bodyB);
            }
        }
    });
}

function mousePressed() {
    mouseXSaved = mouseX;
    mouseYSaved = mouseY;
}

function mouseReleased() {
    let dx = mouseX - mouseXSaved;
    let dy = mouseY - mouseYSaved;
    let d2 = dx*dx + dy*dy;
    if (d2 == 0) return;
    let dxNormalized = dx / Math.sqrt(dx*dx + dy*dy);
    let dyNormalized = dy / Math.sqrt(dx*dx + dy*dy);
    engine.world.gravity.y = dyNormalized * 0.5;
    engine.world.gravity.x = dxNormalized * 0.5;
}

function mergeBalls(a, b) {
    if (balls.indexOf(a) === -1 || balls.indexOf(b) === -1) return;
    let ballClass = a.class + 1;
    let ball = Bodies.circle(
        (a.position.x + b.position.x) / 2, 
        (a.position.y + b.position.y) / 2, 
        config.ballSizes[ballClass], 
        {
            restitution: 1,
            mass: config.ballMasses[ballClass],
        }
    );
    ball["class"] = ballClass;
    Body.setVelocity(ball,
        {
            x: (a.velocity.x + b.velocity.x) / 2, 
            y: (a.velocity.y + b.velocity.y) / 2
        }
    );
    balls.splice(balls.indexOf(a), 1);
    World.remove(world, a);
    balls.splice(balls.indexOf(b), 1);
    World.remove(world, b);
    balls.push(ball);
    World.add(world, ball);
}



function draw() {
    background(51);

    for (let ball of balls) {
        push()
        let ballColor = color(config.ballColors[ball.class]);
        fill(ballColor)
        translate(ball.position.x, ball.position.y)
        circle(0, 0, ball.mass*2);
        fill(lerpColor(ballColor, color(0), 0.5));
        rotate(ball.angle)
        textFont('Helvetica')
        textAlign(CENTER, CENTER)
        textSize(ball.mass)
        text(2**ball.class, 0, 0)
        pop()
    }

}
