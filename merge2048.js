G.F.loadMain = function () {
    this.AI = G.F.mainAI;
    var arr = [];
    for (let i = 0; i < 40; i++) arr.push(i);
    G.setState({ballId:arr})
    G.makeGob('viewport', G)
        .setVar({
            mma: function () {
                console.log("fuck");
            }, x: 0, y: 0, w: 500, h: 500 })
        .setStyle({ backgroundColor: '#000000' })
        .turnOn();
    G.S.ballId.forEach(id => {
        var s = Math.ceil(Math.random()*6);
        var m = Math.pow(2,s);
        var r = Math.sqrt(m)*6;
        G.makeGob(id, G.O.viewport)
            .setVar({
                x: G.O.viewport.w/2, 
                y: G.O.viewport.h/2, 
                r: r,
                m: m,
                w: 2*r, h: 2*r, 
                tx: -r, ty: -r,
                vx: Math.random()*6-3, vy: Math.random()*6-3, 
                //vx: 0, vy: -2*i,
                setNextXY: G.F.Ball_setNextXY,
                checkWallCollision: G.F.Ball_checkWallCollision,
                fixWallCollision: G.F.Ball_fixWallCollision,
                checkBallCollision: G.F.Ball_checkBallCollision,
                getCollisionImpulse: G.F.Ball_getCollisionImpulse,
                fixBallCollision: G.F.Ball_fixBallCollision
            })
            .addClass('ball')
            .setStyle({ backgroundColor: '#'+Math.floor(s/7*0xffffff).toString(16).padEnd(6,'0')})
            .turnOn();
    });
}; 

G.F.Ball_setNextXY = function () {
    var t = this;
    t.setVar({nx: t.x+t.vx, ny:t.y+t.vy});
};

G.F.Ball_checkWallCollision = function () {
    var t = this, p = this.P;
    if (p.w - t.nx < t.r && t.vx >= 0
           || t.nx < t.r && t.vx <= 0 ) return 'x';
    if (p.h - t.ny < t.r && t.vy >= 0
           || t.ny < t.r && t.vy <= 0 ) return 'y';
    return false;
};

G.F.Ball_fixWallCollision = function (force) {
    var t = this;
    if (force == 'x') t.setVar({vx:-t.vx});
    if (force == 'y') t.setVar({vy:-t.vy});
};

G.F.Ball_checkBallCollision = function (b) {
    var a = this;
    var nx = b.nx-a.nx,
        ny = b.ny-a.ny;
    var x = b.x-a.x,
        y = b.y-a.y;
    var vx = b.vx-a.vx,
        vy = b.vy-a.vy;
    var toIntersect = (a.r+b.r)**2 > nx**2 + ny**2;
    var intersectDepth = (a.r+b.r)**2 - x**2 + y**2;
    var isApproaching = (x*vx+y*vy < 0);
    return toIntersect && isApproaching;
};

G.F.Ball_getCollisionImpulse =  function (b) {
    var a = this;
    var x = b.x-a.x,
        y = b.y-a.y,
        d = (x**2+y**2)**0.5;
    var s = y/d,
        c = x/d;
    var m = a.m*b.m/(a.m+b.m);
    var vx = b.vx-a.vx,
        vy = b.vy-a.vy;
        v = vy*s+vx*c;
    return {
        x: 2*m*v*c,
        y: 2*m*v*s
    };
};

G.F.Ball_fixBallCollision = function (I) {
    var t = this;
    t.setVar({vx:t.vx+I.x/t.m, vy:t.vy+I.y/t.m});

}

G.F.mainAI = function () {
    G.S.ballId.forEach(id => G.O[id].setNextXY());
    var flush = 0;
    while (G.F.fixCollision() && flush < 100) {
        G.S.ballId.forEach(id => G.O[id].setNextXY());
        flush++;
    }
    if (flush == 100) console.log("F!");
    G.S.ballId.forEach(id => G.O[id].incrementXY());
    //G.S.ballId.forEach(id => G.O[id].setVar({vy:G.O[id].vy*0.9+1}));
    G.S.ballId.forEach(id => G.O[id].draw());
    var E = G.F.getTotalEnergy();
    console.log(E);
};

G.F.getTotalEnergy = function () {
    var E = 0;
    G.S.ballId.forEach(id => {
        var t = G.O[id];
        E += t.m * (t.vx**2+t.vy**2) / 2;
    });
    return E;
};

G.F.fixCollision = function () {
    var flag = false;
    G.S.ballId.forEach(id => {
        var t = G.O[id];
        var force;
        if (force = t.checkWallCollision()) {
            t.fixWallCollision(force);
            flag = true;
        }
        G.S.ballId.forEach(id_ => {
            var b = G.O[id_];
            if (b == t) return;
            if (t.checkBallCollision(b)) {
                console.log("C!")
                var I = t.getCollisionImpulse(b);
                t.fixBallCollision(I);
                b.fixBallCollision({x:-I.x, y:-I.y});
                flag = true;
            }
        })
    });
    return flag;
}


G.makeBlock("main", G.F.loadMain).loadBlock("main");

