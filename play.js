/* Debopriyo crosses the palace, fights the dragon, and reaches Chandrima. */
(function (root) {
  var TILE = 16;
  var RUN_SPEED = 124;
  var GRAVITY = 1100;
  var JUMP_V = -258;
  var PRINCE = {
    idle: [
      "......hhhhhh....",
      ".....hhhhhhhh...",
      "....hhfffff.h...",
      "....hhfeffffh...",
      "....hhfffff.....",
      ".....ffff.......",
      "......gggg......",
      ".....vvvvvvv....",
      "....vvvvvvvvv...",
      "....vvvTTvvvv...",
      "....vvvvvvvvv...",
      ".....vvvvvvv....",
      ".....bb...bb....",
      "....bbb...bbb...",
      "....bbb...bbb...",
      "...bbbb...bbbb.."
    ],
    run: [
      "......hhhhhh....",
      ".....hhhhhhhh...",
      "....hhfffff.h...",
      "....hhfeffffh...",
      "....hhfffff.....",
      ".....ffff.......",
      "......gggg......",
      ".....vvvvvvv....",
      "....vvvvvvvvv...",
      "....vvvTTvvvv...",
      "....vvvvvvvvv...",
      ".....vvvvvvv....",
      "....bb.....bb...",
      "...bbb.....bbb..",
      "....bbb...bbb...",
      ".....bbbbbbbb..."
    ],
    jump: [
      "......hhhhhh....",
      ".....hhhhhhhh...",
      "....hhfffff.h...",
      "....hhfeffffh...",
      "....hhfffff.....",
      ".....ffff.......",
      "......gggg......",
      "....vvvvvvvvv...",
      "...vvvvTTvvvv...",
      "....vvvvvvvvv...",
      "....bb....bb....",
      "...bbb....bbb...",
      "..bbbb....bbbb..",
      "...bb......bb...",
      "....bb....bb....",
      ".....b....b....."
    ],
    reach: [
      "......hhhhhh....",
      ".....hhhhhhhh...",
      "....hhfffff.h...",
      "....hhfeffffh...",
      "....hhfffff.....",
      ".....ffff.......",
      "......gggg......",
      ".....vvvvvvvff..",
      "....vvvvvvvvff..",
      "....vvvTTvvff...",
      "....vvvvvvvvv...",
      ".....vvvvvvv....",
      ".....bb...bb....",
      "....bbb...bbb...",
      "....bbb...bbb...",
      "...bbbb...bbbb.."
    ]
  };

  var PRINCESS = {
    idle: [
      "......nn.nn.....",
      ".....nhhhhhn....",
      "....hhfffffhh...",
      "...hhffef.fhh...",
      "....hhfffff.....",
      ".....fffffff....",
      "......gggg......",
      ".....PPPPPP.....",
      "....PPPPPPPP....",
      "...PPPPPPPPPP...",
      "...PPPPPPPPPP...",
      "....PPPPPPPP....",
      ".....PPPPPP.....",
      "....PP....PP....",
      "...PPP....PPP...",
      "..PPPP....PPPP.."
    ],
    wave: [
      "......nn.nn.....",
      ".....nhhhhhn....",
      "....hhfffffhh...",
      "...hhffef.fhh...",
      "....hhfffff.....",
      ".....fffffff....",
      "......gggg......",
      "..s..PPPPPP.....",
      ".ss.PPPPPPPP....",
      "..s.PPPPPPPPP...",
      "...PPPPPPPPPP...",
      "....PPPPPPPP....",
      ".....PPPPPP.....",
      "....PP....PP....",
      "...PPP....PPP...",
      "..PPPP....PPPP.."
    ],
    step: [
      "......nn.nn.....",
      ".....nhhhhhn....",
      "....hhfffffhh...",
      "...hhffef.fhh...",
      "....hhfffff.....",
      ".....fffffff....",
      "......gggg......",
      ".....PPPPPP.....",
      "....PPPPPPPP....",
      "...PPPPPPPPPP...",
      "...PPPPPPPPPP...",
      "....PPPPPPPP....",
      ".....PPPPPP.....",
      "....PP....PP....",
      "...PPP....PP....",
      "..PPPP....PPP..."
    ]
  };

  var INK = {
    h: "#2a140c",
    f: "#f3c29a",
    e: "#1a1020",
    n: "#ffe14a",
    g: "#ff4d88",
    T: "#fff6e4",
    v: "#8e3058",
    b: "#2a160e",
    P: "#ff4d88",
    s: "#f3c29a"
  };

  var RALLY = "Overcome the adversities and reunite them!";
  var THANKS = "We are grateful you were able to unite us. Now join us for the wedding celebrations.";

  function checkSprites() {
    [PRINCE, PRINCESS].forEach(function (set) {
      Object.keys(set).forEach(function (name) {
        set[name].forEach(function (row, i) {
          if (row.length !== 16) throw new Error("sprite " + name + " row " + i);
        });
      });
    });
  }
  checkSprites();

  function buildMap() {
    var w = 50;
    var h = 12;
    var ground = h - 1;
    var grid = [];
    var y;
    var x;
    for (y = 0; y < h; y++) {
      var row = [];
      for (x = 0; x < w; x++) row.push(".");
      grid.push(row);
    }
    for (x = 0; x < w; x++) grid[ground][x] = "#";
    [9, 14, 19, 27, 33, 39].forEach(function (col) { grid[ground][col] = "."; });
    function fill(x0, x1, top) {
      var col;
      var row;
      for (col = x0; col <= x1; col++) {
        for (row = top; row <= ground; row++) grid[row][col] = "#";
      }
    }
    fill(22, 24, ground - 1);
    fill(30, 32, ground - 1);
    fill(36, 38, ground - 1);
    grid[ground][2] = "t";
    grid[ground][42] = "t";
    grid[ground - 1][3] = "P";
    grid[ground - 1][47] = "D";
    grid[ground - 1][49] = "R";
    return grid.map(function (line) { return line.join(""); });
  }

  function solidChar(ch) {
    return ch === "#" || ch === "t";
  }

  function findChar(grid, ch) {
    for (var y = 0; y < grid.length; y++) {
      var x = grid[y].indexOf(ch);
      if (x >= 0) return { x: x, y: y };
    }
    return null;
  }

  function createWorld(opts) {
    var grid = buildMap();
    var start = findChar(grid, "P");
    var goal = findChar(grid, "R");
    var den = findChar(grid, "D");
    var groundTop = (grid.length - 1) * TILE;
    var body = 14;
    var prince = {
      x: start.x * TILE + 2,
      y: groundTop - body,
      w: 12,
      h: body,
      vx: 0,
      vy: 0,
      onGround: true,
      face: 1,
      coyote: 0.16,
      invuln: 0
    };
    var dragon = {
      x: den.x * TILE,
      y: groundTop - 32,
      w: 40,
      h: 32,
      hp: 5,
      hpMax: 5,
      cool: 0.55,
      telegraph: 0,
      hurt: 0,
      onstage: false,
      face: -1,
      flame: 0
    };
    var princess = {
      x: dragon.x + 34,
      y: groundTop - 18,
      w: 14,
      h: 18
    };
    if (goal) princess.y = groundTop - 18;
    var world = {
      grid: grid,
      tile: TILE,
      groundTop: groundTop,
      prince: prince,
      princess: princess,
      princessHome: { x: dragon.x + 34, y: groundTop - 18 },
      dragon: dragon,
      dragonHome: { x: dragon.x, y: dragon.y },
      bossX: dragon.x - 52,
      spawnX: prince.x,
      jumpBuf: 0,
      fireBuf: 0,
      fireCd: 0,
      launch: 0,
      steer: 0,
      shots: [],
      hp: 3,
      maxHp: 3,
      phase: "intro",
      introT: 0,
      reunionT: 0,
      runT: 0,
      bannerT: 0,
      shake: 0,
      line: "",
      status: "Chandrima and Debopriyo were walking together.",
      floorY: groundTop,
      jumpCount: 0,
      flags: {},
      reduce: false,
      fireSkill: false,
      flame: { x: 10 * TILE + 2, y: groundTop - 44, w: 20, h: 44 },
      lamps: [12, 26, 40].map(function (col) {
        return { x: col * TILE + 4, y: groundTop - 20, w: 8, h: 18, lit: false };
      }),
      events: []
    };
    if (opts && opts.skipIntro) {
      world.phase = "run";
      world.dragon.onstage = true;
      world.flags.rally = true;
      world.status = RALLY;
    } else {
      world.princess.x = prince.x + 22;
      world.princess.y = groundTop - princess.h;
    }
    return world;
  }

  function solid(world, px, py) {
    var x = Math.floor(px / TILE);
    var y = Math.floor(py / TILE);
    if (y < 0) return false;
    if (y >= world.grid.length) return false;
    if (x < 0 || x >= world.grid[0].length) return true;
    return solidChar(world.grid[y][x]);
  }

  function hits(world, box) {
    var x0 = box.x + 0.5;
    var y0 = box.y + 0.5;
    var x1 = box.x + box.w - 0.5;
    var y1 = box.y + box.h - 0.5;
    var midX = (x0 + x1) / 2;
    var midY = (y0 + y1) / 2;
    var points = [
      [x0, y0], [x1, y0], [x0, y1], [x1, y1],
      [midX, y0], [midX, y1], [x0, midY], [x1, midY]
    ];
    for (var i = 0; i < points.length; i++) {
      if (solid(world, points[i][0], points[i][1])) return true;
    }
    return false;
  }

  function moveX(world, p, amount, maxStep) {
    if (!amount) return;
    var left = amount;
    var sign = amount < 0 ? -1 : 1;
    while (Math.abs(left) > 0.0001) {
      var hop = Math.min(1, Math.abs(left)) * sign;
      p.x += hop;
      if (!hits(world, p)) {
        left -= hop;
        continue;
      }
      p.x -= hop;
      var up;
      var cleared = false;
      for (up = 1; up <= maxStep; up++) {
        p.y -= 1;
        p.x += hop;
        if (!hits(world, p)) {
          cleared = true;
          break;
        }
        p.x -= hop;
      }
      if (!cleared) {
        p.y += up - 1;
        return;
      }
      left -= hop;
    }
  }

  function moveY(world, p, amount) {
    var left = amount;
    var sign = amount < 0 ? -1 : 1;
    while (Math.abs(left) > 0.0001) {
      var hop = Math.min(2, Math.abs(left)) * sign;
      p.y += hop;
      if (hits(world, p)) {
        p.y -= hop;
        if (amount > 0) p.onGround = true;
        p.vy = 0;
        return;
      }
      left -= hop;
    }
  }

  function feetPlanted(world, p) {
    var y = p.y + p.h + 1;
    return solid(world, p.x + 3, y) && solid(world, p.x + p.w - 3, y);
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function lose(world) {
    if (world.phase === "lost" || world.phase === "won" || world.phase === "reunion") return;
    world.phase = "lost";
    world.prince.vx = 0;
    world.prince.vy = 0;
    world.launch = 0;
    world.steer = 0;
    world.status = "Try Again";
    world.events.push("lose");
  }

  function beginRun(world) {
    var p = world.prince;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.coyote = 0.16;
    world.launch = 0;
    world.steer = 0;
    world.jumpBuf = 0;
    world.fireBuf = 0;
    world.phase = "run";
    world.floorY = p.y + p.h;
    world.princess.x = world.princessHome.x;
    world.princess.y = world.princessHome.y;
    world.dragon.x = world.dragonHome.x;
    world.dragon.y = world.dragonHome.y;
    world.dragon.onstage = true;
    world.dragon.hp = world.dragon.hpMax;
    world.dragon.cool = 0.55;
    world.dragon.telegraph = 0;
    world.dragon.hurt = 0;
    world.dragon.face = -1;
    world.dragon.flame = 0;
    world.shots = [];
    world.hp = 3;
    world.maxHp = 3;
    world.runT = 0;
    world.shake = 0;
    p.invuln = 0;
    world.line = RALLY;
    world.status = RALLY;
    if (!world.flags.rally) {
      world.flags.rally = true;
      world.bannerT = 2.6;
      world.events.push("rally");
    } else if (world.bannerT < 1.2) {
      world.bannerT = 1.2;
    }
  }

  function stepIntro(world, input, dt) {
    if (input.jump || input.fire) {
      beginRun(world);
      return;
    }
    var speed = world.reduce ? 2.2 : 1.45;
    world.introT += dt * speed;
    var t = world.introT;
    var p = world.prince;
    var feet = world.groundTop;
    var walkEnd = 4.6;
    var enterEnd = walkEnd + 2.2;
    var breathEnd = enterEnd + 1.7;
    var turnEnd = breathEnd + 1.8;
    var diveEnd = turnEnd + 1.05;
    var awayEnd = diveEnd + 1.7;
    var holdEnd = awayEnd + 2.3;
    p.y = feet - p.h;
    p.onGround = true;
    p.vy = 0;
    world.floorY = feet;
    world.dragon.roar = false;
    world.dragon.flame = 0;

    function circleAt(ang) {
      return {
        x: p.x + 42 + Math.cos(ang) * 10,
        y: feet - 64 + Math.sin(ang) * 5
      };
    }

    function glide(u) {
      return u * u * (3 - 2 * u);
    }

    if (t < walkEnd) {
      p.x = world.spawnX + t * 10;
      p.vx = 14;
      p.face = 1;
      world.princess.x = p.x + 22;
      world.princess.y = feet - world.princess.h;
      world.dragon.onstage = false;
      world.status = "Chandrima and Debopriyo were walking together.";
    } else if (t < enterEnd) {
      p.vx = 0;
      p.face = 1;
      world.princess.x = p.x + 22;
      world.princess.y = feet - world.princess.h;
      var u = glide((t - walkEnd) / (enterEnd - walkEnd));
      var hover = circleAt(0);
      var fromX = p.x + 108;
      var fromY = feet - 86;
      world.dragon.onstage = true;
      world.dragon.roar = true;
      world.dragon.face = -1;
      world.dragon.x = fromX + (hover.x - fromX) * u;
      world.dragon.y = fromY + (hover.y - fromY) * u - Math.sin(u * Math.PI) * 4;
      world.status = "An evil dragon is coming.";
      if (!world.flags.roar && world.dragon.x < p.x + 78) {
        world.flags.roar = true;
        world.events.push("roar");
      }
    } else if (t < breathEnd) {
      p.vx = 0;
      p.face = 1;
      world.princess.x = p.x + 22;
      world.princess.y = feet - world.princess.h;
      var bu = (t - enterEnd) / (breathEnd - enterEnd);
      var swell = bu < 0.18 ? bu / 0.18 : bu > 0.82 ? (1 - bu) / 0.18 : 1;
      var hover = circleAt(0);
      world.dragon.onstage = true;
      world.dragon.roar = true;
      world.dragon.face = -1;
      world.dragon.x = hover.x;
      world.dragon.y = hover.y - bu * 14;
      world.dragon.flame = swell * 48;
      world.status = "The dragon breathes fire.";
      if (!world.flags.breath) {
        world.flags.breath = true;
        world.events.push("breath");
      }
    } else if (t < turnEnd) {
      p.vx = 0;
      world.princess.x = p.x + 22;
      world.princess.y = feet - world.princess.h;
      var u = (t - breathEnd) / (turnEnd - breathEnd);
      var fromX = p.x + 52;
      var fromY = feet - 78;
      var bankX = p.x + 2;
      var bankY = feet - 96;
      var backX = p.x + 12;
      var backY = feet - 70;
      world.dragon.onstage = true;
      world.dragon.roar = false;
      var prevX = world.dragon.x;
      if (u < 0.5) {
        var outK = glide(u / 0.5);
        world.dragon.x = fromX + (bankX - fromX) * outK;
        world.dragon.y = fromY + (bankY - fromY) * outK;
      } else {
        var backK = glide((u - 0.5) / 0.5);
        world.dragon.x = bankX + (backX - bankX) * backK;
        world.dragon.y = bankY + (backY - bankY) * backK;
      }
      if (world.dragon.x > prevX + 0.01) world.dragon.face = 1;
      else if (world.dragon.x < prevX - 0.01) world.dragon.face = -1;
      p.face = world.dragon.x + 16 >= p.x ? 1 : -1;
      world.status = "The dragon turns in the sky.";
    } else if (t < diveEnd) {
      p.vx = 0;
      world.dragon.onstage = true;
      world.dragon.roar = false;
      world.dragon.face = 1;
      var u = (t - turnEnd) / (diveEnd - turnEnd);
      var fromX = p.x + 12;
      var fromY = feet - 70;
      var grabX = p.x + 30;
      var grabY = feet - 44;
      world.dragon.x = fromX + (grabX - fromX) * u;
      world.dragon.y = fromY + (grabY - fromY) * u;
      p.face = 1;
      if (u > 0.62) {
        world.princess.x = world.dragon.x + 16;
        world.princess.y = world.dragon.y + 10;
        world.status = "An evil dragon snatched her and flew away.";
        if (!world.flags.kidnap) {
          world.flags.kidnap = true;
          world.events.push("kidnap");
        }
      } else {
        world.princess.x = p.x + 22;
        world.princess.y = feet - world.princess.h;
        world.status = "The dragon turns in the sky.";
      }
    } else if (t < awayEnd) {
      p.vx = 0;
      p.face = 1;
      world.dragon.face = 1;
      world.dragon.roar = false;
      world.dragon.x += 52 * dt * speed;
      world.dragon.y -= 22 * dt * speed;
      world.princess.x = world.dragon.x + 16;
      world.princess.y = world.dragon.y + 10;
      world.status = "An evil dragon snatched her and flew away.";
      if (world.dragon.x > p.x + 118) {
        world.dragon.onstage = false;
        world.princess.y = -80;
      } else {
        world.dragon.onstage = true;
      }
    } else if (t < holdEnd) {
      world.dragon.onstage = false;
      world.princess.y = -80;
      p.vx = 0;
      world.line = RALLY;
      world.status = RALLY;
      if (!world.flags.rally) {
        world.flags.rally = true;
        world.bannerT = 2.4;
        world.events.push("rally");
      }
    } else {
      beginRun(world);
    }
  }

  function stepReunion(world, dt) {
    var p = world.prince;
    if (world.reduce) dt *= 1.8;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.face = 1;
    p.invuln = 0;
    world.reunionT += dt;
    var t = world.reunionT;
    var dragon = world.dragon;
    var home = world.dragonHome;
    if (t < 0.45) {
      dragon.hurt = 0.2;
      dragon.face = -1;
      dragon.x = home.x;
      dragon.y = home.y;
      dragon.onstage = true;
    } else {
      dragon.hurt = 0;
      dragon.face = 1;
      dragon.x += 90 * dt;
      dragon.y -= 16 * dt;
      if (dragon.x > home.x + 78) dragon.onstage = false;
    }
    world.princess.y = world.groundTop - world.princess.h;
    if (t > 0.7) {
      var goal = p.x + 14;
      if (world.princess.x > goal) world.princess.x = Math.max(goal, world.princess.x - 48 * dt);
    }
    var arrived = world.princess.x <= p.x + 15;
    if (arrived && world.flags.metAt === undefined) world.flags.metAt = t;
    if (world.flags.metAt !== undefined && t >= world.flags.metAt + 0.8) {
      world.phase = "won";
      world.status = THANKS;
      world.events.push("win");
    } else {
      world.status = "Chandrima is coming back.";
    }
  }

  function shoot(world) {
    var p = world.prince;
    var dir = p.face >= 0 ? 1 : -1;
    world.fireCd = 0.4;
    world.fireBuf = 0;
    world.shots.push({
      x: dir > 0 ? p.x + p.w - 1 : p.x - 7,
      y: p.y + 4,
      w: 8,
      h: 5,
      vx: 210 * dir,
      owner: "player"
    });
    world.events.push("fire");
  }

  function stepCombat(world, dt, input) {
    var p = world.prince;
    var dragon = world.dragon;
    if (dragon.hurt > 0) dragon.hurt = Math.max(0, dragon.hurt - dt);
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    if (world.fireCd > 0) world.fireCd = Math.max(0, world.fireCd - dt);
    if (input.fire) world.fireBuf = 0.45;
    else world.fireBuf = Math.max(0, world.fireBuf - dt);
    var armed = world.fireSkill && (world.phase === "run" || world.phase === "boss");
    if (armed && world.fireBuf > 0 && world.fireCd <= 0 && (world.phase !== "boss" || dragon.hp > 0)) shoot(world);

    if (world.phase === "boss" && dragon.hp > 0) {
      if (dragon.telegraph > 0) {
        dragon.telegraph -= dt;
        if (dragon.telegraph <= 0) {
          world.shots.push({
            x: dragon.x - 8,
            y: world.groundTop - 11,
            w: 8,
            h: 5,
            vx: -78,
            owner: "dragon"
          });
          world.events.push("breath");
        }
      } else {
        dragon.cool -= dt;
        if (dragon.cool <= 0) {
          dragon.telegraph = 0.5;
          dragon.cool = 1.65;
        }
      }
    }

    var dragonBox = { x: dragon.x + 2, y: dragon.y + 8, w: 32, h: 22 };
    var keep = [];
    var i;
    for (i = 0; i < world.shots.length; i++) {
      var s = world.shots[i];
      s.x += s.vx * dt;
      if (s.x < -30 || s.x > world.grid[0].length * TILE + 30) continue;
      if (s.owner === "player") {
        var lampHit = false;
        var li;
        for (li = 0; li < world.lamps.length; li++) {
          var lamp = world.lamps[li];
          if (lamp.lit || !overlap(s, lamp)) continue;
          lamp.lit = true;
          lampHit = true;
          world.events.push("spark");
          break;
        }
        if (lampHit) {
          var everyLampLit = world.lamps.every(function (item) { return item.lit; });
          if (everyLampLit && !world.flags.kindle) {
            world.flags.kindle = true;
            world.maxHp = 4;
            world.hp = Math.min(world.maxHp, world.hp + 1);
            world.line = "Three lamps lit. Debopriyo gains a heart.";
            world.bannerT = 2.6;
            world.status = "The palace lamps are lit. One more heart.";
            world.events.push("kindle");
          }
          continue;
        }
      }
      if (s.owner === "player" && dragon.hp > 0 && world.phase === "boss" && overlap(s, dragonBox)) {
        dragon.hp -= 1;
        dragon.hurt = 0.28;
        if (!world.reduce) world.shake = Math.max(world.shake, 0.1);
        world.events.push("hit");
        if (dragon.hp <= 0) {
          world.phase = "reunion";
          world.reunionT = 0;
          world.shots = [];
          p.invuln = 0;
          if (!world.reduce) world.shake = 0.32;
          world.status = "Chandrima is coming back.";
          world.events.push("reunion");
          return;
        }
        continue;
      }
      if (s.owner === "dragon" && world.phase === "boss" && p.invuln <= 0 && overlap(s, p)) {
        p.invuln = 0.85;
        world.hp -= 1;
        p.vx = -70;
        p.vy = -120;
        p.onGround = false;
        if (!world.reduce) world.shake = 0.26;
        world.events.push("hurt");
        if (world.hp <= 0) lose(world);
        continue;
      }
      keep.push(s);
    }
    if (world.phase !== "reunion") world.shots = keep;
  }

  function stepPlay(world, input, dt) {
    var p = world.prince;
    var run = RUN_SPEED;
    world.runT += dt;
    var takeoff = !p.onGround || !!input.jump;
    if (input.right && !input.left) world.steer = run;
    else if (input.left && !input.right) world.steer = -run;
    else if (takeoff && world.steer) {
      if (world.steer > 0) input.right = true;
      else input.left = true;
      world.steer = world.steer > 0 ? Math.max(0, world.steer - run * dt / 0.16) : Math.min(0, world.steer + run * dt / 0.16);
    } else {
      world.steer = 0;
    }
    var target = 0;
    if (input.left) target -= run;
    if (input.right) target += run;
    var rate = target === 0 ? (p.onGround ? 1800 : 260) : (p.onGround ? 1600 : 2600);
    if (p.vx < target) p.vx = Math.min(target, p.vx + rate * dt);
    else if (p.vx > target) p.vx = Math.max(target, p.vx - rate * dt);

    if (p.onGround) p.coyote = 0.16;
    else p.coyote = Math.max(0, p.coyote - dt);
    if (input.jump) world.jumpBuf = 0.18;
    else world.jumpBuf = Math.max(0, world.jumpBuf - dt);

    var jumped = false;
    if (world.jumpBuf > 0 && p.coyote > 0 && world.phase !== "lost") {
      jumped = true;
      p.onGround = false;
      p.coyote = 0;
      world.jumpBuf = 0;
      world.launch = 0.18;
      world.jumpCount += 1;
      world.events.push("jump");
    }

    if (!jumped) p.vy = Math.min(420, p.vy + GRAVITY * dt);
    if (jumped) p.vy = JUMP_V;
    if (world.launch > 0) {
      world.launch = Math.max(0, world.launch - dt);
      if (input.right) p.vx = Math.max(p.vx, run);
      if (input.left) p.vx = Math.min(p.vx, -run);
    }

    var grounded = p.onGround;
    var rising = p.vy < 0;
    var falling = p.vy;
    p.onGround = false;
    if (rising) {
      moveY(world, p, p.vy * dt);
      moveX(world, p, p.vx * dt, 10);
    } else {
      moveX(world, p, p.vx * dt, grounded ? 6 : 10);
      moveY(world, p, p.vy * dt);
    }
    if (p.vy >= 0 && feetPlanted(world, p)) {
      p.onGround = true;
      p.vy = 0;
      world.floorY = Math.floor((p.y + p.h + 1) / TILE) * TILE;
    }
    if (p.onGround && falling > 70) world.events.push("land");

    var maxX = world.grid[0].length * TILE - p.w - 4;
    if (p.x < 2) p.x = 2;
    if (p.x > maxX) p.x = maxX;

    if (p.y > world.grid.length * TILE + 24) {
      lose(world);
      return;
    }

    if (world.phase === "run" && world.flame && overlap(p, world.flame)) {
      world.fireSkill = true;
      world.flame = null;
      world.line = "Debopriyo can throw fire.";
      world.bannerT = 2.2;
      world.status = "Debopriyo can throw fire.";
      world.events.push("learn");
    }

    if (world.phase === "run" && p.x > world.bossX && (p.onGround || feetPlanted(world, p))) {
      world.phase = "boss";
      p.x = world.bossX;
      if (p.vx > 0) p.vx = 0;
      if (!world.fireSkill) world.fireSkill = true;
      world.line = "Face the dragon.";
      world.bannerT = 2.6;
      world.status = "Jump, throw fire, and dodge the dragon.";
      world.events.push("boss");
    }
    if (world.phase === "boss") {
      var arenaLeft = world.bossX - 28;
      if (p.x > world.bossX) {
        p.x = world.bossX;
        if (p.vx > 0) p.vx = 0;
      }
      if (p.x < arenaLeft) {
        p.x = arenaLeft;
        if (p.vx < 0) p.vx = 0;
      }
    }

    if (world.phase === "boss" && world.dragon.x > p.x) p.face = 1;
    else if (p.vx < -8) p.face = -1;
    else if (p.vx > 8) p.face = 1;

    if (world.phase !== "lost") stepCombat(world, dt, input);
  }

  function step(world, input, dt) {
    world.events.length = 0;
    if (dt > 0.05) dt = 0.05;
    input = input || {};
    if (world.bannerT > 0) world.bannerT = Math.max(0, world.bannerT - dt);
    if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
    if (world.phase === "intro") stepIntro(world, input, dt);
    else if (world.phase === "reunion") stepReunion(world, dt);
    else if (world.phase === "won" || world.phase === "lost") {
      world.prince.vx = 0;
      world.prince.invuln = 0;
    }
    else stepPlay(world, input, dt);
    return world;
  }

  function cameraY(world, viewH) {
    var mapH = world.grid.length * TILE;
    var cam = world.floorY - viewH * 0.68;
    if (mapH > viewH) cam = Math.max(0, Math.min(mapH - viewH, cam));
    else cam = (mapH - viewH) / 2;
    return cam;
  }

  function cameraX(world, viewW) {
    var mapW = world.grid[0].length * TILE;
    var p = world.prince;
    var left = Math.round(p.x + p.w * 0.5) - Math.round(viewW * 0.34);
    if (world.phase === "reunion" || world.phase === "won") {
      var pairL = Math.min(p.x, world.princess.x) - 10;
      var pairR = Math.max(p.x + p.w, world.princess.x + 16) + 12;
      if (pairR - pairL <= viewW) left = pairL + (pairR - pairL - viewW) / 2;
      else left = p.x - 6;
    } else if (world.phase === "intro" && world.dragon.onstage) {
      var spanL = Math.round(p.x) - 8;
      var spanR = Math.round(p.x) + 100;
      if (spanR - spanL <= viewW) left = spanL + (spanR - spanL - viewW) / 2;
      else left = Math.round(p.x) - 4;
    } else if (world.phase === "boss" && world.dragon.onstage) {
      var spanL = p.x - 4;
      var spanR = Math.max(world.dragon.x + world.dragon.w, world.princess.x + 16) + 6;
      if (spanR - spanL <= viewW) left = spanL + (spanR - spanL - viewW) / 2;
      else left = p.x - 2;
    }
    if (mapW > viewW) left = Math.max(0, Math.min(mapW - viewW, left));
    else left = (mapW - viewW) / 2;
    return left;
  }

  function blit(ctx, rows, x, y) {
    rows.forEach(function (row, j) {
      for (var i = 0; i < row.length; i++) {
        var color = INK[row[i]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + i), Math.round(y + j), 1, 1);
      }
    });
  }

  function drawBlock(ctx, x, y, torch, time, carpet) {
    ctx.fillStyle = "#5a3040";
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = "#d2a08e";
    ctx.fillRect(x + 1, y + 4, 14, 11);
    ctx.fillStyle = "#f0c8b8";
    ctx.fillRect(x + 1, y + 4, 14, 3);
    ctx.fillStyle = "#8a5048";
    ctx.fillRect(x + 1, y + 12, 14, 3);
    if (carpet) {
      ctx.fillStyle = "#7a2848";
      ctx.fillRect(x, y, 16, 4);
      ctx.fillStyle = "#ffe14a";
      ctx.fillRect(x, y, 16, 1);
    }
    if (!torch) return;
    var flicker = Math.floor(time * 8) % 2;
    ctx.fillStyle = "#3a2030";
    ctx.fillRect(x + 6, y - 4, 4, 4);
    ctx.fillStyle = flicker ? "#ffe14a" : "#ff7a3a";
    ctx.fillRect(x + 7, y - 7, 2, 4);
    ctx.fillStyle = "#fff6e4";
    ctx.fillRect(x + 7, y - 9, 2, 2);
    if (flicker) {
      ctx.fillStyle = "#ff7a3a";
      ctx.fillRect(x + 9, y - 11, 1, 1);
    }
  }

  function drawHeart(ctx, x, y, on) {
    ctx.fillStyle = on === false ? "#4a3040" : "#ff4d88";
    ctx.fillRect(x, y + 1, 2, 2);
    ctx.fillRect(x + 3, y + 1, 2, 2);
    ctx.fillRect(x, y + 3, 5, 1);
    ctx.fillRect(x + 1, y + 4, 3, 1);
    ctx.fillRect(x + 2, y + 5, 1, 1);
  }

  function drawDragon(ctx, x, y, time, dragon) {
    if (!dragon.onstage) return;
    if (dragon.hurt > 0 && Math.floor(time * 18) % 2 === 0) return;
    ctx.save();
    if (dragon.face > 0) {
      var pivot = Math.round(x + 22);
      ctx.translate(pivot, 0);
      ctx.scale(-1, 1);
      ctx.translate(-pivot, 0);
    }
    var flap = Math.sin(time * 7) > 0;
    ctx.fillStyle = "#2a1030";
    ctx.fillRect(x + 28, y + 16, 14, 5);
    ctx.fillRect(x + 38, y + 12, 6, 6);
    ctx.fillStyle = "#6a3480";
    ctx.fillRect(x + 10, y + 12, 24, 14);
    ctx.fillStyle = "#8a5088";
    ctx.fillRect(x + 12, y + 20, 16, 5);
    ctx.fillStyle = "#241028";
    if (flap) {
      ctx.fillRect(x + 16, y + 1, 14, 12);
      ctx.fillRect(x + 28, y + 5, 8, 8);
    } else {
      ctx.fillRect(x + 14, y + 8, 18, 7);
    }
    ctx.fillStyle = "#6a3480";
    ctx.fillRect(x + 2, y + 12, 12, 10);
    ctx.fillRect(x, y + 16, 6, 5);
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(x + 6, y + 7, 3, 6);
    ctx.fillStyle = dragon.telegraph > 0 || dragon.roar ? "#ff5a3a" : "#fff6e4";
    ctx.fillRect(x + 4, y + 15, 3, 3);
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(x + 5, y + 16, 1, 1);
    ctx.fillStyle = "#3a1848";
    ctx.fillRect(x + 14, y + 26, 4, 6);
    ctx.fillRect(x + 24, y + 26, 4, 6);
    if (dragon.flame > 4) {
      var reach = Math.round(dragon.flame);
      ctx.fillStyle = "#ff7a3a";
      ctx.fillRect(x - 4 - reach, y + 16, reach, 5);
      ctx.fillStyle = "#ffe14a";
      ctx.fillRect(x - 2 - reach, y + 17, reach, 3);
      ctx.fillStyle = "#fff6e4";
      ctx.fillRect(x - reach, y + 18, 8, 1);
    } else if (dragon.telegraph > 0 || dragon.roar) {
      ctx.fillStyle = "#ff7a3a";
      ctx.fillRect(x - 6, y + 17, 7, 4);
      ctx.fillStyle = "#ffe14a";
      ctx.fillRect(x - 4, y + 18, 4, 2);
    }
    ctx.restore();
  }

  function drawFireball(ctx, x, y, w, h) {
    ctx.fillStyle = "#ff7a3a";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(x + 2, y + 1, Math.max(2, w - 4), Math.max(2, h - 2));
    ctx.fillStyle = "#fff6e4";
    ctx.fillRect(x + 3, y + 2, 2, 1);
  }

  function mount(options) {
    var canvas = options.canvas;
    var ctx = canvas.getContext("2d");
    var world = createWorld();
    var held = { left: false, right: false, fire: false };
    var jumpLatch = false;
    var fireLatch = false;
    var active = true;
    var dateLabel = "";
    var scale = 2;
    var viewW = 160;
    var viewH = 112;
    var camHold = null;
    var acc = 0;
    var last = 0;
    var raf = 0;
    var time = 0;
    var hearts = [];
    var fireworks = [];
    var fireworkTimer = 0;
    var reduce = false;
    var coarse = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      coarse = window.matchMedia("(pointer: coarse)").matches;
    } catch (err) {
      reduce = false;
    }
    world.reduce = reduce;

    function resize() {
      var parent = canvas.parentElement || canvas;
      var parentW = Math.max(120, parent.clientWidth);
      var parentH = Math.max(80, parent.clientHeight);
      scale = 3;
      if (parentW < 300 || parentH < 150) scale = 2;
      if (parentW < 180 || parentH < 96) scale = 1;
      viewW = Math.floor(parentW / scale);
      viewH = Math.floor(parentH / scale);
      if (viewW < 48 || viewH < 36) scale = 1;
      viewW = Math.max(48, Math.floor(parentW / scale));
      viewH = Math.max(36, Math.floor(parentH / scale));
      canvas.width = viewW * scale;
      canvas.height = viewH * scale;
      canvas.style.width = canvas.width + "px";
      canvas.style.height = canvas.height + "px";
    }

    function pressJump() {
      if (!active) return;
      if (world.phase === "won" || world.phase === "lost") return;
      jumpLatch = true;
    }

    function pressFire() {
      if (!active) return;
      if (world.phase === "won" || world.phase === "lost") return;
      fireLatch = true;
    }

    function setKey(name, down) {
      if (name === "jump") {
        if (down) pressJump();
        return;
      }
      if (name === "fire") {
        if (!active) return;
        held.fire = !!down;
        if (down) pressFire();
        return;
      }
      if (!active) return;
      held[name] = !!down;
    }

    function setActive(on) {
      active = !!on;
      if (!active) {
        held.left = false;
        held.right = false;
        held.fire = false;
        jumpLatch = false;
        fireLatch = false;
        if (options.left) options.left.classList.remove("is-held");
        if (options.right) options.right.classList.remove("is-held");
        if (options.jump) options.jump.classList.remove("is-held");
        if (options.fire) options.fire.classList.remove("is-held");
      }
    }

    function setDate(label) {
      dateLabel = label || "";
    }

    function syncChrome() {
      var ended = world.phase === "lost" || world.phase === "won";
      var showFire = world.fireSkill && (world.phase === "run" || world.phase === "boss");
      var pad = options.left && options.left.parentElement;
      if (pad) {
        pad.hidden = ended;
        pad.classList.toggle("has-fire", showFire && !ended);
      }
      if (options.fire) options.fire.hidden = !showFire || ended;
      if (options.endings) {
        options.endings.hidden = !ended;
        options.endings.classList.toggle("won", world.phase === "won");
        options.endings.classList.toggle("lost", world.phase === "lost");
      }
      if (options.openInvite) options.openInvite.hidden = world.phase !== "won";
      if (options.repent) options.repent.hidden = world.phase !== "lost";
      if (options.tryAgain) options.tryAgain.textContent = world.phase === "won" ? "PLAY AGAIN" : "TRY AGAIN";
      if (options.status && world.status && options.status.textContent !== world.status) {
        options.status.textContent = world.status;
      }
    }

    function reset() {
      world = createWorld({ skipIntro: true });
      world.reduce = reduce;
      hearts = [];
      fireworks = [];
      fireworkTimer = 0;
      jumpLatch = false;
      fireLatch = false;
      held.left = false;
      held.right = false;
      held.fire = false;
      syncChrome();
    }

    function bindPad() {
      var pad = options.left && options.left.parentElement;
      if (!pad) return;
      var pointers = {};
      var jumpWas = false;
      var fireWas = false;
      function keyAt(x, y) {
        var el = document.elementFromPoint(x, y);
        while (el && el !== pad) {
          if (el === options.left) return "left";
          if (el === options.right) return "right";
          if (el === options.jump) return "jump";
          if (el === options.fire) return "fire";
          el = el.parentElement;
        }
        return "";
      }
      function paint() {
        var left = false;
        var right = false;
        var jump = false;
        var fire = false;
        Object.keys(pointers).forEach(function (id) {
          if (pointers[id] === "left") left = true;
          if (pointers[id] === "right") right = true;
          if (pointers[id] === "jump") jump = true;
          if (pointers[id] === "fire") fire = true;
        });
        if (!active) {
          held.left = false;
          held.right = false;
          held.fire = false;
          jumpWas = jump;
          fireWas = fire;
          return;
        }
        held.left = left;
        held.right = right;
        held.fire = fire;
        options.left.classList.toggle("is-held", left);
        options.right.classList.toggle("is-held", right);
        if (options.jump) options.jump.classList.toggle("is-held", jump);
        if (options.fire) options.fire.classList.toggle("is-held", fire);
        if (jump && !jumpWas) pressJump();
        if (fire && !fireWas) pressFire();
        jumpWas = jump;
        fireWas = fire;
      }
      function down(event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        if (pad.setPointerCapture) {
          try { pad.setPointerCapture(event.pointerId); } catch (err) { /* pointer already gone */ }
        }
        pointers[event.pointerId] = keyAt(event.clientX, event.clientY);
        paint();
      }
      function move(event) {
        if (!Object.prototype.hasOwnProperty.call(pointers, event.pointerId)) return;
        var next = keyAt(event.clientX, event.clientY);
        if (next === pointers[event.pointerId]) return;
        pointers[event.pointerId] = next;
        paint();
      }
      function up(event) {
        if (!Object.prototype.hasOwnProperty.call(pointers, event.pointerId)) return;
        delete pointers[event.pointerId];
        paint();
      }
      pad.addEventListener("pointerdown", down);
      pad.addEventListener("pointermove", move);
      pad.addEventListener("pointerup", up);
      pad.addEventListener("pointercancel", up);
      pad.addEventListener("lostpointercapture", up);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    }

    bindPad();
    if (options.tryAgain) options.tryAgain.addEventListener("click", reset);
    canvas.addEventListener("pointerdown", function () {
      if (world.phase === "intro") pressJump();
    });
    if (options.field) {
      options.field.addEventListener("touchmove", function (event) {
        event.preventDefault();
      }, { passive: false });
    }

    function emit(name) {
      if (name === "win") {
        var i;
        for (i = 0; i < 10; i++) {
          hearts.push({
            x: world.princess.x + 4,
            y: world.princess.y,
            vx: (i - 5) * 8,
            vy: -22 - (i % 3) * 6,
            life: 1.4
          });
        }
      }
      if (options.onEvent) options.onEvent(name);
    }

    function frame(now) {
      raf = window.requestAnimationFrame(frame);
      if (!last) last = now;
      var delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!active || document.hidden) return;
      time += delta;
      acc += delta;
      var first = true;
      var stepped = false;
      while (acc >= 1 / 60) {
        var before = world.phase;
        step(world, {
          left: held.left,
          right: held.right,
          jump: first && jumpLatch,
          fire: first && (fireLatch || held.fire)
        }, 1 / 60);
        first = false;
        stepped = true;
        world.events.forEach(emit);
        if (before !== world.phase && (world.phase === "won" || world.phase === "lost")) break;
        acc -= 1 / 60;
      }
      if (stepped) {
        jumpLatch = false;
        fireLatch = false;
      }
      hearts.forEach(function (heart) {
        heart.life -= delta;
        heart.x += heart.vx * delta;
        heart.y += heart.vy * delta;
        heart.vy += 30 * delta;
      });
      hearts = hearts.filter(function (heart) { return heart.life > 0; });
      var wantX = cameraX(world, viewW);
      if (world.phase === "intro" && world.dragon.onstage) {
        if (camHold === null) camHold = wantX;
        camHold += (wantX - camHold) * Math.min(1, delta * 2.6);
      } else {
        camHold = wantX;
      }
      var shakeX = 0;
      var shakeY = 0;
      if (!reduce && world.shake > 0) {
        var amp = Math.max(1, Math.min(2, Math.round(world.shake * 10)));
        shakeX = Math.floor(time * 70) % 2 ? amp : -amp;
        shakeY = Math.floor(time * 90) % 2 ? 1 : -1;
      }
      if (world.phase === "won") {
        fireworkTimer -= delta;
        if (fireworkTimer <= 0) {
          spawnFirework();
          fireworkTimer = reduce ? 1.2 + Math.random() * 0.5 : 0.45 + Math.random() * 0.5;
        }
      } else {
        fireworkTimer = 0;
      }
      updateFireworks(delta);
      syncChrome();
      draw(Math.round(camHold) + shakeX, shakeY);
    }

    function spawnFirework() {
      var colors = ["#ffe14a", "#ff4d88", "#8eecff", "#fff6e4", "#ff9a4a"];
      var shellColor = colors[Math.floor(Math.random() * colors.length)];
      var cx = Math.round(viewW * (0.14 + Math.random() * 0.72));
      var cy = Math.round(viewH * (0.34 + Math.random() * 0.28));
      var count = reduce ? 16 : 30 + Math.floor(Math.random() * 12);
      var particles = [];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        var speed = 18 + Math.random() * (reduce ? 18 : 38);
        var life = 0.9 + Math.random() * 0.6;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life,
          max: life,
          big: i % 5 === 0,
          color: i % 4 === 0 ? "#fff6e4" : shellColor
        });
      }
      fireworks.push({ x: cx, y: cy, color: shellColor, flash: 0.2, particles: particles });
      emit("firework");
    }

    function updateFireworks(dt) {
      fireworks.forEach(function (shell) {
        if (shell.flash > 0) shell.flash -= dt;
        shell.particles.forEach(function (p) {
          if (p.life <= 0) return;
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 24 * dt;
          p.vx *= 0.993;
        });
      });
      fireworks = fireworks.filter(function (shell) {
        if (shell.flash > 0) return true;
        for (var i = 0; i < shell.particles.length; i++) {
          if (shell.particles[i].life > 0) return true;
        }
        return false;
      });
    }

    function drawFireworks() {
      fireworks.forEach(function (shell) {
        if (shell.flash > 0) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#fff6e4";
          var flashSize = shell.flash > 0.1 ? 4 : 2;
          ctx.fillRect(Math.round(shell.x) - 1, Math.round(shell.y) - 1, flashSize, flashSize);
        }
        shell.particles.forEach(function (p) {
          if (p.life <= 0) return;
          var alpha = Math.max(0, Math.min(1, p.life / p.max));
          ctx.fillStyle = p.color;
          if (!reduce) {
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillRect(Math.round(p.x - p.vx * 0.02), Math.round(p.y - p.vy * 0.02), 1, 1);
          }
          ctx.globalAlpha = alpha;
          var size = p.big || alpha > 0.6 ? 2 : 1;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), size, size);
        });
      });
      ctx.globalAlpha = 1;
    }

    function draw(camX, shakeY) {
      var p = world.prince;
      var camY = Math.round(cameraY(world, viewH)) + (shakeY || 0);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, viewW, viewH);
      drawSky();
      drawFireworks();
      drawBackdrop(camX, camY);

      var x0 = Math.max(0, Math.floor(camX / TILE) - 1);
      var x1 = Math.min(world.grid[0].length, Math.ceil((camX + viewW) / TILE) + 1);
      var y0 = Math.max(0, Math.floor(camY / TILE) - 1);
      var y1 = Math.min(world.grid.length, Math.ceil((camY + viewH) / TILE) + 1);
      var ty;
      var tx;
      for (ty = y0; ty < y1; ty++) {
        for (tx = x0; tx < x1; tx++) {
          var ch = world.grid[ty][tx];
          if (!solidChar(ch)) continue;
          var above = ty > 0 ? world.grid[ty - 1][tx] : ".";
          drawBlock(ctx, tx * TILE - camX, ty * TILE - camY, ch === "t", time, !solidChar(above));
        }
      }

      if (world.phase === "run" && world.jumpCount === 0) drawGapHints(camX, camY);
      if (world.phase === "run" || world.phase === "boss") {
        world.lamps.forEach(function (lamp) {
          var lx = Math.round(lamp.x - camX);
          var ly = Math.round(lamp.y - camY);
          ctx.fillStyle = "#3a2030";
          ctx.fillRect(lx + 3, ly + 8, 2, 10);
          ctx.fillStyle = lamp.lit ? "#ff7a3a" : "#4a3048";
          ctx.fillRect(lx + 1, ly + 2, 6, 7);
          ctx.fillStyle = lamp.lit ? "#ffe14a" : "#2a2030";
          ctx.fillRect(lx + 2, ly, 4, 4);
          if (lamp.lit) {
            ctx.fillStyle = "#fff6e4";
            ctx.fillRect(lx + 3, ly + 1, 2, 2);
          }
        });
      }
      if (world.phase === "run" && world.flame) {
        var fx = Math.round(world.flame.x - camX);
        var fy = Math.round(world.groundTop - 22 - camY);
        var flick = Math.floor(time * 8) % 2;
        ctx.fillStyle = "#3a2030";
        ctx.fillRect(fx + 2, fy + 18, 16, 4);
        ctx.fillStyle = "#ffd56a";
        ctx.fillRect(fx + 6, fy + 14, 8, 4);
        ctx.fillStyle = "#ff7a3a";
        ctx.fillRect(fx + 7, fy + 6, 6, 9);
        ctx.fillStyle = flick ? "#ffe14a" : "#fff6e4";
        ctx.fillRect(fx + 8, fy + 2 + flick, 4, 8);
        ctx.fillRect(fx + 9, fy - 2, 2, 4);
      }

      function drawPrincess() {
        if (world.phase === "intro" && world.princess.y <= -20) return;
        var beside = world.princess.x <= p.x + 15;
        var celebrate = world.phase === "won" || (world.phase === "reunion" && beside);
        var strolling = world.phase === "intro" && !world.dragon.onstage && Math.abs(p.vx) > 8 && world.princess.y > 0;
        var comingBack = world.phase === "reunion" && world.reunionT > 0.7 && !beside;
        var bob = 0;
        if (!reduce && (strolling || comingBack)) bob = Math.floor(time * 3) % 2;
        var gown = PRINCESS.idle;
        if (celebrate) gown = PRINCESS.wave;
        else if (bob) gown = PRINCESS.step;
        blit(
          ctx,
          gown,
          world.princess.x - 1 - camX,
          world.princess.y + world.princess.h - gown.length - camY - bob
        );
        if (world.phase === "intro" || world.phase === "reunion" || world.phase === "won") {
          drawHeart(ctx, world.princess.x + 4 - camX, world.princess.y - 8 - camY - bob, true);
        }
        if (comingBack && !reduce) {
          ctx.fillStyle = "#c4a090";
          ctx.fillRect(
            Math.round(world.princess.x + 12 + (Math.floor(time * 8) % 2) * 3 - camX),
            Math.round(world.princess.y + world.princess.h - camY),
            2,
            1
          );
        }
      }

      var princessInFront = world.phase === "intro" || world.phase === "reunion" || world.phase === "won";
      if (!princessInFront) drawPrincess();

      var flapTime = world.dragon.roar || world.phase === "reunion" ? time * 2.2 : time;
      drawDragon(ctx, Math.round(world.dragon.x - camX), Math.round(world.dragon.y - camY), flapTime, world.dragon);
      if (world.phase === "reunion" && world.reunionT < 0.5 && world.dragon.onstage && !reduce) {
        [[6, 18], [18, 10], [28, 20], [12, 26], [34, 14]].forEach(function (spot, i) {
          ctx.fillStyle = i % 2 ? "#ff7a3a" : "#ffe14a";
          ctx.fillRect(
            Math.round(world.dragon.x + spot[0] - camX),
            Math.round(world.dragon.y + spot[1] - Math.floor(world.reunionT * 10) % 3 - camY),
            2,
            2
          );
        });
      }
      if (princessInFront) drawPrincess();
      if (world.phase === "boss") {
        var railX = world.bossX + 14 - camX;
        var railY = world.groundTop - 16 - camY;
        ctx.fillStyle = "#ffe14a";
        ctx.fillRect(Math.round(railX), Math.round(railY + 4), 2, 12);
        ctx.fillRect(Math.round(railX + 8), Math.round(railY + 4), 2, 12);
        ctx.fillRect(Math.round(railX), Math.round(railY + 4), 10, 2);
      }
      if (world.phase === "boss") {
        var pip;
        for (pip = 0; pip < world.dragon.hpMax; pip++) {
          ctx.fillStyle = pip < world.dragon.hp ? "#ff5a3a" : "#3a2030";
          ctx.fillRect(Math.round(world.dragon.x + 8 + pip * 6 - camX), Math.round(world.dragon.y - 5 - camY), 4, 3);
        }
        if (world.dragon.onstage && world.dragon.telegraph > 0) {
          var warn = Math.floor(time * 12) % 2 === 0;
          var ex = Math.round(world.dragon.x + 17 - camX);
          var ey = Math.round(world.dragon.y - 14 - camY);
          ctx.fillStyle = warn ? "#ff5a3a" : "#ffe14a";
          ctx.fillRect(ex, ey, 2, 5);
          ctx.fillRect(ex, ey + 6, 2, 2);
        }
      }

      world.shots.forEach(function (s) {
        if (!reduce) {
          ctx.fillStyle = s.owner === "dragon" ? "rgba(255, 90, 58, 0.35)" : "rgba(255, 225, 74, 0.35)";
          var trailX = s.vx > 0 ? s.x - 3 : s.x + s.w;
          ctx.fillRect(Math.round(trailX - camX), Math.round(s.y - camY + 1), 3, 1);
        }
        drawFireball(ctx, Math.round(s.x - camX), Math.round(s.y - camY), s.w, s.h);
      });

      var hidePrince = (world.phase === "run" || world.phase === "boss") && p.invuln > 0 && Math.floor(time * 16) % 2 === 0;
      if (!hidePrince) {
        var besideHer = world.princess.x <= p.x + 15;
        var rows = PRINCE.idle;
        var stroll = p.onGround && Math.abs(p.vx) > 12 && Math.abs(p.vx) < 70;
        var introWalk = world.phase === "intro" && stroll;
        var stride = Math.floor(time * (stroll ? 3 : 8)) % 2 === 0;
        if ((world.phase === "won" || (world.phase === "reunion" && besideHer)) && p.onGround) rows = PRINCE.reach;
        else if (!p.onGround) rows = PRINCE.jump;
        else if (!introWalk && Math.abs(p.vx) > 12 && stride) rows = PRINCE.run;
        var spriteX = p.x + p.w / 2 - 8;
        var spriteY = p.y + p.h - rows.length;
        if (!reduce && p.onGround && Math.abs(p.vx) > 12) spriteY -= stroll ? Math.floor(time * 3) % 2 : Math.floor(time * 8) % 2;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(Math.round(p.x - camX), Math.round(p.y + p.h - camY), p.w, 2);
        if (!reduce && p.onGround && Math.abs(p.vx) > 70) {
          ctx.fillStyle = "#d2a08e";
          ctx.fillRect(
            Math.round(p.x + (p.face > 0 ? -2 : p.w) - (Math.floor(time * 8) % 4) - camX),
            Math.round(p.y + p.h - camY),
            2,
            1
          );
        }
        ctx.save();
        if (p.face < 0) {
          var pivot = Math.round(spriteX - camX + 8);
          ctx.translate(pivot, 0);
          ctx.scale(-1, 1);
          ctx.translate(-pivot, 0);
        }
        blit(ctx, rows, spriteX - camX, spriteY - camY);
        if (!reduce && Math.abs(p.vx) > 70) {
          ctx.fillStyle = "#8e3058";
          ctx.fillRect(
            Math.round(spriteX - camX - 2),
            Math.round(spriteY - camY + (p.onGround ? 8 : 6)),
            2,
            p.onGround ? 3 + (Math.floor(time * 8) % 2) : 5
          );
        }
        ctx.restore();
      }

      hearts.forEach(function (heart) {
        drawHeart(ctx, heart.x - camX, heart.y - camY, true);
      });

      if (world.phase === "boss" || world.phase === "reunion" || (world.phase === "lost" && world.hp < world.maxHp)) {
        var heart;
        for (heart = 0; heart < world.maxHp; heart++) drawHeart(ctx, 6 + heart * 9, 4, heart < world.hp);
      }

      drawBanner(camY);
      if (world.phase === "intro") {
        var hintDim = reduce ? 1 : 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(time * 2));
        drawToast("TAP OR JUMP TO SKIP", canvas.height - 6, hintDim);
      } else if (world.phase === "run" && world.runT < 5) {
        drawToast(coarse ? "PADS MOVE  JUMP TO HOP" : "ARROWS MOVE  SPACE JUMPS", canvas.height - 6, 1);
      }
    }

    function drawToast(text, y, dim) {
      var size = Math.max(12, Math.min(18, Math.round(canvas.width / 22)));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = size + "px VT323, monospace";
      while (size > 9 && ctx.measureText(text).width > canvas.width - 20) {
        size -= 1;
        ctx.font = size + "px VT323, monospace";
      }
      var width = Math.ceil(ctx.measureText(text).width) + 16;
      var height = size + 8;
      var left = Math.round((canvas.width - width) / 2);
      var top = Math.round(y - height);
      ctx.globalAlpha = Math.max(0.35, Math.min(1, dim));
      ctx.fillStyle = "rgba(12, 6, 14, 0.82)";
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = "#ffe14a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, top + height / 2 + 1);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    function drawBanner(camY) {
      var text = "";
      if (world.phase === "lost") text = "Try Again";
      else if (world.phase === "won") text = THANKS;
      else if (world.bannerT > 0 && world.line) text = world.line;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!text) return;
      var size = Math.max(20, Math.min(34, Math.round(canvas.width / 13)));
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      var maxW = canvas.width - 24;
      ctx.font = size + "px VT323, monospace";
      var lines = wrapLines(ctx, text, maxW);
      while (lines.length > 3 && size > 16) {
        size -= 2;
        ctx.font = size + "px VT323, monospace";
        lines = wrapLines(ctx, text, maxW);
      }
      if (!lines.length) return;
      var lineH = size + 2;
      var blockH = lines.length * lineH + 8;
      var top = 6;
      ctx.fillStyle = "rgba(12, 6, 14, 0.78)";
      ctx.fillRect(8, top, canvas.width - 16, blockH);
      lines.forEach(function (line, i) {
        ctx.fillStyle = "#1a0c16";
        ctx.fillText(line, canvas.width / 2 + 1, top + 4 + i * lineH + 1);
        ctx.fillStyle = i === 0 ? "#ffe14a" : "#fff6e4";
        ctx.fillText(line, canvas.width / 2, top + 4 + i * lineH);
      });
      ctx.textAlign = "left";
      void camY;
    }

    function wrapLines(context, text, maxW) {
      var words = text.split(" ");
      var lines = [];
      var line = "";
      words.forEach(function (word) {
        var next = line ? line + " " + word : word;
        if (context.measureText(next).width > maxW && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
      return lines;
    }

    function drawSky() {
      var stops = [0, 0.34, 0.55, 0.74, 0.88, 1];
      var colors = ["#0c0616", "#1a1230", "#4a2848", "#a85060", "#e88878", "#f2b898"];
      var i;
      var y;
      for (i = 0; i < colors.length; i++) {
        var band0 = Math.floor(viewH * stops[i]);
        var band1 = i === colors.length - 1 ? viewH : Math.floor(viewH * stops[i + 1]);
        ctx.fillStyle = colors[i];
        ctx.fillRect(0, band0, viewW, Math.max(1, band1 - band0));
        if (i === colors.length - 1) continue;
        ctx.fillStyle = colors[i + 1];
        for (y = 0; y < viewW; y += 2) ctx.fillRect(y + (band0 % 2), band1 - 1, 1, 1);
      }
      var drift = reduce ? 0 : time * 1.6;
      function cloud(offset, y, width) {
        var cx = ((offset + drift) % (viewW + 90)) - 45;
        ctx.fillStyle = "rgba(255, 176, 214, 0.08)";
        ctx.fillRect(cx + 6, y, width - 12, 2);
        ctx.fillRect(cx, y + 2, width, 4);
        ctx.fillRect(cx + 9, y + 6, width - 18, 2);
      }
      cloud(8, Math.floor(viewH * 0.2), 38);
      cloud(62, Math.floor(viewH * 0.33), 54);
      cloud(104, Math.floor(viewH * 0.47), 30);

      ctx.fillStyle = "#fff6e4";
      var sx;
      var sy;
      for (sx = 8; sx < viewW; sx += 24) {
        for (sy = 10; sy < viewH * 0.56; sy += 28) {
          var seed = (sx * 5 + sy * 11) % 19;
          if (seed > 5) continue;
          var twinkle = reduce ? 1 : (Math.floor(time * 1.4 + seed) % 7 === 0 ? 0.35 : 1);
          ctx.globalAlpha = twinkle;
          ctx.fillRect(sx + (seed % 4), sy + (seed % 3), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
      [[30, 20], [78, 34], [126, 12], [168, 42]].forEach(function (star, i) {
        if (star[0] >= viewW - 4 || star[1] >= viewH * 0.56) return;
        if (i === 1) {
          ctx.fillRect(star[0] - 1, star[1], 3, 1);
          ctx.fillRect(star[0], star[1] - 1, 1, 3);
        } else {
          ctx.fillRect(star[0], star[1], 1, 1);
        }
      });
      var mx = 12;
      var my = Math.max(6, Math.floor(viewH * 0.055));
      ctx.fillStyle = "#fff1c9";
      ctx.fillRect(mx + 3, my, 8, 3);
      ctx.fillRect(mx, my + 3, 14, 8);
      ctx.fillRect(mx + 3, my + 11, 8, 3);
      ctx.fillStyle = "#ffe08a";
      ctx.fillRect(mx + 4, my + 4, 4, 4);
      ctx.fillRect(mx + 9, my + 9, 2, 2);
    }

    function drawDome(x, base, kind) {
      if (kind === 0) {
        ctx.fillRect(x + 8, base - 46, 16, 8);
        ctx.fillRect(x + 11, base - 54, 10, 10);
        ctx.fillRect(x + 14, base - 60, 4, 8);
        ctx.fillRect(x + 15, base - 18, 3, 18);
      } else if (kind === 1) {
        ctx.fillRect(x + 2, base - 28, 28, 6);
        ctx.fillRect(x + 6, base - 36, 20, 10);
        ctx.fillRect(x + 12, base - 42, 8, 8);
        ctx.fillRect(x + 4, base - 16, 4, 16);
        ctx.fillRect(x + 24, base - 16, 4, 16);
      } else {
        ctx.fillRect(x + 6, base - 34, 8, 6);
        ctx.fillRect(x + 8, base - 40, 4, 8);
        ctx.fillRect(x + 18, base - 26, 8, 6);
        ctx.fillRect(x + 20, base - 32, 4, 8);
        ctx.fillRect(x + 8, base - 20, 3, 20);
        ctx.fillRect(x + 20, base - 16, 3, 16);
      }
    }

    function drawBackdrop(camX, camY) {
      var floor = world.grid.length * TILE - camY;
      var horizon = Math.round(floor - 2);
      var i;
      ctx.fillStyle = "#100814";
      for (i = -2; i < 14; i++) {
        drawDome(Math.round(i * 78 - (camX * 0.2 % 78)), horizon, ((i % 3) + 3) % 3);
      }
      ctx.fillStyle = "#1c1024";
      for (i = -2; i < 16; i++) {
        var ax = Math.round(i * 52 - (camX * 0.45 % 52));
        var ay = horizon;
        ctx.fillRect(ax + 4, ay - 30, 5, 30);
        ctx.fillRect(ax + 24, ay - 30, 5, 30);
        ctx.fillRect(ax + 4, ay - 36, 25, 7);
        ctx.fillRect(ax + 10, ay - 42, 13, 8);
        ctx.fillRect(ax + 14, ay - 46, 5, 6);
      }
      if (floor < viewH) {
        ctx.fillStyle = "#0c060e";
        ctx.fillRect(0, Math.round(floor), viewW, viewH - floor + 8);
      }
    }

    function drawGapHints(camX, camY) {
      var ground = world.grid[world.grid.length - 1];
      var x;
      for (x = 1; x < ground.length - 1; x++) {
        if (ground[x] !== "." || ground[x - 1] === ".") continue;
        var hx = x * TILE - camX + 10;
        var hy = (world.grid.length - 1) * TILE - camY - 18 + (reduce ? 0 : Math.sin(time * 5) * 2);
        ctx.fillStyle = "#ffe14a";
        ctx.fillRect(Math.round(hx), Math.round(hy), 2, 2);
        ctx.fillRect(Math.round(hx - 2), Math.round(hy + 2), 2, 2);
        ctx.fillRect(Math.round(hx + 2), Math.round(hy + 2), 2, 2);
      }
    }

    resize();
    if (typeof ResizeObserver !== "undefined") {
      var observer = new ResizeObserver(resize);
      observer.observe(canvas.parentElement || canvas);
    }
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(frame);

    return {
      resize: resize,
      setKey: setKey,
      pressJump: pressJump,
      pressFire: pressFire,
      setActive: setActive,
      setDate: setDate,
      reset: reset
    };
  }

  root.WeddingPlay = {
    createWorld: createWorld,
    solid: solid,
    step: step,
    cameraX: cameraX,
    cameraY: cameraY,
    mount: mount
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
