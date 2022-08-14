/*
    LittleJS Hello World Starter Game
*/

"use strict";

// popup errors if there are any (help diagnose issues on mobile devices)
//onerror = (...parameters)=> alert(parameters);

// game variables
let death;

let angels = [];
let lastAngelAddedAt = 0;

let souls = [];
let lastSoulAddedAt = 0;

let score = 0;
let gameOver = false;

class SoulObject extends EngineObject {
  constructor(startingPos, direction, speed) {
    super(startingPos, vec2(20, 16), 64, vec2(10, 8));
    this.velocity = vec2(0, speed).rotate((Math.PI / 2) * direction);
    this.damping = 1;
  }
}

class AngelObject extends EngineObject {
  targetSoul = null;

  constructor(position) {
    super(position, vec2(40, 64), 6, vec2(20, 32));
    this.setCollision(1, 1, 1);
  }
}

function clearAngelTargetSouls() {
  for (const angel of angels) {
    angel.targetSoul = null;
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  mainCanvasSize = canvasFixedSize = vec2(640, 480);

  cameraPos = vec2(320, 240);
  cameraScale = 1;

  objectMaxSpeed = 20;

  death = new EngineObject(mousePos, vec2(40, 64), 2, vec2(20, 32));

  angels.push(new AngelObject(vec2(640 - 100, 480 - 100)));
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  if (gameOver) {
    return;
  }

  if (mousePosScreen.x) {
    death.velocity = mousePos.subtract(death.pos);
  }

  for (const angel of angels) {
    if (!angel.targetSoul && souls.length > 0) {
      const existingTargetSouls = new Set(
        angels.map((it) => it.targetSoul).filter((it) => !!it)
      );

      // Go for the closest soul that isn't already the target of a different angel
      angel.targetSoul = souls
        .sort(
          (a, b) =>
            angel.pos.subtract(a.pos).length() -
            angel.pos.subtract(b.pos).length()
        )
        .find((it) => !existingTargetSouls.has(it));
    }

    if (angel.targetSoul) {
      const acceleration = angel.targetSoul.pos
        .subtract(angel.pos)
        .divide(vec2(1000, 1000));

      angel.applyAcceleration(acceleration);

      const angelMaxSpeed = 5 + (clamp(time, 0, 60) / 60) * 5;
      angel.velocity = angel.velocity.clampLength(angelMaxSpeed);
    }

    angel.pos = vec2(clamp(angel.pos.x, 0, 640), clamp(angel.pos.y, 0, 480));
  }

  const soulsToRemove = new Set();
  for (const soul of souls) {
    if (isOverlapping(death.pos, death.size, soul.pos, soul.size)) {
      soul.destroy();
      soulsToRemove.add(soul);

      clearAngelTargetSouls();

      score += 10;
    }

    for (const angel of angels) {
      if (isOverlapping(angel.pos, angel.size, soul.pos, soul.size)) {
        soul.destroy();
        soulsToRemove.add(soul);

        clearAngelTargetSouls();

        score -= 10;
      }

      if (isOverlapping(death.pos, death.size, angel.pos, angel.size)) {
        gameOver = true;

        death.velocity = vec2(0, 0);

        for (const angel of angels) {
          angel.velocity = vec2(0, 0);
        }

        for (const soul of souls) {
          soul.velocity = vec2(0, 0);
        }

        return;
      }
    }

    if (!isOverlapping(soul.pos, soul.size, cameraPos, vec2(640, 480))) {
      soul.destroy();
      soulsToRemove.add(soul);
    }
  }

  souls = souls.filter((it) => !soulsToRemove.has(it));

  if (death.velocity.length() < 1) {
    death.tileIndex = 2;
  } else {
    death.tileIndex = death.velocity.direction();
  }

  for (const angel of angels) {
    if (angel.velocity.length() < 1) {
      angel.tileIndex = 6;
    } else {
      angel.tileIndex = angel.velocity.direction() + 4;
    }
  }

  const soulAddInterval = 0.5 - (clamp(time, 0, 60) / 60) * 0.25;

  if (time - lastSoulAddedAt > soulAddInterval) {
    let position;

    const direction = randInt(0, 4);
    switch (direction) {
      case 0:
        position = vec2(randInt(0, 640 - 16), 0);
        break;
      case 1:
        position = vec2(640, randInt(0, 480 - 16));
        break;
      case 2:
        position = vec2(randInt(0, 640 - 16), 480);
        break;
      case 3:
        position = vec2(0, randInt(0, 480 - 16));
        break;
      default:
        console.error(`Wasn't expecting ${direction}`);
    }

    const speed = 2 + (clamp(time, 0, 60) / 60) * 3;

    souls.push(new SoulObject(position, direction, speed));

    lastSoulAddedAt = time;
  }

  if (time - lastAngelAddedAt > 10) {
    const angelPos = death.pos.add(vec2(200, 200));
    angels.push(new AngelObject(angelPos));

    lastAngelAddedAt = time;
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  if (gameOver) {
    drawTextScreen(`Game over.\nFinal score: ${score}`, vec2(600, 400), 12);
  } else {
    drawTextScreen(`Score: ${score}`, vec2(600, 400), 12);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  "tiles.png"
);
