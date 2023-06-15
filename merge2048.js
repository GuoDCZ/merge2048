G.F.loadMain = function () {
    this.AI = G.F.mainAI;

    var w = window.innerWidth;
    if (!w) w = 1080;
    var h = window.innerHeight;
    if (!h) h = 720;

    var arr = [];
    var maxArr = Math.floor(w*h/20000);
    //maxArr = 1;
    for (let i = 0; i < maxArr; i++) arr.push(i);

    var colors = [
        "#E4E6E1", "#E8D3C0", "#C2CEDC", "#D6C38B", 
        "#D4BAAD", "#B0B1B6", "#849B91", "#D89C7A" 
    ]

    G.interval = 10;
    G.setState({ballId: arr})
    G.makeGob('viewport', G)
        .setVar({x: 0, y: 0, w: w, h: h })
        .setStyle({ backgroundColor: '#404040' })
        .turnOn();
    G.S.ballId.forEach(id => {
        var s = Math.ceil((1-id/maxArr)*8);
        var m = Math.pow(2,s);
        var r = Math.sqrt(m)*6;
        G.makeGob(id, G.O.viewport)
            .setVar({
                x: G.O.viewport.w/2, 
                y: G.O.viewport.h/2, 
                r: r, m: m,
                w: 2*r, h: 2*r, 
                tx: -r, ty: -r,
                vx: (Math.random()*4-2)*G.interval/5,
                vy: (Math.random()*4-2)*G.interval/5, 
                //vx: 0, vy: -2*i,
                setNextXY: function () {
                    var t = this;
                    t.setVar({
                        nx: t.x + t.vx, 
                        ny: t.y + t.vy
                    });
                },
                updateXY: function () {
                    var t = this;
                    t.setVar({
                        x: t.nx, 
                        y: t.ny
                    });
                },
            })
            .addClass('ball')
            .setStyle({ backgroundColor: colors[s-1]})
            .turnOn();
    });
    G.S.ballId.forEach(id => G.O[id].setNextXY());
    G.S.ballId.forEach(id => G.O[id].updateXY());
}; 

G.F.checkWallIntersection = function (t, wall) {
    switch (wall) {
        case "x-": return t.nx < t.r;
        case "x+": return t.nx > t.P.w - t.r;
        case "y-": return t.ny < t.r;
        case "y+": return t.ny > t.P.h - t.r;
        default: return false;
    }
};

G.F.checkWallApproaching = function (t, wall) {
    switch (wall) {
        case "x-": return t.vx < 0;
        case "x+": return t.vx > 0;
        case "y-": return t.vy < 0;
        case "y+": return t.vy > 0;
        default: return false;
    }
}

G.F.fixVelocityByWallCollision = function (t, wall) {
    switch (wall) {
        case "x-": case "x+": 
        t.setVar({vx: -t.vx}); break;
        case "y-": case "y+": 
        t.setVar({vy: -t.vy}); break;
    };
    return // 以下是碰撞位移经面系统，在高刷新率下并没有什么用
    switch (wall) {
        case "x-": t.setVar({x: 2*t.r - t.x}); break;
        case "x+": t.setVar({x: 2*(t.P.w - t.r) - t.x}); break;
        case "y-": t.setVar({y: 2*t.r - t.y}); break;
        case "y+": t.setVar({y: 2*(t.P.h - t.r) - t.y}); break;
    };
};

G.F.fixPositionByWallCollision = function (t, wall) {
    switch (wall) {
        case "x-": t.setVar({x: t.r}); break;
        case "x+": t.setVar({x: t.P.w - t.r}); break;
        case "y-": t.setVar({y: t.r}); break;
        case "y+": t.setVar({y: t.P.h - t.r}); break;
    }
};

G.F.frictionFilter = function (t) {
    // v <= k*v-b
    var k = 0.8, b = 0.8;
    t.setVar({vx: t.vx*k, vy: t.vy*k});
    v = (t.vx**2+t.vy**2)**2;
    if (v < b) {
        t.setVar({vx: 0, vy: 0});
    }
    else {
        t.setVar({vx: t.vx*(v-b)/v, vy: t.vy*(v-b)/v});
    }
}

G.F.smallfrictionFilter = function (t) {
    // v <= k*v-b
    var k = 0.999, b = 0.001;
    t.setVar({vx: t.vx*k, vy: t.vy*k});
    v = (t.vx**2+t.vy**2)**0.5;
    if (v < b) {
        t.setVar({vx: 0, vy: 0});
    }
    else {
        t.setVar({vx: t.vx*(v-b)/v, vy: t.vy*(v-b)/v});
    }
}

