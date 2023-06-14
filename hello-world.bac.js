G.F.loadMain = function () {
    this.AI = G.F.mainAI;
    G.KB.addKeys('LEFT', 'RIGHT', 'F');
    G.setState({
        targetCount: 10, targetLetters: ['H', 'E', 'L', 'L', 'O', 'W', 'O', 'R', 'L', 'D']
    });
    G.makeGob('viewport', G)
        .setVar({ x: 50, y: 50, w: 200, h: 325 })
        .setStyle({ backgroundColor: '#000000' })
        .turnOn();
    G.makeGob('ship', G.O.viewport)
        .setVar({ x: 87, y: 220, z: 100, w: 26, h: 30, AI: G.F.shipAI })
        .setStyle({ backgroundColor: '#339999' })
        .turnOn();
    G.makeGob('help', G.O.viewport)
        .setVar({ x: 0, y: 265, w: 200, h: 60 })
        .setSrc('Press <strong>F</strong> to fire<br /><strong>ARROWS</strong> to move')
        .setStyle({ color: '#000000', backgroundColor: '#339999' })
        .turnOn();
    G.makeGob('bullet', G.O.viewport)
        .setVar({ x: -100, y: -100, w: 4, h: 12, AI: G.F.bulletAI })
        .setStyle({ backgroundColor: 'yellow' })
        .setState({ firing: 0 })
        .turnOn();
    G.makeGob('explosion', G.O.viewport)
        .setState({ frame: 0 })
        .setVar({ x: -100, y: -100, w: 4, h: 12, AI: G.F.explosionAI })
        .setStyle({ border: '3px solid red' })
        .turnOn();
    for (var i = 0; i < 10; i++) {
        G.makeGob('target' + i, G.O.viewport)
          .setVar({ x: 30 + (i % 5) * 28, y: 25 + Math.floor(i / 5) * 40, w: 25, h: 28 })
          .setSrc(G.S.targetLetters[i])
          .setStyle({ color: '#ffffff' })
          .turnOn();
    }
}; 

G.F.mainAI = function () {
    var i, target;
    // move ship 
    G.O.ship.AI();
    // move/fire bullet 
    G.O.bullet.AI();
    // animate explosion
    G.O.explosion.AI();
    // trigger explosion if the bullet hits a target.
    for (i = 0; i < 10; i++) {
        target = G.O['target' + i];
        if (G.O.bullet.checkIntersection(target) ) {
            G.O.bullet
                .setState({ firing: 0 })
                .setVar({ x: -100, y: -100 })
                .draw();
            target.turnOff();
            G.O.explosion
                .setVar({ x: target.x + 6, y: target.y + 8 })
                .AI('reset')
                .turnOn();
            G.S.targetCount--;
        }
    }
    // reset targets after all have been exploded 
    if (G.S.targetCount < 1 && !G.O.explosion.on) {
        for (i = 0; i < 10; i++) {
            G.O['target' + i].turnOn();
        }
        G.S.targetCount = 10;
    }
}; 

G.F.shipAI = function () {
    var t = this;
    // move the ship left 
    if (G.KB.keys.LEFT.isPressed) {
        if (t.x > 7) {
            t.setVar({ x: t.x - 5 }).draw();
        }
    }
    // move the ship right 
    else if (G.KB.keys.RIGHT.isPressed) {
        if (t.x < 167) {
            t.setVar({ x: t.x + 5 }).draw();
        }
    } return t;
}; 

G.F.bulletAI = function () {
    var t = this;
    // start firing from nose of ship 
    if (G.KB.keys.F.isPressed && !t.S.firing ) {
        t.S.firing = 1;
        t.setVar({ x: G.O.ship.x + 11, y: G.O.ship.y + 10 }).draw();
    }
    // move the bullet up the screen 
    if (t.S.firing) {
        if (t.y > 5) {
            t.setVar({ y: t.y - 18 }).draw();
        } else {
            t.setState({ firing: 0 })
                .setVar({ x: -100, y: -100 })
                .draw();
        }
    } return t;
}; 

G.F.explosionAI = function (cmd) {
    var t = this, F;
    if (cmd == 'reset') {
        t.setState({ frame: 0 })
            .setVar({ tx: 0, ty: 0, tw: 0, th: 0 })
            .draw();
    } else {
        if (!t.on) {
            return t;
        }
        F = t.S.frame;
        if (F < 8) {
            t.setVar({ tx: -(F * F + 1), ty: -(F * F + 1), tw: F * F * 2 + 2, th: F * F * 2 + 2 })
                .draw();
        } else {
            t.turnOff();
        } t.S.frame++;
    } return t;
}; 

G.makeBlock("main", G.F.loadMain).loadBlock("main");