G.F.collisionfrictionFilter = function (t) {
    // v <= k*v-b
    var k = 0.9, b = 0;
    t.setVar({vx: t.vx*k, vy: t.vy*k});
    v = (t.vx**2+t.vy**2)**0.5;
    if (v < b) {
        t.setVar({vx: 0, vy: 0});
    }
    else if (v != 0) {
        t.setVar({vx: t.vx*(v-b)/v, vy: t.vy*(v-b)/v});
    }
}

G.F.testWallCollision = function (t, wall) {
    if (G.F.checkWallIntersection(t, wall)) {
        if (G.F.checkWallApproaching(t, wall)) {
            G.F.fixVelocityByWallCollision(t, wall);
            G.F.frictionFilter(t);
        }
        else {
            G.F.fixPositionByWallCollision(t, wall);
        }
        t.setNextXY();
        return true;
    }
    return false;
};

G.F.getBallRelativeDirection = function (a, b) {
    var x = b.x - a.x,
        y = b.y - a.y;
    var d = (x**2+y**2)**0.5;
    return d ? {sin: y/d, cos: x/d} : null;
};

G.F.checkBallIntersection = function (a, b) {
    var dnx = b.nx - a.nx,
        dny = b.ny - a.ny;
    return (a.r+b.r)**2 > dnx**2 + dny**2;
};

G.F.checkBallApproaching = function (a, b) {
    var dx = b.x - a.x,
        dy = b.y - a.y;
    var dvx = b.vx - a.vx,
        dvy = b.vy - a.vy;
    return dx * dvx + dy * dvy < 0;
};

G.F.getBallCollisionImpulse =  function (a, b) {
    var d = G.F.getBallRelativeDirection(a, b); // 相对方向
    if (!d) return {x: 0, y: 0};
    var m = a.m * b.m / (a.m + b.m);        // 约化质量
    var vx = b.vx - a.vx,                   // 相对速度
        vy = b.vy - a.vy;
    var v = vy * d.sin + vx * d.cos;        // 相对速度在相对方向上分量
    return {                                // 冲量
        x: 2 * m * v * d.cos,                
        y: 2 * m * v * d.sin
    };
};

G.F.fixVelocityByImpulse = function (t, I) {
    t.setVar({
        vx: t.vx + I.x / t.m, 
        vy: t.vy + I.y / t.m
    });
}

G.F.fixPositionByBallCollision = function (a, b) {
    var d = G.F.getBallRelativeDirection(a, b);
    if (!d) return;
    console.log("C!");
    var ms = a.m + b.m;
    a.setVar({x: a.x-d.cos*a.m/ms*10, y: a.y-d.sin*a.m/ms*10});
    b.setVar({x: b.x+d.cos*b.m/ms*10, y: b.y+d.sin*b.m/ms*10});
};

G.F.testBallCollision = function (a, b) {
    if (G.F.checkBallIntersection(a, b)) {
        if (G.F.checkBallApproaching(a, b)) {
            var I = G.F.getBallCollisionImpulse(a, b);
            G.F.fixVelocityByImpulse(a, I);
            G.F.fixVelocityByImpulse(b, {x:-I.x,y:-I.y});
            //G.F.collisionfrictionFilter(a);
            //G.F.collisionfrictionFilter(b);
        }
        else {
            G.F.fixPositionByBallCollision(a, b);
        }
        a.setNextXY();
        b.setNextXY();
        return true;
    }
    return false;
};

G.F.mainAI = function () {
    G.S.ballId.forEach(id => {
        var t = G.O[id];
        t.setVar({vy: t.vy + 0.3});
        //G.F.smallfrictionFilter(t);
    });
    if (!G.S.shouldCareAboutIntersection) {
        G.S.ballId.forEach(id => G.O[id].setNextXY());
    }
    G.F.testCollision();
    G.S.ballId.forEach(id => G.O[id].updateXY());
    G.S.ballId.forEach(id => G.O[id].draw());
};

G.F.testCollision = function () {
    var p = true, n = 0;
    while (p && n < 20) {
        p = false;
        n++;
        G.S.ballId.forEach(id => {
            var a = G.O[id];
            ["x-","x+","y-","y+"].forEach(wall => {
                if (G.F.testWallCollision(a, wall)) p = true; 
            });
            var pass = true;
            G.S.ballId.forEach(id_another => {
                if (pass) {
                    if (id_another == id) pass = false;
                    return;
                }
                var b = G.O[id_another];
                if (G.F.testBallCollision(a, b)) p = true;
            })
        });
    }
    console.log(n);
}


G.makeBlock("main", G.F.loadMain).loadBlock("main");

