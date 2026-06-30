const screens = {
  home: document.querySelector("#home"),
  briefing: document.querySelector("#briefing"),
  skins: document.querySelector("#skins"),
  game: document.querySelector("#game"),
};

const previewCanvas = document.querySelector("#preview-canvas");
const preview = previewCanvas.getContext("2d");
const agentDemoCanvas = document.querySelector("#agent-demo-canvas");
const agentDemo = agentDemoCanvas.getContext("2d");
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const ultimateEl = document.querySelector("#ultimate-status");
const hintEl = document.querySelector("#hint");
const healthFillEl = document.querySelector("#health-fill");
const healthValueEl = document.querySelector("#health-value");
const rescueTimeEl = document.querySelector("#rescue-time");
const rescueTimeBoxEl = document.querySelector(".rescue-time");
const resultOverlayEl = document.querySelector("#result-overlay");
const resultTitleEl = document.querySelector("#result-title");
const resultDetailEl = document.querySelector("#result-detail");
const resultKickerEl = document.querySelector("#result-kicker");
const mutationBannerEl = document.querySelector("#mutation-banner");
const modeLabelEl = document.querySelector("#mode-label");
const scoreLabelEl = document.querySelector("#score-label");
const scoreTargetEl = document.querySelector("#score-target");
const bossHudEl = document.querySelector("#boss-hud");
const bossHealthFillEl = document.querySelector("#boss-health-fill");
const bossHealthValueEl = document.querySelector("#boss-health-value");
const agentCardLabelEl = document.querySelector("#agent-card-label");
const skinStatusEl = document.querySelector("#skin-status");
const classicSkinCanvas = document.querySelector("#classic-skin-canvas");
const starSkinCanvas = document.querySelector("#star-skin-canvas");

const background = new Image();
background.src = "assets/city-ruins.png";

const MUTATION_TIME = 100;
const JUMP_CHARGE_TIME = 1.35;
const FLIP_DURATION = 0.52;
const FLIP_COOLDOWN = 0.66;
const MODES = {
  easy: {
    label: "简单",
    health: 13,
    duration: 150,
    target: 100,
    spawnStart: 0.48,
    spawnEnd: 1.1,
    mutation: false,
    hell: false,
    gunDamage: 1,
  },
  normal: {
    label: "普通",
    health: 10,
    duration: 180,
    target: 100,
    spawnStart: 0.3,
    spawnEnd: 1.4,
    mutation: true,
    hell: false,
    gunDamage: 1,
  },
  hard: {
    label: "困难",
    health: 7,
    duration: 240,
    target: 100,
    spawnStart: 0.52,
    spawnEnd: 1.85,
    mutation: true,
    hell: false,
    gunDamage: 1,
  },
  hell: {
    label: "地狱",
    health: 6,
    duration: 300,
    target: 50,
    spawnStart: 0.85,
    spawnEnd: 2.45,
    mutation: true,
    hell: true,
    gunDamage: 1.5,
  },
};
let selectedMode = "normal";
let activeMode = MODES.normal;
let selectedAgent = "long";
let activeAgent = "long";
let selectedSkin = "classic";
let activeSkin = "classic";
const keys = new Set();
const GAME_KEY_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyD",
  "KeyS",
  "KeyF",
  "KeyK",
  "KeyJ",
  "KeyL",
  "Space",
  "ArrowUp",
  "ArrowDown",
]);
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let running = false;
let gameEnded = false;
let lastTime = 0;
let score = 0;
let missionElapsed = 0;
let missionRemaining = activeMode.duration;
let bullets = [];
let rainBullets = [];
let enemies = [];
let particles = [];
let enemyTimer = 0;
let rainTimer = 0;
let rainSpawnTimer = 0;
let ultimateCooldown = 0;
let screenShake = 0;
let audioContext = null;
let masterGain = null;
let briefingMusicTimer = null;
let briefingMusicStep = 0;
let mutationActive = false;
let mutationBannerTimer = 0;
let heartbeatTimer = 0;
let breathingTimer = 0;
let musicTimer = 0;
let footstepTimer = 0;
let growlTimer = 1.5;
let enemyId = 0;
let bossMode = false;
let boss = null;
let bossProjectiles = [];
let bossIntroTimer = 0;
let craters = [];
let craterId = 0;
let noteProjectiles = [];
let chainEffects = [];
let swordSlashes = [];
let shurikenProjectiles = [];
let xinMarks = [];
let xinComboStep = 0;
let xinComboTimer = 0;
let xinAttackCooldown = 0;
let xinSwingTimer = 0;
let xinSwingStep = 0;
let xinShurikenDamage = 0.2;
let xinExecutionReady = false;
let xinUltimateWasActive = false;
let xinTeleportReturn = null;
let wolfClawEffects = [];
let wolfAttackTimer = 0;
let wolfAttackUltimate = false;
let voidProjectiles = [];
let blastEffects = [];
let firePatches = [];
let punchEffects = [];
let dongHand = 0;
let specialCharge = 0;
let specialChargeReady = false;
let specialCharging = false;
let dongPassiveActive = false;
let wolfPassiveTriggered = false;
let wolfVanishTimer = 0;
let wolfSlamTimer = 0;
let attackBonus = 0;
let quanComboStep = 0;
let quanComboTimer = 0;
let quanAttackCooldown = 0;
let quanPunchTimer = 0;
let quanPunchStep = 0;
const XIN_SWING_DURATION = 0.22;
const XIN_FLURRY_DURATION = 0.36;
const XIN_TELEPORT_HOLD = 0.18;
const XIN_RETURN_INVINCIBILITY = 1.5;

const player = {
  x: 90,
  y: 0,
  width: 44,
  height: 112,
  vx: 0,
  vy: 0,
  facing: 1,
  grounded: false,
  crouching: false,
  shootCooldown: 0,
  runTime: 0,
  health: 10,
  stunTimer: 0,
  damageCooldown: 0,
  invincibleTimer: 0,
  depth: 0.68,
  maxHealth: 10,
  inCrater: false,
  craterId: null,
  craterImmunity: 0,
  jumpCount: 0,
  jumpCharge: 0,
  chargeReadyAnnounced: false,
  flipTimer: 0,
  flipCooldown: 0,
  flipDirection: 0,
};

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function syncViewportHeight() {
  viewportWidth = Math.round(window.visualViewport?.width || window.innerWidth);
  viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight);
  document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
}

function resizeCanvas() {
  syncViewportHeight();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(viewportWidth * ratio);
  canvas.height = Math.round(viewportHeight * ratio);
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (running && player.grounded) {
    const crater = player.inCrater
      ? craters.find((item) => item.id === player.craterId)
      : null;
    player.y = laneY(player.depth) + (crater ? crater.sink : 0);
  }
}

function groundY() {
  return viewportHeight - Math.max(74, viewportHeight * 0.12);
}

function laneY(depth) {
  return groundY() - (1 - depth) * Math.min(145, viewportHeight * 0.2);
}

function depthScale(depth) {
  return 0.72 + depth * 0.34;
}

function drawDragonPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const skin = running ? activeSkin : selectedSkin;
  if (skin === "star") {
    drawStarDragonPlayer(context, x, feetY, scale, facing, pose);
    return;
  }
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 12) : 0;
  const jump = pose === "jump";
  const crouch = pose === "crouch";
  const down = pose === "down";
  const showcase = !running && context !== agentDemo;
  const bodyBob = showcase
    ? 0
    : pose === "run"
      ? Math.abs(run) * 3.5
      : Math.sin(missionElapsed * 3.2) * 0.8;
  const bodyLean = showcase ? 0 : pose === "run" ? run * 0.035 : 0;
  context.save();
  context.translate(x, feetY + bodyBob);
  context.rotate(bodyLean);
  context.scale(scale * 0.78, scale * 1.22);
  if (crouch) context.scale(1, 0.72);
  if (down) {
    context.translate(0, -5);
    context.rotate(dir * Math.PI / 2);
  }
  context.strokeStyle = "#111";
  context.fillStyle = "#111";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.lineJoin = "round";

  // Head and helmet.
  context.beginPath();
  context.arc(0, -106, 15, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#252b31";
  context.beginPath();
  context.arc(0, -109, 19, Math.PI, Math.PI * 2);
  context.lineTo(19, -105);
  context.lineTo(-19, -105);
  context.closePath();
  context.fill();
  context.fillRect(14 * dir, -110, 12 * dir, 5);

  // Armored body.
  context.fillStyle = "#3c4650";
  context.beginPath();
  context.moveTo(-12, -91);
  context.lineTo(12, -91);
  context.lineTo(10, -43);
  context.lineTo(-10, -43);
  context.closePath();
  context.fill();
  context.strokeStyle = "#111";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#111";
  context.beginPath();
  context.moveTo(0, -90);
  context.lineTo(0, -41);
  context.stroke();

  context.beginPath();
  context.moveTo(0, -76);
  context.lineTo(21 * dir, -63);
  context.lineTo(37 * dir, -72);
  context.moveTo(0, -69);
  context.lineTo(22 * dir, -55);
  context.lineTo(38 * dir, -61);
  context.stroke();

  drawGun(context, 37 * dir, -72, dir);
  drawGun(context, 38 * dir, -61, dir);

  context.beginPath();
  if (crouch) {
    context.moveTo(0, -43);
    context.lineTo(-16, -22);
    context.lineTo(-32, -20);
    context.moveTo(0, -43);
    context.lineTo(18, -25);
    context.lineTo(34, -15);
  } else if (jump) {
    context.moveTo(0, -43);
    context.lineTo(-17, -21);
    context.lineTo(-4, 0);
    context.moveTo(0, -43);
    context.lineTo(18, -25);
    context.lineTo(29, -7);
  } else {
    context.moveTo(0, -43);
    context.lineTo(-14 + run * 8, -22);
    context.lineTo(-24 + run * 15, 0);
    context.moveTo(0, -43);
    context.lineTo(14 - run * 8, -22);
    context.lineTo(24 - run * 15, 0);
  }
  context.stroke();
  context.restore();
}

function drawStarDragonPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 11) : 0;
  const jump = pose === "jump";
  const crouch = pose === "crouch";
  const down = pose === "down";
  const showcase = !running && context !== agentDemo;
  const bodyBob = showcase
    ? 0
    : pose === "run"
      ? Math.abs(run) * 3.5
      : Math.sin(missionElapsed * 3.2) * 0.8;
  const bodyLean = showcase ? 0 : pose === "run" ? run * 0.035 : 0;
  context.save();
  context.translate(x, feetY + bodyBob);
  context.rotate(bodyLean);
  context.scale(scale * 0.86, scale * 1.2);
  if (crouch) context.scale(1, 0.76);
  if (down) {
    context.translate(0, -8);
    context.rotate(dir * Math.PI / 2);
  }
  context.lineJoin = "round";
  context.lineCap = "round";
  context.strokeStyle = "#070707";
  context.lineWidth = 3;

  // Thick, outward armored helmet with sharp mechanical facets.
  const visor = context.createLinearGradient(-14, -120, 14, -94);
  visor.addColorStop(0, "#111820");
  visor.addColorStop(0.5, "#4c6170");
  visor.addColorStop(1, "#0a0c0f");
  context.fillStyle = "#151515";
  context.strokeStyle = "#555b61";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-26, -119);
  context.lineTo(-19, -134);
  context.lineTo(-7, -140);
  context.lineTo(8, -139);
  context.lineTo(21, -132);
  context.lineTo(28, -117);
  context.lineTo(22, -94);
  context.lineTo(12, -87);
  context.lineTo(-13, -87);
  context.lineTo(-23, -95);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#292d31";
  context.beginPath();
  context.moveTo(-26, -119);
  context.lineTo(-19, -134);
  context.lineTo(-14, -111);
  context.lineTo(-23, -95);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(28, -117);
  context.lineTo(21, -132);
  context.lineTo(15, -110);
  context.lineTo(22, -94);
  context.closePath();
  context.fill();
  context.fillStyle = visor;
  context.beginPath();
  context.moveTo(-15, -120);
  context.lineTo(-9, -126);
  context.lineTo(10, -125);
  context.lineTo(17, -118);
  context.lineTo(12, -101);
  context.lineTo(-12, -101);
  context.closePath();
  context.fill();
  context.strokeStyle = "#555b61";
  context.lineWidth = 2.5;
  context.stroke();
  context.fillStyle = "#3f4449";
  context.beginPath();
  context.moveTo(-30, -129);
  context.lineTo(-21, -134);
  context.lineTo(-18, -104);
  context.lineTo(-28, -101);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(31, -127);
  context.lineTo(22, -133);
  context.lineTo(18, -104);
  context.lineTo(28, -100);
  context.closePath();
  context.fill();
  context.fillStyle = "#080808";
  context.fillRect(-27, -142, 7, 22);
  context.fillRect(20, -141, 7, 22);

  // Exposed narrow neck separates the helmet from the slim body armor.
  context.fillStyle = "#101010";
  context.strokeStyle = "#353a3e";
  context.lineWidth = 3;
  context.beginPath();
  context.roundRect(-5, -94, 10, 18, 3);
  context.fill();
  context.stroke();

  // Angular black and dark-gray slim armor.
  context.fillStyle = "#171717";
  context.strokeStyle = "#4b5055";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-16, -76);
  context.lineTo(-11, -82);
  context.lineTo(11, -82);
  context.lineTo(16, -76);
  context.lineTo(11, -38);
  context.lineTo(-11, -38);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#2b2f33";
  context.beginPath();
  context.moveTo(0, -78);
  context.lineTo(9, -63);
  context.lineTo(0, -46);
  context.lineTo(-9, -63);
  context.closePath();
  context.fill();
  context.stroke();

  const recoil = player.shootCooldown > 0 ? 6 : 0;
  const armSwing = showcase ? 0 : pose === "run" ? run * 7 : Math.sin(missionElapsed * 3.2) * 1.2;
  context.strokeStyle = "#171717";
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(-13, -72);
  context.lineTo((-43 - recoil) * dir, -58 + armSwing);
  context.moveTo(13, -72);
  context.lineTo((44 + recoil) * dir, -57 - armSwing);
  context.stroke();
  context.fillStyle = "#0c0c0c";
  context.strokeStyle = "#555b61";
  context.lineWidth = 3;
  context.save();
  context.translate((42 + recoil) * dir, -58 - armSwing);
  context.scale(dir, 1);
  context.beginPath();
  context.roundRect(-4, -11, 56, 22, 5);
  context.fill();
  context.stroke();
  context.fillStyle = "#3f4449";
  context.fillRect(7, -8, 19, 16);
  context.fillStyle = "#712fc2";
  context.shadowColor = "#ab57ff";
  context.shadowBlur = 13;
  context.beginPath();
  context.arc(17, 0, 6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#9b4ce6";
  context.fillRect(38, -7, 17, 14);
  context.fillStyle = "#d7a5ff";
  context.beginPath();
  context.ellipse(53, 0, 5, 8, 0, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.restore();

  context.strokeStyle = "#111";
  context.lineWidth = 7;
  context.beginPath();
  if (showcase) {
    context.moveTo(-6, -38);
    context.lineTo(-7, -19);
    context.lineTo(-8, 0);
    context.moveTo(6, -38);
    context.lineTo(7, -19);
    context.lineTo(8, 0);
  } else if (jump) {
    context.moveTo(-6, -38);
    context.lineTo(-16, -18);
    context.lineTo(-10, 0);
    context.moveTo(6, -38);
    context.lineTo(17, -20);
    context.lineTo(28, -4);
  } else {
    context.moveTo(-6, -38);
    context.lineTo(-14 + run * 7, -19);
    context.lineTo(-14 + run * 12, 0);
    context.moveTo(6, -38);
    context.lineTo(14 - run * 7, -19);
    context.lineTo(14 - run * 12, 0);
  }
  context.stroke();
  context.strokeStyle = "#4b5055";
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function drawGun(context, x, y, dir) {
  context.save();
  context.translate(x, y);
  context.scale(dir, 1);
  context.fillRect(0, -4, 22, 8);
  context.fillRect(6, 3, 7, 10);
  context.restore();
}

function drawLeiPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 12) : 0;
  const jump = pose === "jump";
  const crouch = pose === "crouch";
  const down = pose === "down";
  const floating = rainTimer > 0 && activeAgent === "lei";
  context.save();
  context.translate(x, feetY - (floating ? 34 + Math.sin(missionElapsed * 5) * 7 : 0));
  context.scale(scale * 0.87, scale * 1.12);
  if (crouch) context.scale(1, 0.72);
  if (down) {
    context.translate(0, -5);
    context.rotate(dir * Math.PI / 2);
  }
  context.strokeStyle = "#15121a";
  context.fillStyle = "#15121a";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.lineJoin = "round";

  // Head, black sunglasses and gray headphones.
  context.beginPath();
  context.arc(0, -92, 16, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#111";
  context.fillRect(-17, -98, 14, 8);
  context.fillRect(3, -98, 14, 8);
  context.fillRect(-3, -96, 6, 3);
  context.strokeStyle = "#777b84";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(0, -94, 22, Math.PI, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#8b8f98";
  context.fillRect(-23, -99, 7, 17);
  context.fillRect(16, -99, 7, 17);

  // Purple jacket.
  context.fillStyle = "#512079";
  context.strokeStyle = "#161019";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-15, -76);
  context.lineTo(15, -76);
  context.lineTo(14, -39);
  context.lineTo(-14, -39);
  context.closePath();
  context.fill();
  context.stroke();

  // Arms holding the guitar.
  context.strokeStyle = "#15121a";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(0, -65);
  context.lineTo(19 * dir, -55);
  context.lineTo(31 * dir, -61);
  context.moveTo(0, -57);
  context.lineTo(20 * dir, -43);
  context.lineTo(33 * dir, -48);
  context.stroke();
  drawGuitar(context, 21 * dir, -50, dir);

  context.beginPath();
  if (crouch) {
    context.moveTo(0, -37);
    context.lineTo(-18, -20);
    context.lineTo(-32, -20);
    context.moveTo(0, -37);
    context.lineTo(20, -24);
    context.lineTo(34, -15);
  } else if (jump || floating) {
    context.moveTo(0, -37);
    context.lineTo(-20, -17);
    context.lineTo(-8, -2);
    context.moveTo(0, -37);
    context.lineTo(21, -20);
    context.lineTo(31, -7);
  } else {
    context.moveTo(0, -37);
    context.lineTo(-17 + run * 9, -17);
    context.lineTo(-24 + run * 15, 0);
    context.moveTo(0, -37);
    context.lineTo(17 - run * 9, -17);
    context.lineTo(24 - run * 15, 0);
  }
  context.stroke();

  // Purple Nike-style sports shoes with a white swoosh.
  drawPurpleShoe(context, crouch ? -32 : -24 + run * 15, crouch ? -20 : 0, -1);
  drawPurpleShoe(context, crouch ? 34 : 24 - run * 15, crouch ? -15 : 0, 1);
  context.restore();
}

function drawGuitar(context, x, y, dir) {
  context.save();
  context.translate(x, y);
  context.scale(dir, 1);
  context.rotate(-0.18);
  context.fillStyle = "#6e25a8";
  context.strokeStyle = "#21102d";
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(0, 0, 17, 24, -0.15, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#3b145e";
  context.fillRect(10, -5, 39, 9);
  context.fillStyle = "#d05dff";
  context.beginPath();
  context.arc(1, 1, 6, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPurpleShoe(context, x, y, dir) {
  context.save();
  context.translate(x, y);
  context.scale(dir, 1);
  context.fillStyle = "#6b26a6";
  context.strokeStyle = "#1c1024";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(-9, -5, 22, 10, 4);
  context.fill();
  context.stroke();
  context.strokeStyle = "#fff";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-3, 1);
  context.quadraticCurveTo(2, 5, 10, -1);
  context.stroke();
  context.restore();
}

function drawXinPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 12) : 0;
  const jump = pose === "jump";
  const crouch = pose === "crouch";
  const down = pose === "down";
  const ultimateActive = running && activeAgent === "xin" && rainTimer > 0;
  const swingDuration = xinSwingStep === 4 ? XIN_FLURRY_DURATION : XIN_SWING_DURATION;
  const swingActive = xinSwingTimer > 0;
  const swingProgress = swingActive
    ? Math.max(0, Math.min(1, 1 - xinSwingTimer / swingDuration))
    : 0;
  const bladeCycle = xinSwingStep === 4
    ? Math.min(0.999, (swingProgress * 4) % 1)
    : swingProgress;
  const liftEnd = 0.3;
  const strikeStart = 0.42;
  const liftProgress = swingActive
    ? bladeCycle < liftEnd
      ? bladeCycle / liftEnd
      : bladeCycle < strikeStart
        ? 1
        : Math.max(0, 1 - (bladeCycle - strikeStart) / (1 - strikeStart))
    : 0;
  const strikeProgress = swingActive && bladeCycle >= strikeStart
    ? (bladeCycle - strikeStart) / (1 - strikeStart)
    : 0;
  const strikeDrive = Math.sin(strikeProgress * Math.PI) * 4;
  context.save();
  context.translate(x, feetY);
  context.scale(scale * 0.84, scale * 1.14);
  context.translate(strikeDrive * dir, strikeDrive * 0.65);
  if (crouch) context.scale(1, 0.72);
  if (down) {
    context.translate(0, -7);
    context.rotate(dir * Math.PI / 2);
  }
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#100d14";
  context.fillStyle = "#100d14";
  context.lineWidth = 5;

  // Ragged black cape, trailing behind Xin and lifting during jumps.
  const capeWave = Math.sin((running ? missionElapsed : 0) * 9) * 5;
  const capeLift = jump ? 31 + capeWave : Math.abs(run) * 9 + capeWave * 0.35;
  context.fillStyle = "rgba(8, 7, 10, 0.94)";
  context.strokeStyle = "#25152f";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-9 * dir, -92);
  context.lineTo(-20 * dir, -82);
  context.lineTo((-40 - capeLift * 0.55) * dir, -69 - capeLift * 0.42);
  context.lineTo((-34 - capeLift) * dir, -45 - capeLift * 0.72);
  context.lineTo((-18 - capeLift * 0.45) * dir, -53 - capeLift * 0.36);
  context.lineTo(-7 * dir, -43);
  context.lineTo(-2 * dir, -82);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "#070609";
  context.beginPath();
  context.moveTo((-34 - capeLift) * dir, -45 - capeLift * 0.72);
  context.lineTo((-25 - capeLift * 0.68) * dir, -51 - capeLift * 0.52);
  context.lineTo((-18 - capeLift * 0.45) * dir, -53 - capeLift * 0.36);
  context.stroke();

  // Tall, narrow assassin silhouette.
  context.beginPath();
  context.arc(0, -112, 15, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#08070a";
  context.beginPath();
  context.roundRect(-18, -118, 36, 17, 7);
  context.fill();
  context.strokeStyle = "#6f2c9a";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-12, -108);
  context.lineTo(12, -108);
  context.stroke();

  context.fillStyle = "#1a1420";
  context.strokeStyle = "#0b090d";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-11, -94);
  context.lineTo(12, -94);
  context.lineTo(9, -43);
  context.lineTo(-9, -43);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#372044";
  context.fillRect(-10, -68, 20, 7);

  const raisedAngle = -1.5;
  const restingAngle = -0.22;
  const strikeEndAngle = xinSwingStep === 3
    ? 1.14
    : xinSwingStep === 2
      ? 0.72
      : xinSwingStep === 4 && Math.floor(swingProgress * 4) % 2
        ? 0.96
        : 0.78;
  const swordAngle = !swingActive
    ? restingAngle
    : bladeCycle < liftEnd
      ? restingAngle + (raisedAngle - restingAngle) * (1 - Math.pow(1 - liftProgress, 2))
      : bladeCycle < strikeStart
        ? raisedAngle
      : raisedAngle + (strikeEndAngle - raisedAngle) * (1 - Math.pow(1 - strikeProgress, 3));
  const handLift = liftProgress * 18;
  context.strokeStyle = "#100d14";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(0, -83);
  context.lineTo(20 * dir, -69 - handLift);
  context.moveTo(0, -76);
  context.lineTo(17 * dir, -58 - handLift * 0.82);
  context.stroke();

  if (!ultimateActive) {
    context.save();
    context.translate(18 * dir, -64 - handLift);
    context.scale(dir, 1);
    context.rotate(swordAngle);
    context.strokeStyle = "#17131d";
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(-5, 0);
    context.lineTo(61, 0);
    context.stroke();
    context.strokeStyle = "#7e35ad";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(5, -2);
    context.lineTo(60, -2);
    context.stroke();
    context.fillStyle = "#0a080d";
    context.fillRect(-13, -4, 18, 8);
    context.fillStyle = "#5b267e";
    context.fillRect(-4, -10, 4, 20);
    context.restore();
  } else {
    context.fillStyle = "#6f2ca0";
    context.shadowColor = "#a646e2";
    context.shadowBlur = 10;
    for (let i = 0; i < 4; i += 1) {
      const angle = missionElapsed * 3.8 + i * Math.PI / 2;
      const sx = Math.cos(angle) * 34;
      const sy = -74 + Math.sin(angle) * 18;
      context.save();
      context.translate(sx, sy);
      context.rotate(angle);
      context.beginPath();
      context.moveTo(0, -7);
      context.lineTo(5, 0);
      context.lineTo(0, 7);
      context.lineTo(-5, 0);
      context.closePath();
      context.fill();
      context.restore();
    }
    context.shadowBlur = 0;
  }

  context.strokeStyle = "#100d14";
  context.lineWidth = 5;
  context.beginPath();
  if (crouch) {
    context.moveTo(0, -43);
    context.lineTo(-16, -20);
    context.lineTo(-30, -19);
    context.moveTo(0, -43);
    context.lineTo(18, -24);
    context.lineTo(32, -14);
  } else if (jump) {
    context.moveTo(0, -43);
    context.lineTo(-18, -20);
    context.lineTo(-6, -3);
    context.moveTo(0, -43);
    context.lineTo(18, -25);
    context.lineTo(30, -10);
  } else {
    context.moveTo(0, -43);
    context.lineTo(-13 + run * 8, -20);
    context.lineTo(-20 + run * 13, 0);
    context.moveTo(0, -43);
    context.lineTo(13 - run * 8, -20);
    context.lineTo(20 - run * 13, 0);
  }
  context.stroke();
  context.restore();
}

function drawWolfPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 13) : 0;
  const jump = pose === "jump";
  const crouch = pose === "crouch";
  const down = pose === "down";
  const ultimateActive = running && activeAgent === "wolf" && rainTimer > 0;
  const attackDuration = wolfAttackUltimate ? 0.1 : 0.22;
  const attackProgress = wolfAttackTimer > 0
    ? Math.max(0, Math.min(1, 1 - wolfAttackTimer / attackDuration))
    : 0;
  const swipe = Math.sin(attackProgress * Math.PI);
  const lean = wolfAttackTimer > 0 ? 0.23 + swipe * 0.18 : 0.15;

  context.save();
  context.translate(x, feetY);
  context.scale(scale * 0.91, scale * 1.08);
  if (crouch) context.scale(1, 0.76);
  if (down) {
    context.translate(0, -8);
    context.rotate(dir * Math.PI / 2);
  }
  context.rotate(lean * dir);
  context.lineCap = "round";
  context.lineJoin = "round";

  // Wolf head, ears and hunched neck.
  context.strokeStyle = "#1b1718";
  context.fillStyle = "#353033";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-14, -108);
  context.lineTo(-10, -132);
  context.lineTo(1, -113);
  context.lineTo(12, -132);
  context.lineTo(16, -107);
  context.closePath();
  context.fill();
  context.stroke();
  context.beginPath();
  context.ellipse(5 * dir, -105, 18, 15, 0.12 * dir, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#d32f2f";
  context.beginPath();
  context.arc(10 * dir, -109, 3, 0, Math.PI * 2);
  context.fill();

  // Ragged gray long robe over a bent back.
  context.fillStyle = "#696568";
  context.strokeStyle = "#282326";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-18, -94);
  context.quadraticCurveTo(-32 * dir, -85, -25 * dir, -68);
  context.lineTo(22, -78);
  context.lineTo(29, -23);
  context.lineTo(15, -31);
  context.lineTo(5, -18);
  context.lineTo(-7, -29);
  context.lineTo(-23, -19);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "#393438";
  context.beginPath();
  context.moveTo(-18, -75);
  context.lineTo(17, -63);
  context.moveTo(-14, -50);
  context.lineTo(20, -41);
  context.stroke();

  // Arms: right mechanical arm, both ending in wolf claws.
  const frontSwing = wolfAttackTimer > 0 ? 33 + swipe * 48 : 22;
  const backSwing = wolfAttackTimer > 0 && !ultimateActive ? 25 + swipe * 38 : 15;
  context.strokeStyle = "#252126";
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(3 * dir, -83);
  context.lineTo((25 + frontSwing * 0.25) * dir, -66 - swipe * 8);
  context.lineTo((42 + frontSwing) * dir, -52 + swipe * 23);
  if (!ultimateActive) {
    context.moveTo(-7 * dir, -82);
    context.lineTo((-26 - backSwing * 0.2) * dir, -65 + swipe * 4);
    context.lineTo((-43 - backSwing) * dir, -47 + swipe * 18);
  }
  context.stroke();

  // Mechanical plating on the right arm.
  context.strokeStyle = "#8b9097";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(20 * dir, -70 - swipe * 7);
  context.lineTo((38 + frontSwing * 0.7) * dir, -55 + swipe * 13);
  context.stroke();
  context.strokeStyle = "#34383e";
  context.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    context.beginPath();
    context.arc((28 + i * 11 + frontSwing * 0.35) * dir, -62 + swipe * (i * 5), 5, 0, Math.PI * 2);
    context.stroke();
  }

  drawWolfClaw(
    context,
    (45 + frontSwing) * dir,
    -51 + swipe * 23,
    dir,
    true
  );
  if (!ultimateActive) {
    drawWolfClaw(
      context,
      (-46 - backSwing) * dir,
      -46 + swipe * 18,
      -dir,
      false
    );
  }

  // Bent digitigrade wolf legs.
  context.strokeStyle = "#242024";
  context.lineWidth = 7;
  context.beginPath();
  if (jump) {
    context.moveTo(-7, -25);
    context.lineTo(-24, -11);
    context.lineTo(-12, 0);
    context.moveTo(9, -24);
    context.lineTo(25, -13);
    context.lineTo(34, -3);
  } else {
    context.moveTo(-7, -25);
    context.lineTo(-20 + run * 8, -10);
    context.lineTo(-13 + run * 12, 0);
    context.moveTo(9, -24);
    context.lineTo(23 - run * 8, -10);
    context.lineTo(32 - run * 12, 0);
  }
  context.stroke();
  context.restore();
}

function drawWolfClaw(context, x, y, dir, mechanical) {
  context.save();
  context.translate(x, y);
  context.scale(dir, 1);
  context.fillStyle = mechanical ? "#555b63" : "#363033";
  context.strokeStyle = "#1a1719";
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(0, 0, 13, 10, 0.15, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = mechanical ? "#d2d5da" : "#e7d8cc";
  context.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    context.beginPath();
    context.moveTo(8, i * 5);
    context.lineTo(29, i * 8 - 2);
    context.stroke();
  }
  context.restore();
}

function drawDongPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 12) : 0;
  const jump = pose === "jump" || dongPassiveActive;
  context.save();
  const airborne = running && activeAgent === "dong" && dongPassiveActive ? 115 + Math.sin(missionElapsed * 4) * 9 : 0;
  context.translate(x, feetY - airborne);
  context.scale(scale * 0.83, scale * 1.17);
  context.strokeStyle = "#120d18";
  context.fillStyle = "#120d18";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.arc(0, -108, 15, 0, Math.PI * 2);
  context.stroke();
  context.fillRect(-17, -113, 14, 8);
  context.fillRect(3, -113, 14, 8);
  context.fillRect(-3, -111, 6, 3);
  context.beginPath();
  context.moveTo(0, -92);
  context.lineTo(0, -43);
  const handPush = player.shootCooldown > 0 ? 18 : 0;
  context.moveTo(0, -80);
  context.lineTo((25 + handPush) * dir, -67);
  context.moveTo(0, -72);
  context.lineTo((-25 + handPush * 0.35) * dir, -58);
  context.stroke();
  for (const [hx, hy] of [[(27 + handPush) * dir, -67], [(-27 + handPush * 0.35) * dir, -58]]) {
    context.fillStyle = "#000";
    context.shadowColor = "#a74fff";
    context.shadowBlur = 14;
    context.beginPath();
    context.arc(hx, hy, 7, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;
  context.strokeStyle = "#120d18";
  context.beginPath();
  if (jump) {
    context.moveTo(0, -43);
    context.lineTo(-20, -19);
    context.lineTo(-8, -2);
    context.moveTo(0, -43);
    context.lineTo(20, -21);
    context.lineTo(30, -7);
  } else {
    context.moveTo(0, -43);
    context.lineTo(-15 + run * 8, -20);
    context.lineTo(-21 + run * 13, 0);
    context.moveTo(0, -43);
    context.lineTo(15 - run * 8, -20);
    context.lineTo(21 - run * 13, 0);
  }
  context.stroke();
  context.restore();
}

function drawQuanPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const dir = facing;
  const run = pose === "run" ? Math.sin(player.runTime * 12) : 0;
  const breathing = pose === "idle" ? Math.sin(missionElapsed * 6) * 3 : 0;
  const punch = quanPunchTimer > 0 ? Math.sin((1 - quanPunchTimer / 0.25) * Math.PI) : 0;
  context.save();
  context.translate(x, feetY + breathing);
  context.scale(scale * 0.86, scale * 1.15);
  context.rotate(pose === "idle" ? 0.08 * dir : 0);
  context.strokeStyle = "#18110d";
  context.fillStyle = "#18110d";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.arc(0, -108, 15, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#d7a919";
  context.strokeStyle = "#14100a";
  context.beginPath();
  context.moveTo(-17, -120);
  context.lineTo(-10, -138);
  context.lineTo(0, -124);
  context.lineTo(10, -139);
  context.lineTo(17, -120);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "#18110d";
  context.beginPath();
  context.moveTo(0, -92);
  context.lineTo(0, -43);
  context.moveTo(0, -80);
  context.lineTo((-27 + (quanPunchStep % 2 ? 0 : punch * 15)) * dir, -63);
  context.moveTo(0, -74);
  context.lineTo((28 + punch * 48) * dir, -60);
  context.stroke();
  drawFireGlove(context, (-29 + (quanPunchStep % 2 ? 0 : punch * 15)) * dir, -63, scale);
  drawFireGlove(context, (30 + punch * 48) * dir, -60, scale);
  context.fillStyle = "#b92718";
  context.fillRect(-17, -47, 34, 19);
  context.strokeStyle = "#18110d";
  context.beginPath();
  context.moveTo(-8, -28);
  context.lineTo(-19 + run * 10, 0);
  context.moveTo(8, -28);
  context.lineTo(19 - run * 10, 0);
  context.stroke();
  context.restore();
}

function drawFireGlove(context, x, y) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#d72c1d";
  context.strokeStyle = "#651006";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, 12, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Flames grow directly from the glove's knuckles instead of floating above it.
  for (let i = 0; i < 3; i += 1) {
    const flameX = -7 + i * 7;
    const flameHeight = 13 + Math.sin(missionElapsed * 9 + i) * 3;
    context.fillStyle = "#f04418";
    context.beginPath();
    context.moveTo(flameX - 5, 3);
    context.quadraticCurveTo(flameX - 4, -7, flameX, -flameHeight);
    context.quadraticCurveTo(flameX + 6, -5, flameX + 5, 3);
    context.fill();
    context.fillStyle = "#ffc52b";
    context.beginPath();
    context.moveTo(flameX - 2, 2);
    context.quadraticCurveTo(flameX - 1, -4, flameX + 1, -flameHeight * 0.62);
    context.quadraticCurveTo(flameX + 4, -3, flameX + 3, 2);
    context.fill();
  }

  context.strokeStyle = "#ff8a1e";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, 9, Math.PI * 1.08, Math.PI * 1.92);
  context.stroke();
  context.restore();
}

function drawPlayer(context, x, feetY, scale, facing, pose = "idle") {
  const agent = running ? activeAgent : selectedAgent;
  if (agent === "lei") {
    drawLeiPlayer(context, x, feetY, scale, facing, pose);
  } else if (agent === "xin") {
    drawXinPlayer(context, x, feetY, scale, facing, pose);
  } else if (agent === "wolf") {
    drawWolfPlayer(context, x, feetY, scale, facing, pose);
  } else if (agent === "dong") {
    drawDongPlayer(context, x, feetY, scale, facing, pose);
  } else if (agent === "quan") {
    drawQuanPlayer(context, x, feetY, scale, facing, pose);
  } else {
    drawDragonPlayer(context, x, feetY, scale, facing, pose);
  }
}

function drawPreview() {
  preview.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  const gradient = preview.createRadialGradient(110, 95, 15, 110, 105, 115);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(1, "#d7d7d7");
  preview.fillStyle = gradient;
  preview.fillRect(0, 0, 220, 220);
  preview.strokeStyle = "#bbb";
  preview.lineWidth = 1;
  for (let i = 20; i < 220; i += 20) {
    preview.beginPath();
    preview.moveTo(i, 0);
    preview.lineTo(i, 220);
    preview.stroke();
    preview.beginPath();
    preview.moveTo(0, i);
    preview.lineTo(220, i);
    preview.stroke();
  }
  const starShowcase = selectedAgent === "long" && selectedSkin === "star";
  drawPlayer(
    preview,
    starShowcase ? 84 : 100,
    starShowcase ? 207 : 184,
    starShowcase ? 1.06 : 1.25,
    1,
    "idle"
  );
}

function drawSkinPreviews() {
  if (!classicSkinCanvas || !starSkinCanvas) return;
  const classic = classicSkinCanvas.getContext("2d");
  const star = starSkinCanvas.getContext("2d");
  for (const context of [classic, star]) {
    context.clearRect(0, 0, 260, 270);
    const glow = context.createRadialGradient(130, 128, 10, 130, 140, 150);
    glow.addColorStop(0, "#3b3b3b");
    glow.addColorStop(1, "#080808");
    context.fillStyle = glow;
    context.fillRect(0, 0, 260, 270);
  }
  const savedSkin = selectedSkin;
  selectedSkin = "classic";
  drawDragonPlayer(classic, 130, 238, 1.5, 1, "idle");
  selectedSkin = "star";
  drawDragonPlayer(star, 104, 244, 1.24, 1, "idle");
  selectedSkin = savedSkin;
}

function drawDemoMonster(context, x, feetY, scale, tall, flash) {
  context.save();
  context.translate(x, feetY);
  context.scale(scale, scale);
  context.globalAlpha = flash ? 0.58 : 0.84;
  context.strokeStyle = flash ? "#e32636" : "#282828";
  context.fillStyle = tall ? "#696969" : "#777";
  context.lineWidth = tall ? 7 : 5;
  context.lineCap = "round";

  const headY = tall ? -70 : -43;
  const headR = tall ? 16 : 11;
  context.beginPath();
  context.arc(0, headY, headR, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#8c8278";
  context.fill();

  context.fillStyle = tall ? "#66605c" : "#77716e";
  if (tall) {
    context.beginPath();
    context.ellipse(0, -39, 24, 31, 0, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillRect(-11, -31, 22, 22);
  }
  context.strokeStyle = flash ? "#e32636" : "#282828";
  context.beginPath();
  context.moveTo(0, tall ? -59 : -31);
  context.lineTo(-19, tall ? -35 : -18);
  context.moveTo(0, tall ? -59 : -31);
  context.lineTo(19, tall ? -35 : -18);
  context.moveTo(-7, tall ? -13 : -9);
  context.lineTo(-14, 0);
  context.moveTo(7, tall ? -13 : -9);
  context.lineTo(14, 0);
  context.stroke();

  context.strokeStyle = "#b9aea4";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-15, tall ? -48 : -26);
  context.lineTo(11, tall ? -32 : -16);
  context.moveTo(-9, tall ? -26 : -14);
  context.lineTo(16, tall ? -43 : -23);
  context.stroke();
  context.restore();
}

function drawDemoLightning(context, x1, y1, x2, y2, strength) {
  if (strength <= 0) return;
  context.save();
  context.globalAlpha = Math.min(1, strength);
  context.strokeStyle = "#f031a8";
  context.shadowColor = "#a51cff";
  context.shadowBlur = 10;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x1, y1);
  const segments = 7;
  for (let i = 1; i < segments; i += 1) {
    const p = i / segments;
    const x = x1 + (x2 - x1) * p;
    const y = y1 + (y2 - y1) * p + Math.sin(i * 7.4) * 7;
    context.lineTo(x, y);
  }
  context.lineTo(x2, y2);
  context.stroke();
  context.restore();
}

function drawDemoScene(time) {
  const context = agentDemo;
  const width = agentDemoCanvas.width;
  const height = agentDemoCanvas.height;
  const cycle = (time / 1000) % 5.2;
  const ground = 124;
  context.clearRect(0, 0, width, height);

  const wash = context.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, "#f8f8f8");
  wash.addColorStop(1, "#d9d9d9");
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.16;
  context.fillStyle = "#202020";
  [180, 226, 275, 324, 377, 430, 486, 542, 598, 652].forEach((x, index) => {
    const buildingHeight = 28 + (index % 4) * 11;
    context.fillRect(x, ground - buildingHeight, 45, buildingHeight);
    if (index % 3 === 0) context.clearRect(x + 25, ground - buildingHeight, 15, 14);
  });
  context.globalAlpha = 1;
  context.strokeStyle = "rgba(25, 25, 25, 0.35)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, ground);
  context.lineTo(width, ground);
  context.stroke();

  const isLei = selectedAgent === "lei";
  const isXin = selectedAgent === "xin";
  const isWolf = selectedAgent === "wolf";
  const isDong = selectedAgent === "dong";
  const isQuan = selectedAgent === "quan";
  const heroY = isLei && cycle > 3.1 ? ground - 12 - Math.sin(cycle * 4) * 4 : ground;
  if (isLei) drawLeiPlayer(context, 82, heroY, 0.62, 1, "idle");
  else if (isXin) drawXinPlayer(context, 82, ground, 0.62, 1, "idle");
  else if (isWolf) drawWolfPlayer(context, 82, ground, 0.62, 1, "idle");
  else if (isDong) drawDongPlayer(context, 82, ground, 0.62, 1, "idle");
  else if (isQuan) drawQuanPlayer(context, 82, ground, 0.62, 1, "idle");
  else drawDragonPlayer(context, 82, ground, 0.62, 1, "idle");

  const targets = [
    { x: 418, tall: false },
    { x: 512, tall: true },
    { x: 610, tall: false },
  ];

  if (isLei) {
    const noteStart = 0.45;
    const noteTravel = 1.55;
    const noteP = Math.max(0, Math.min(1, (cycle - noteStart) / noteTravel));
    const chain1 = Math.max(0, 1 - Math.abs(cycle - 2.22) / 0.42);
    const chain2 = Math.max(0, 1 - Math.abs(cycle - 2.65) / 0.42);
    targets.forEach((target, index) => {
      const flash = index === 0
        ? cycle > 1.85 && cycle < 2.45
        : index === 1
          ? chain1 > 0.22
          : chain2 > 0.22;
      drawDemoMonster(context, target.x, ground, target.tall ? 0.82 : 0.88, target.tall, flash);
    });

    if (cycle >= noteStart && cycle <= noteStart + noteTravel) {
      const x = 128 + (targets[0].x - 128) * noteP;
      const y = 86 - Math.sin(noteP * Math.PI) * 33;
      context.save();
      context.translate(x, y);
      context.rotate(noteP * 0.8);
      context.fillStyle = "#8f2ee7";
      context.shadowColor = "#e32a9a";
      context.shadowBlur = 12;
      context.font = "bold 28px sans-serif";
      context.fillText("♪", -9, 9);
      context.restore();
    }
    drawDemoLightning(context, targets[0].x, 88, targets[1].x, 70, chain1);
    drawDemoLightning(context, targets[1].x, 70, targets[2].x, 88, chain2);
  } else if (isXin) {
    const slashPulse = Math.max(0, 1 - Math.abs(((cycle - 0.35) % 0.65) - 0.22) / 0.22);
    const shurikenPhase = cycle > 3.05;
    targets.forEach((target, index) => {
      const flash = shurikenPhase
        ? index === Math.floor((cycle - 3.05) * 2.4) % targets.length
        : index === 0 && slashPulse > 0.35;
      drawDemoMonster(context, target.x, ground, target.tall ? 0.82 : 0.88, target.tall, flash);
    });
    if (!shurikenPhase) {
      context.save();
      context.globalAlpha = slashPulse * 0.9;
      context.strokeStyle = "#1c1024";
      context.shadowColor = "#8f35c8";
      context.shadowBlur = 16;
      context.lineWidth = 12;
      context.beginPath();
      context.moveTo(125, 78);
      context.quadraticCurveTo(265, 48, 408, 83);
      context.stroke();
      context.strokeStyle = "#8f35c8";
      context.lineWidth = 3;
      context.stroke();
      context.restore();
    } else {
      for (let i = 0; i < 3; i += 1) {
        const p = Math.max(0, Math.min(1, (cycle - 3.05 - i * 0.42) / 0.8));
        if (p <= 0 || p >= 1) continue;
        const target = targets[i];
        const x = 128 + (target.x - 128) * p;
        const y = 72 - Math.sin(p * Math.PI) * 35;
        context.save();
        context.translate(x, y);
        context.rotate(cycle * 12);
        context.fillStyle = "#17101d";
        context.strokeStyle = "#963dcc";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(0, -11);
        context.lineTo(6, 0);
        context.lineTo(0, 11);
        context.lineTo(-6, 0);
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
      }
    }
  } else if (isWolf) {
    const ultimatePhase = cycle > 3.1;
    const pulseSpeed = ultimatePhase ? 0.34 : 0.82;
    const clawPulse = Math.max(
      0,
      1 - Math.abs(((cycle - 0.25) % pulseSpeed) - pulseSpeed * 0.32) / (pulseSpeed * 0.32)
    );
    targets.forEach((target, index) => {
      const hitIndex = ultimatePhase
        ? Math.floor((cycle - 3.1) * 5) % targets.length
        : 0;
      drawDemoMonster(
        context,
        target.x,
        ground,
        target.tall ? 0.82 : 0.88,
        target.tall,
        index === hitIndex && clawPulse > 0.28
      );
    });
    context.save();
    context.globalAlpha = clawPulse * 0.88;
    context.strokeStyle = ultimatePhase ? "#ff5b43" : "#d92f2f";
    context.shadowColor = "#9f0000";
    context.shadowBlur = 14;
    context.lineWidth = ultimatePhase ? 7 : 5;
    const demoRange = ultimatePhase ? 420 : 330;
    const count = ultimatePhase ? 3 : 5;
    for (let i = 0; i < count; i += 1) {
      context.beginPath();
      context.moveTo(125, 68 + i * 8);
      context.quadraticCurveTo(250, 39 + i * 7, demoRange, 77 + i * 5);
      context.stroke();
    }
    context.restore();
  } else if (isDong) {
    const p = Math.max(0, Math.min(1, ((cycle - 0.4) % 1.55) / 1.1));
    targets.forEach((target, index) => {
      drawDemoMonster(context, target.x, ground, target.tall ? 0.82 : 0.88, target.tall, index === 0 && p > 0.82);
    });
    context.save();
    context.translate(132 + (targets[0].x - 132) * p, 78 - Math.sin(p * Math.PI) * 26);
    context.fillStyle = "#000";
    context.strokeStyle = "#9d4be0";
    context.shadowColor = "#a84cff";
    context.shadowBlur = 16;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(0, 0, cycle > 3.2 ? 22 : 12, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  } else if (isQuan) {
    const punchPulse = Math.max(0, 1 - Math.abs(((cycle - 0.25) % 0.62) - 0.25) / 0.25);
    targets.forEach((target, index) => {
      drawDemoMonster(context, target.x, ground, target.tall ? 0.82 : 0.88, target.tall, index === 0 && punchPulse > 0.35);
    });
    context.save();
    context.globalAlpha = punchPulse;
    const flame = context.createLinearGradient(120, 0, 420, 0);
    flame.addColorStop(0, "#ffe34d");
    flame.addColorStop(0.5, "#ff8b18");
    flame.addColorStop(1, "#d92112");
    context.strokeStyle = flame;
    context.lineWidth = cycle > 3.2 ? 45 : 16;
    context.shadowColor = "#ff4a18";
    context.shadowBlur = 22;
    context.beginPath();
    context.moveTo(125, 76);
    context.quadraticCurveTo(265, 40, cycle > 3.2 ? 580 : 410, 77);
    context.stroke();
    context.restore();
  } else {
    const rainStrength = Math.max(0, 1 - Math.abs(cycle - 3.35) / 1.05);
    targets.forEach((target, index) => {
      const shotHit = index === 0 && cycle > 1.55 && cycle < 2.15;
      const rainHit = rainStrength > 0.2 && ((index + Math.floor(cycle * 8)) % 2 === 0);
      drawDemoMonster(context, target.x, ground, target.tall ? 0.82 : 0.88, target.tall, shotHit || rainHit);
    });

    [0, 0.28, 0.56].forEach((delay) => {
      const shotP = (cycle - 0.35 - delay) / 1.3;
      if (shotP < 0 || shotP > 1) return;
      const x = 132 + (targets[0].x - 132) * shotP;
      context.fillStyle = "#e32636";
      context.beginPath();
      context.ellipse(x, 84 + Math.sin(shotP * Math.PI) * 3, 12, 4, 0, 0, Math.PI * 2);
      context.fill();
    });

    if (rainStrength > 0) {
      for (let i = 0; i < 8; i += 1) {
        const fall = ((cycle * 130 + i * 39) % 150) / 150;
        const x = 375 + i * 37;
        const y = -12 + fall * 137;
        context.globalAlpha = rainStrength * 0.88;
        context.fillStyle = "#e32636";
        context.beginPath();
        context.ellipse(x, y, 4, 10, 0.18, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }
  }

  context.fillStyle = isLei || isXin || isDong
    ? "rgba(81, 32, 121, 0.72)"
    : isWolf
      ? "rgba(128, 28, 22, 0.76)"
      : "rgba(105, 12, 21, 0.68)";
  context.font = "700 13px 'PingFang SC', sans-serif";
  context.textAlign = "right";
  context.fillText(
    isLei
      ? "雷 · 追踪音符 / 连锁传导"
      : isXin
        ? "信 · 四段刀法 / 追踪手里剑"
        : isWolf
          ? "狂狼 · 双爪撕裂 / 机械狂猎"
          : isDong
            ? "洞 · 追踪黑洞 / 坍缩爆炸"
            : isQuan
              ? "拳 · 五段连击 / 超级烈焰拳"
        : "龙 · 双枪 / 子弹雨",
    width - 18,
    22
  );
  context.textAlign = "left";
}

function demoLoop(time) {
  if (screens.briefing.classList.contains("active")) drawDemoScene(time);
  requestAnimationFrame(demoLoop);
}

function agentName(agent) {
  if (agent === "lei") return "雷";
  if (agent === "xin") return "信";
  if (agent === "wolf") return "狂狼";
  if (agent === "dong") return "洞";
  if (agent === "quan") return "拳";
  return "龙";
}

function ultimateName(agent) {
  if (agent === "lei") return "雷霆演奏";
  if (agent === "xin") return "影刃手里剑";
  if (agent === "wolf") return "机械狂猎";
  if (agent === "dong") return "坍缩黑洞";
  if (agent === "quan") return "超级烈焰拳";
  return "子弹雨";
}

function resetGame() {
  gameEnded = false;
  score = 0;
  missionElapsed = 0;
  missionRemaining = activeMode.duration;
  bullets = [];
  noteProjectiles = [];
  chainEffects = [];
  swordSlashes = [];
  shurikenProjectiles = [];
  xinMarks = [];
  wolfClawEffects = [];
  voidProjectiles = [];
  punchEffects = [];
  blastEffects = [];
  firePatches = [];
  rainBullets = [];
  enemies = [];
  particles = [];
  bossProjectiles = [];
  craters = [];
  craterId = 0;
  bossMode = false;
  boss = null;
  bossIntroTimer = 0;
  rainTimer = 0;
  rainSpawnTimer = 0;
  ultimateCooldown = 0;
  xinComboStep = 0;
  xinComboTimer = 0;
  xinAttackCooldown = 0;
  xinSwingTimer = 0;
  xinSwingStep = 0;
  xinShurikenDamage = 0.2;
  xinExecutionReady = false;
  xinUltimateWasActive = false;
  xinTeleportReturn = null;
  wolfAttackTimer = 0;
  wolfAttackUltimate = false;
  dongHand = 0;
  specialCharge = 0;
  specialChargeReady = false;
  specialCharging = false;
  dongPassiveActive = false;
  wolfPassiveTriggered = false;
  wolfVanishTimer = 0;
  wolfSlamTimer = 0;
  attackBonus = 0;
  quanComboStep = 0;
  quanComboTimer = 0;
  quanAttackCooldown = 0;
  quanPunchTimer = 0;
  quanPunchStep = 0;
  enemyTimer = 1 / activeMode.spawnStart;
  mutationActive = false;
  mutationBannerTimer = 0;
  heartbeatTimer = 0;
  breathingTimer = 0.2;
  musicTimer = 0;
  footstepTimer = 0;
  growlTimer = 1.5;
  enemyId = 0;
  player.x = activeAgent === "wolf" ? 138 : 82;
  player.depth = 0.68;
  player.y = laneY(player.depth);
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.grounded = true;
  player.crouching = false;
  player.maxHealth = activeMode.health;
  player.health = activeMode.health;
  player.stunTimer = 0;
  player.damageCooldown = 0;
  player.invincibleTimer = 0;
  player.inCrater = false;
  player.craterId = null;
  player.craterImmunity = 0;
  player.jumpCount = 0;
  player.jumpCharge = 0;
  player.chargeReadyAnnounced = false;
  player.flipTimer = 0;
  player.flipCooldown = 0;
  player.flipDirection = 0;
  scoreEl.textContent = "0";
  scoreTargetEl.textContent = String(activeMode.target);
  scoreLabelEl.textContent = activeMode.hell ? "大怪击败" : "救援进度";
  modeLabelEl.textContent = `${activeMode.label} · ${agentName(activeAgent)}`;
  updateHealthHud();
  updateMissionHud();
  ultimateEl.textContent = `F · ${ultimateName(activeAgent)}`;
  ultimateEl.classList.remove("active");
  resultOverlayEl.classList.remove("show");
  mutationBannerEl.classList.remove("show");
  mutationBannerEl.querySelector("span").textContent = "敌人变异";
  bossHudEl.classList.remove("show");
  rescueTimeBoxEl.classList.remove("danger");
  hintEl.classList.remove("hidden");
}

function startGame() {
  stopBriefingMusic();
  activeMode = MODES[selectedMode];
  activeAgent = selectedAgent;
  activeSkin = activeAgent === "long" ? selectedSkin : "classic";
  showScreen("game");
  resizeCanvas();
  resetGame();
  ensureAudio();
  if (audioContext && masterGain) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setValueAtTime(0.58, audioContext.currentTime);
  }
  running = true;
  lastTime = performance.now();
  setTimeout(() => hintEl.classList.add("hidden"), 5000);
  requestAnimationFrame(loop);
}

function shoot() {
  if (player.shootCooldown > 0) return;
  if (activeAgent === "lei") {
    shootNote();
    return;
  }
  if (activeAgent === "wolf") {
    wolfClawAttack();
    return;
  }
  if (activeAgent === "dong") {
    if (rainTimer > 0) return;
    shootVoidOrb(false);
    return;
  }
  if (activeAgent === "quan") {
    if (rainTimer > 0) return;
    quanAttack();
    return;
  }
  player.shootCooldown = 0.18;
  const playerScale = depthScale(player.depth);
  const muzzleY = player.y - (player.crouching ? 45 : 66) * playerScale;
  bullets.push({
    x: player.x + player.facing * 48,
    y: muzzleY,
    depth: player.depth,
    vx: player.facing * 760,
    life: 1.4,
    damage: activeSkin === "star" ? 1 : activeMode.gunDamage,
    explosive: activeSkin === "star",
    fire: activeSkin === "star",
  });
  makeBurst(player.x + player.facing * 54, muzzleY, "#ffd45a", 5);
  playShotSound();
}

function shootVoidOrb(explosive, charged = false) {
  player.shootCooldown = dongPassiveActive ? 0.22 : 0.32;
  dongHand = (dongHand + 1) % 2;
  const scale = depthScale(player.depth);
  const target = findNearestNoteTarget(player.x, player.depth, new Set());
  const airborne = dongPassiveActive ? 110 : 0;
  voidProjectiles.push({
    x: player.x + player.facing * (dongHand ? 34 : 24),
    y: player.y - airborne - (dongHand ? 76 : 64) * scale,
    depth: player.depth,
    vx: player.facing * 360,
    vy: dongPassiveActive ? 120 : -15,
    target,
    life: 4,
    damage: charged ? 10 : dongPassiveActive ? 2 + attackBonus : 1 + attackBonus,
    radius: charged ? 150 : dongPassiveActive ? 88 : explosive ? 72 : 34,
    explosive: charged || explosive || dongPassiveActive,
    charged,
    passiveAirstrike: dongPassiveActive && !charged,
  });
  playTone(charged ? 48 : 92, charged ? 0.48 : 0.18, charged ? 0.14 : 0.075, "sine");
  playNoise(charged ? 0.32 : 0.13, charged ? 0.12 : 0.055, 420);
}

function quanAttack() {
  if (quanAttackCooldown > 0) return;
  quanComboStep = quanComboTimer > 0 ? (quanComboStep % 5) + 1 : 1;
  quanComboTimer = 0.72;
  quanAttackCooldown = quanComboStep === 5 ? 0.46 : 0.26;
  quanPunchStep = quanComboStep;
  quanPunchTimer = quanComboStep === 5 ? 0.42 : 0.25;
  if (quanComboStep === 5) {
    for (let i = 0; i < 4; i += 1) queuePunchHit(0.3, i * 0.085, 255);
  } else {
    queuePunchHit(1, 0.07, quanComboStep === 3 ? 285 : 235);
  }
  playNoise(0.1, 0.09, 1300);
  playTone(125 + quanComboStep * 18, 0.13, 0.065, "sawtooth");
}

function queuePunchHit(damage, delay, range) {
  punchEffects.push({
    x: player.x,
    y: player.y - 62 * depthScale(player.depth),
    depth: player.depth,
    facing: player.facing,
    damage,
    delay,
    range,
    life: 0.22,
    maxLife: 0.22,
    activated: false,
    super: false,
  });
}

function wolfClawAttack() {
  const ultimateActive = rainTimer > 0;
  player.shootCooldown = ultimateActive ? 0.1 : 0.3;
  wolfAttackTimer = ultimateActive ? 0.1 : 0.22;
  wolfAttackUltimate = ultimateActive;
  const playerScale = depthScale(player.depth);
  wolfClawEffects.push({
    x: player.x,
    y: player.y - 46 * playerScale,
    depth: player.depth,
    facing: player.facing,
    range: ultimateActive ? 350 : 255,
    damage: 1.3 + attackBonus,
    ultimate: ultimateActive,
    life: ultimateActive ? 0.13 : 0.2,
    maxLife: ultimateActive ? 0.13 : 0.2,
    activated: false,
  });
  if (wolfClawEffects.length > 20) wolfClawEffects.shift();
  playWolfClawSound(ultimateActive);
}

function applyWolfSlow(target) {
  if (!target || !target.alive) return;
  target.slowTimer = Math.max(target.slowTimer || 0, 3);
}

function updateWolfClawEffects(dt) {
  for (const claw of wolfClawEffects) {
    if (!claw.activated) {
      claw.activated = true;
      for (const target of getCombatTargets()) {
        const position = getTargetPosition(target);
        const forward = (position.x - claw.x) * claw.facing;
        if (forward < -28 || forward > claw.range) continue;
        if (Math.abs(position.depth - claw.depth) > 0.22) continue;
        damageCombatTarget(target, claw.damage, position.x, position.y);
        applyWolfSlow(target);
      }
      makeBurst(
        claw.x + claw.facing * Math.min(claw.range * 0.65, 175),
        claw.y,
        "#d84235",
        claw.ultimate ? 7 : 5
      );
    }
    claw.life -= dt;
  }
  wolfClawEffects = wolfClawEffects.filter((claw) => claw.life > 0);
}

function createBlast(x, y, depth, radius, damage, color = "#8f3bd0", fire = false) {
  blastEffects.push({ x, y, depth, radius, life: 0.42, maxLife: 0.42, color });
  for (const target of getCombatTargets()) {
    const position = getTargetPosition(target);
    const distance = Math.hypot(position.x - x, (position.depth - depth) * 430);
    if (distance <= radius) damageCombatTarget(target, damage, position.x, position.y);
  }
  if (fire) {
    firePatches.push({ x, depth, radius: 82, life: 2, tick: 0 });
  }
  makeBurst(x, y, color, 18);
  screenShake = Math.max(screenShake, radius > 120 ? 12 : 6);
  playNoise(0.22, 0.12, 520);
}

function createDongPassiveBlast(x, y, depth, radius) {
  blastEffects.push({
    x,
    y,
    depth,
    radius,
    life: 0.42,
    maxLife: 0.42,
    color: "#9849dc",
  });
  for (const target of getCombatTargets()) {
    const position = getTargetPosition(target);
    const distance = Math.hypot(position.x - x, (position.depth - depth) * 430);
    if (distance > radius) continue;
    if (target === boss) {
      damageBoss(2, false, position.x, position.y);
    } else {
      damageEnemy(target, target.hp + 1, position.x, position.y);
    }
  }
  makeBurst(x, y, "#9849dc", 18);
  screenShake = Math.max(screenShake, 8);
  playNoise(0.22, 0.12, 520);
}

function updateVoidProjectiles(dt) {
  for (const orb of voidProjectiles) {
    if (!orb.target || !orb.target.alive) {
      orb.target = findNearestNoteTarget(orb.x, orb.depth, new Set());
    }
    if (orb.target) {
      const position = getTargetPosition(orb.target);
      const dx = position.x - orb.x;
      const dy = position.y - orb.y;
      const dd = position.depth - orb.depth;
      const length = Math.hypot(dx, dy, dd * 430) || 1;
      const speed = orb.charged ? 650 : 520;
      orb.vx += ((dx / length) * speed - orb.vx) * Math.min(1, dt * 6);
      orb.vy += ((dy / length) * speed - orb.vy) * Math.min(1, dt * 6);
      orb.depth += (dd / length) * speed * 0.0022 * dt;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (Math.hypot(dx, dy) < (orb.charged ? 48 : 30) && Math.abs(dd) < 0.17) {
        orb.life = 0;
        if (orb.passiveAirstrike) {
          createDongPassiveBlast(orb.x, orb.y, orb.depth, orb.radius);
        } else if (orb.explosive) {
          createBlast(orb.x, orb.y, orb.depth, orb.radius, orb.damage, "#9849dc");
        } else {
          damageCombatTarget(orb.target, orb.damage, position.x, position.y);
          makeBurst(position.x, position.y, "#9849dc", 10);
        }
      }
    } else {
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
    }
    orb.life -= dt;
  }
  voidProjectiles = voidProjectiles.filter((orb) => orb.life > 0);
}

function updatePunchEffects(dt) {
  for (const punch of punchEffects) {
    if (!punch.activated) {
      punch.delay -= dt;
      if (punch.delay <= 0) {
        punch.activated = true;
        for (const target of getCombatTargets()) {
          const position = getTargetPosition(target);
          const forward = (position.x - punch.x) * punch.facing;
          if (forward < -24 || forward > punch.range) continue;
          if (Math.abs(position.depth - punch.depth) > 0.2) continue;
          if (punch.super) {
            if (target === boss) {
              damageBoss(10, false, position.x, position.y);
            } else {
              damageEnemy(target, target.hp + 20, position.x, position.y);
              target.x += punch.facing * viewportWidth;
            }
          } else {
            damageCombatTarget(target, punch.damage + attackBonus, position.x, position.y);
          }
        }
        makeBurst(punch.x + punch.facing * 95, punch.y, "#ff7b18", punch.super ? 32 : 8);
      }
    } else {
      punch.life -= dt;
    }
  }
  punchEffects = punchEffects.filter((punch) => !punch.activated || punch.life > 0);
}

function updateFirePatches(dt) {
  for (const fire of firePatches) {
    fire.life -= dt;
    fire.tick -= dt;
    if (fire.tick <= 0) {
      fire.tick = 0.2;
      for (const target of getCombatTargets()) {
        const position = getTargetPosition(target);
        if (
          Math.abs(position.x - fire.x) < fire.radius &&
          Math.abs(position.depth - fire.depth) < 0.16
        ) {
          damageCombatTarget(target, 0.1, position.x, position.y);
        }
      }
    }
  }
  firePatches = firePatches.filter((fire) => fire.life > 0);
}

function playWolfClawSound(ultimateActive) {
  if (ultimateActive) {
    playTone(210, 0.07, 0.065, "sawtooth");
    playTone(620, 0.045, 0.035, "triangle", 0.015);
  } else {
    playNoise(0.12, 0.13, 1650);
    playTone(145, 0.14, 0.07, "sawtooth");
  }
}

function shootNote() {
  const ultimateActive = rainTimer > 0;
  player.shootCooldown = ultimateActive ? 0.075 : 0.2;
  const target = findNearestNoteTarget(player.x, player.depth, new Set());
  const playerScale = depthScale(player.depth);
  const startY = player.y - 61 * playerScale - (ultimateActive ? 34 : 0);
  noteProjectiles.push({
    x: player.x + player.facing * 44,
    y: startY,
    depth: player.depth,
    vx: player.facing * 430,
    vy: -20,
    target,
    life: 3,
    damage: 0.2,
  });
  makeBurst(player.x + player.facing * 45, startY, "#d63cff", 4);
  playBiuSound();
}

function xinAttack() {
  if (xinAttackCooldown > 0 || player.stunTimer > 0 || player.inCrater) return;
  if (rainTimer > 0) {
    shootXinShuriken();
    return;
  }
  if (xinExecutionReady && executeXinMarkedTarget()) return;

  xinComboStep = xinComboTimer > 0 ? (xinComboStep % 4) + 1 : 1;
  xinComboTimer = 0.72;
  xinSwingStep = xinComboStep;
  xinSwingTimer = xinComboStep === 4 ? XIN_FLURRY_DURATION : XIN_SWING_DURATION;
  xinAttackCooldown = xinComboStep === 4 ? 0.44 : 0.24;

  if (xinComboStep === 1) {
    queueSwordSlash(1, 0.092, "horizontal", 1);
  } else if (xinComboStep === 2) {
    queueSwordSlash(1, 0.092, "diagonal", 2);
  } else if (xinComboStep === 3) {
    queueSwordSlash(1, 0.092, "vertical", 3);
  } else {
    for (let i = 0; i < 4; i += 1) {
      queueSwordSlash(0.3, 0.038 + i * 0.09, i % 2 ? "diagonal" : "horizontal", 4);
    }
  }
}

function queueSwordSlash(damage, delay, style, comboStep, execution = false) {
  swordSlashes.push({
    damage,
    delay,
    style,
    comboStep,
    execution,
    activated: false,
    life: 0.24,
    maxLife: 0.24,
    x: player.x,
    y: player.y,
    depth: player.depth,
    facing: player.facing,
  });
}

function activateSwordSlash(slash) {
  slash.activated = true;
  slash.x = player.x;
  slash.y = player.y;
  slash.depth = player.depth;
  slash.facing = player.facing;
  const range = slash.execution ? 320 : slash.comboStep === 4 ? 285 : 250;

  for (const target of getCombatTargets()) {
    const position = getTargetPosition(target);
    const forward = (position.x - slash.x) * slash.facing;
    if (forward < -24 || forward > range) continue;
    if (Math.abs(position.depth - slash.depth) > 0.19) continue;
    if (slash.damage > 0) {
      damageCombatTarget(target, slash.damage, position.x, position.y);
    }
  }
  makeBurst(
    slash.x + slash.facing * 75,
    slash.y - 66 * depthScale(slash.depth),
    "#6f2ca0",
    slash.comboStep === 4 ? 8 : 5
  );
  playSwordSound(slash.comboStep);
}

function updateSwordSlashes(dt) {
  for (const slash of swordSlashes) {
    if (!slash.activated) {
      slash.delay -= dt;
      if (slash.delay <= 0) activateSwordSlash(slash);
    } else {
      slash.life -= dt;
    }
  }
  swordSlashes = swordSlashes.filter((slash) => !slash.activated || slash.life > 0);
}

function shootXinShuriken() {
  xinAttackCooldown = 0.14;
  const target = findNearestNoteTarget(player.x, player.depth, new Set());
  const playerScale = depthScale(player.depth);
  const damage = xinShurikenDamage;
  xinShurikenDamage = Math.min(1, Math.round((xinShurikenDamage + 0.1) * 10) / 10);
  shurikenProjectiles.push({
    x: player.x + player.facing * 32,
    y: player.y - 82 * playerScale,
    depth: player.depth,
    vx: player.facing * 480,
    vy: -30,
    target,
    damage,
    life: 3.2,
    angle: 0,
  });
  makeBurst(player.x + player.facing * 35, player.y - 81 * playerScale, "#8c3cc4", 5);
  playShurikenSound();
}

function addXinMark(target) {
  if (!target || !target.alive) return;
  const existing = xinMarks.find((mark) => mark.target === target);
  if (existing) {
    existing.count += 1;
  } else {
    xinMarks.push({ target, count: 1 });
  }
  // A shuriken may land just after the ultimate timer reaches zero.
  // Arm the teleport as soon as that late hit creates a valid mark.
  if (activeAgent === "xin" && rainTimer <= 0 && !xinUltimateWasActive) {
    xinExecutionReady = true;
  }
}

function updateShurikenProjectiles(dt) {
  for (const shuriken of shurikenProjectiles) {
    if (!shuriken.target || !shuriken.target.alive) {
      shuriken.target = findNearestNoteTarget(shuriken.x, shuriken.depth, new Set());
    }
    if (shuriken.target) {
      const position = getTargetPosition(shuriken.target);
      const dx = position.x - shuriken.x;
      const dy = position.y - shuriken.y;
      const dDepth = position.depth - shuriken.depth;
      const length = Math.hypot(dx, dy, dDepth * 450) || 1;
      const speed = 720;
      shuriken.vx += ((dx / length) * speed - shuriken.vx) * Math.min(1, dt * 8);
      shuriken.vy += ((dy / length) * speed - shuriken.vy) * Math.min(1, dt * 8);
      shuriken.depth += (dDepth / length) * speed * 0.0023 * dt;
      shuriken.x += shuriken.vx * dt;
      shuriken.y += shuriken.vy * dt;
      shuriken.angle += dt * 17;
      if (Math.hypot(dx, dy) < 32 && Math.abs(dDepth) < 0.16) {
        const target = shuriken.target;
        shuriken.life = 0;
        addXinMark(target);
        damageCombatTarget(target, shuriken.damage, position.x, position.y);
        makeBurst(position.x, position.y, "#7f35b5", 9);
      }
    } else {
      shuriken.x += shuriken.vx * dt;
      shuriken.y += shuriken.vy * dt;
      shuriken.angle += dt * 17;
    }
    shuriken.life -= dt;
  }
  shurikenProjectiles = shurikenProjectiles.filter(
    (shuriken) =>
      shuriken.life > 0 &&
      shuriken.x > -140 &&
      shuriken.x < viewportWidth + 140 &&
      shuriken.y > -140 &&
      shuriken.y < viewportHeight + 140
  );
  xinMarks = xinMarks.filter((mark) => mark.target && mark.target.alive);
  if (xinExecutionReady && xinMarks.length === 0) xinExecutionReady = false;
}

function executeXinMarkedTarget() {
  const mark = xinMarks.find((item) => item.target && item.target.alive);
  if (!mark) {
    xinExecutionReady = false;
    return false;
  }
  const target = mark.target;
  const position = getTargetPosition(target);
  xinTeleportReturn = {
    x: player.x,
    depth: player.depth,
    facing: player.facing,
    timer: XIN_TELEPORT_HOLD,
  };
  player.invincibleTimer = XIN_TELEPORT_HOLD + XIN_RETURN_INVINCIBILITY;
  player.stunTimer = 0;
  player.damageCooldown = 0;
  player.inCrater = false;
  player.craterId = null;
  player.facing = position.x >= player.x ? 1 : -1;
  player.x = Math.max(42, Math.min(viewportWidth - 42, position.x - player.facing * 72));
  player.depth = position.depth;
  player.y = laneY(player.depth);
  player.vy = 0;
  player.grounded = true;
  player.crouching = false;
  xinSwingStep = 1;
  xinSwingTimer = XIN_SWING_DURATION;
  xinAttackCooldown = 0.34;
  if (target === boss) {
    damageBoss(8, false, position.x, position.y);
  } else {
    damageEnemy(target, target.hp + 1, position.x, position.y);
  }
  queueSwordSlash(0, 0, "horizontal", 1, true);
  makeBurst(position.x, position.y, "#b94df4", 22);
  screenShake = 13;
  playTone(92, 0.28, 0.13, "sawtooth");
  xinExecutionReady = false;
  xinMarks = [];
  return true;
}

function updateXinTeleport(dt) {
  if (!xinTeleportReturn) return;
  xinTeleportReturn.timer -= dt;
  if (xinTeleportReturn.timer > 0) return;

  player.x = xinTeleportReturn.x;
  player.depth = xinTeleportReturn.depth;
  player.y = laneY(player.depth);
  player.facing = xinTeleportReturn.facing;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  player.crouching = false;
  player.inCrater = false;
  player.craterId = null;
  player.craterImmunity = Math.max(player.craterImmunity, XIN_RETURN_INVINCIBILITY);
  player.invincibleTimer = Math.max(player.invincibleTimer, XIN_RETURN_INVINCIBILITY);
  makeBurst(player.x, player.y - 64 * depthScale(player.depth), "#c278ef", 18);
  playTone(340, 0.14, 0.07, "triangle");
  xinTeleportReturn = null;
}

function playerIsInvincible() {
  return (
    player.invincibleTimer > 0 ||
    Boolean(xinTeleportReturn) ||
    (activeAgent === "dong" && dongPassiveActive) ||
    (activeAgent === "wolf" && wolfVanishTimer > 0)
  );
}

function playSwordSound(comboStep) {
  playNoise(comboStep === 4 ? 0.14 : 0.1, 0.11, comboStep === 3 ? 1000 : 1400);
  playTone(comboStep === 3 ? 115 : 150 + comboStep * 20, 0.16, 0.08, "sawtooth");
}

function playShurikenSound() {
  playTone(510, 0.11, 0.065, "triangle");
  playTone(250, 0.13, 0.045, "sawtooth", 0.025);
}

function playBiuSound() {
  if (!ensureAudio()) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(760, now);
  oscillator.frequency.exponentialRampToValueAtTime(1280, now + 0.08);
  oscillator.frequency.exponentialRampToValueAtTime(540, now + 0.16);
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(now);
  oscillator.stop(now + 0.19);
}

function playShotSound() {
  if (!ensureAudio()) return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(180, now);
  oscillator.frequency.exponentialRampToValueAtTime(65, now + 0.07);
  gain.gain.setValueAtTime(0.13, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

function ensureAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;
  if (!audioContext) {
    audioContext = new AudioCtx();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.58;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return true;
}

function playBriefingMusicStep() {
  if (!screens.briefing.classList.contains("active")) return;
  const melody = [523, 659, 784, 659, 880, 784, 698, 587];
  const note = melody[briefingMusicStep % melody.length];
  const beat = briefingMusicStep % 8;
  playTone(note, 0.1, 0.028, beat % 2 ? "triangle" : "square");
  if (beat === 0 || beat === 4) {
    playTone(131, 0.13, 0.024, "square");
    playNoise(0.045, 0.018, 1200);
  }
  if (beat === 3) {
    playTone(330, 0.07, 0.018, "sine");
    playTone(196, 0.11, 0.016, "triangle", 0.04);
  }
  briefingMusicStep += 1;
}

function startBriefingMusic() {
  stopBriefingMusic();
  if (!ensureAudio()) return;
  briefingMusicStep = 0;
  playBriefingMusicStep();
  briefingMusicTimer = setInterval(playBriefingMusicStep, 145);
}

function stopBriefingMusic() {
  if (briefingMusicTimer !== null) {
    clearInterval(briefingMusicTimer);
    briefingMusicTimer = null;
  }
}

function playTone(frequency, duration, volume, type = "sine", delay = 0) {
  if (!ensureAudio()) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playNoise(duration, volume, lowpassFrequency, delay = 0) {
  if (!ensureAudio()) return;
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  filter.type = "lowpass";
  filter.frequency.value = lowpassFrequency;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(audioContext.currentTime + delay);
}

function playHeartbeat() {
  playTone(mutationActive ? 58 : 52, 0.13, 0.2, "sine");
  playTone(mutationActive ? 48 : 43, 0.16, 0.16, "sine", 0.16);
}

function playBreath() {
  playNoise(mutationActive ? 0.46 : 0.62, 0.09, 1050);
  playNoise(mutationActive ? 0.38 : 0.5, 0.065, 850, mutationActive ? 0.48 : 0.65);
}

function playUrgentPulse() {
  const notes = mutationActive ? [82, 98, 73, 110] : [110, 98, 123, 92];
  const index = Math.floor(missionElapsed * 3.2) % notes.length;
  playTone(notes[index], 0.22, mutationActive ? 0.055 : 0.04, "sawtooth");
  if (mutationActive) playTone(notes[index] / 2, 0.3, 0.035, "square");
}

function playFootstep() {
  const armored = activeAgent === "long" && activeSkin === "star";
  playNoise(armored ? 0.15 : 0.08, armored ? 0.2 : 0.13, armored ? 240 : 360);
  playTone(armored ? 43 : 72, armored ? 0.14 : 0.07, armored ? 0.11 : 0.055, "sine");
}

function playZombieGrowl() {
  if (!ensureAudio()) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(mutationActive ? 48 : 58, now);
  oscillator.frequency.linearRampToValueAtTime(mutationActive ? 31 : 39, now + 0.75);
  filter.type = "lowpass";
  filter.frequency.value = mutationActive ? 420 : 520;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(mutationActive ? 0.12 : 0.075, now + 0.09);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  oscillator.start(now);
  oscillator.stop(now + 0.9);
}

function updateSoundscape(dt) {
  heartbeatTimer -= dt;
  breathingTimer -= dt;
  musicTimer -= dt;
  footstepTimer -= dt;
  growlTimer -= dt;

  if (heartbeatTimer <= 0) {
    playHeartbeat();
    heartbeatTimer = mutationActive ? 0.53 : 0.72;
  }
  if (breathingTimer <= 0) {
    playBreath();
    breathingTimer = mutationActive ? 0.95 : 1.25;
  }
  if (musicTimer <= 0) {
    playUrgentPulse();
    musicTimer = mutationActive ? 0.22 : 0.31;
  }
  if (Math.abs(player.vx) > 20 && player.grounded && player.stunTimer <= 0 && footstepTimer <= 0) {
    playFootstep();
    footstepTimer = 0.29;
  }
  const nearbyEnemy =
    enemies.some((enemy) => enemy.alive && Math.abs(enemy.x - player.x) < 390) ||
    Boolean(boss && boss.alive && Math.abs(boss.x - player.x) < 560);
  if (nearbyEnemy && growlTimer <= 0) {
    playZombieGrowl();
    growlTimer = mutationActive ? 1.5 + Math.random() * 1.2 : 2.4 + Math.random() * 1.8;
  }
}

function startUltimate() {
  if (rainTimer > 0 || ultimateCooldown > 0) return;
  rainTimer = 7;
  rainSpawnTimer = 0;
  ultimateCooldown = activeAgent === "lei"
    ? 35
    : activeAgent === "xin"
      ? 30
      : activeAgent === "wolf"
        ? 28
        : activeAgent === "dong"
          ? 32
          : activeAgent === "quan"
            ? 30
        : 20;
  ultimateEl.classList.add("active");
  if (activeAgent === "lei") {
    ultimateEl.textContent = "雷霆演奏 · 7.0 秒";
    playTone(220, 0.7, 0.11, "sawtooth");
    playTone(330, 0.9, 0.09, "square", 0.08);
    screenShake = 5;
  } else if (activeAgent === "xin") {
    xinMarks = [];
    xinShurikenDamage = 0.2;
    xinExecutionReady = false;
    xinUltimateWasActive = true;
    ultimateEl.textContent = "影刃手里剑 · 7.0 秒";
    playTone(145, 0.5, 0.1, "sawtooth");
    playTone(72, 0.8, 0.075, "square", 0.06);
    screenShake = 7;
  } else if (activeAgent === "wolf") {
    ultimateEl.textContent = "机械狂猎 · 7.0 秒";
    wolfAttackUltimate = true;
    playTone(82, 0.72, 0.12, "sawtooth");
    playNoise(0.42, 0.11, 520);
    screenShake = 8;
  } else if (activeAgent === "dong") {
    specialCharge = 0;
    specialChargeReady = false;
    specialCharging = false;
    ultimateEl.textContent = "按住空格 · 黑洞蓄力";
    playTone(62, 0.7, 0.11, "sine");
  } else if (activeAgent === "quan") {
    specialCharge = 0;
    specialChargeReady = false;
    specialCharging = false;
    ultimateEl.textContent = "按住空格 · 烈焰蓄力";
    playTone(105, 0.5, 0.1, "sawtooth");
  } else {
    screenShake = 8;
  }
}

function finishXinUltimate() {
  if (!xinUltimateWasActive) return;
  xinUltimateWasActive = false;
  xinExecutionReady = xinMarks.some((mark) => mark.target && mark.target.alive);
  if (xinExecutionReady) {
    ultimateEl.textContent = "空格 · 影瞬横切";
    ultimateEl.classList.add("active");
    playTone(280, 0.25, 0.08, "triangle");
  }
}

function releaseSpecialAttack() {
  if (!specialCharging || specialCharge < 0.08) {
    specialCharging = false;
    return;
  }
  if (activeAgent === "dong" && rainTimer > 0) {
    shootVoidOrb(true, true);
    rainTimer = 0;
    ultimateEl.textContent = "坍缩黑洞 · 已释放";
  } else if (activeAgent === "quan" && rainTimer > 0) {
    const power = Math.max(0.35, specialCharge);
    punchEffects.push({
      x: player.x,
      y: player.y - 65 * depthScale(player.depth),
      depth: player.depth,
      facing: player.facing,
      damage: 0,
      delay: 0.04,
      range: 620 + power * 260,
      life: 0.75,
      maxLife: 0.75,
      activated: false,
      super: true,
      power,
    });
    quanPunchStep = 3;
    quanPunchTimer = 0.5;
    rainTimer = 0;
    screenShake = 16;
    playTone(55, 0.55, 0.16, "sawtooth");
    playNoise(0.5, 0.15, 800);
  }
  specialCharge = 0;
  specialChargeReady = false;
  specialCharging = false;
}

function triggerDongPassive() {
  if (dongPassiveActive) return;
  dongPassiveActive = true;
  attackBonus += 2;
  player.maxHealth += 2;
  player.health = Math.min(player.maxHealth, player.health + 2);
  player.invincibleTimer = 9999;
  player.inCrater = false;
  player.stunTimer = 0;
  updateHealthHud();
  makeBurst(player.x, player.y - 80, "#a84cff", 30);
  playTone(52, 0.9, 0.14, "sine");
}

function triggerWolfPassive() {
  if (wolfPassiveTriggered) return;
  wolfPassiveTriggered = true;
  wolfVanishTimer = 5;
  wolfSlamTimer = 0;
  attackBonus += 2;
  player.maxHealth += 2;
  player.health = Math.min(player.maxHealth, player.health + 2);
  player.invincibleTimer = 6.3;
  player.stunTimer = 0;
  player.inCrater = false;
  updateHealthHud();
  makeBurst(player.x, player.y - 70, "#d84631", 28);
  playNoise(0.32, 0.12, 500);
}

function wolfPassiveSlam() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    damageEnemy(enemy, enemy.hp + 10, enemy.x, enemy.y - enemy.height * 0.5);
  }
  if (boss && boss.alive) damageBoss(10, false, boss.x, boss.y - 100);
  player.y = laneY(player.depth);
  player.grounded = true;
  screenShake = 24;
  makeBurst(player.x, player.y, "#ff633d", 44);
  playTone(31, 0.5, 0.25, "sine");
  playTone(52, 0.35, 0.16, "square");
  playNoise(0.55, 0.22, 260);
}

function spawnEnemy() {
  const type = activeMode.hell ? "brute" : Math.random() < 0.58 ? "small" : "brute";
  const fromLeft = Math.random() < 0.5;
  const direction = fromLeft ? 1 : -1;
  const depth = 0.25 + Math.random() * 0.7;
  const stats = type === "small"
    ? { speed: 175 + Math.random() * 55, hp: 1, width: 34, height: 55 }
    : { speed: 42 + Math.random() * 25, hp: 4, width: 78, height: 132 };
  enemies.push({
    id: enemyId++,
    type,
    x: fromLeft ? -90 : viewportWidth + 90,
    y: laneY(depth),
    depth,
    direction,
    speed: stats.speed,
    baseSpeed: stats.speed,
    hp: stats.hp,
    maxHp: stats.hp,
    width: stats.width,
    height: stats.height,
    phase: Math.random() * 10,
    contactCooldown: 0,
    slowTimer: 0,
    alive: true,
  });
}

function makeBurst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 170,
      vy: (Math.random() - 0.5) * 170,
      life: 0.25 + Math.random() * 0.25,
      color,
    });
  }
}

function getCombatTargets() {
  const targets = enemies.filter((enemy) => enemy.alive);
  if (boss && boss.alive) targets.push(boss);
  return targets;
}

function getBossHitbox() {
  if (!boss) return null;
  const scale = depthScale(boss.depth) * boss.visualScale;
  return {
    left: boss.x - 160 * scale,
    right: boss.x + 160 * scale,
    top: boss.y - 263 * scale,
    bottom: boss.y + 12 * scale,
    centerX: boss.x,
    centerY: boss.y - 128 * scale,
    scale,
  };
}

function getTargetPosition(target) {
  if (target === boss) {
    const hitbox = getBossHitbox();
    return {
      x: hitbox.centerX,
      y: hitbox.centerY,
      depth: target.depth,
    };
  }
  const scale = depthScale(target.depth);
  return {
    x: target.x,
    y: target.y - target.height * scale * 0.5,
    depth: target.depth,
  };
}

function findNearestNoteTarget(x, depth, excluded) {
  let best = null;
  let bestDistance = Infinity;
  for (const target of getCombatTargets()) {
    if (excluded.has(target)) continue;
    const position = getTargetPosition(target);
    const distance = Math.hypot(position.x - x, (position.depth - depth) * 460);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }
  return best;
}

function damageCombatTarget(target, amount, hitX, hitY) {
  if (!target || !target.alive) return;
  if (target === boss) {
    damageBoss(amount, false, hitX, hitY);
  } else {
    damageEnemy(target, amount, hitX, hitY);
  }
}

function chainNoteFrom(target, damage, remaining, visited) {
  if (!target || remaining <= 0) return;
  if (activeMode.hell && bossMode && target !== boss) return;
  visited.add(target);
  const source = getTargetPosition(target);
  const next = findNearestNoteTarget(source.x, source.depth, visited);
  if (!next) return;
  const destination = getTargetPosition(next);
  const distance = Math.hypot(
    destination.x - source.x,
    (destination.depth - source.depth) * 460
  );
  if (distance > 360) return;
  chainEffects.push({
    x1: source.x,
    y1: source.y,
    x2: destination.x,
    y2: destination.y,
    life: 0.28,
    maxLife: 0.28,
  });
  damageCombatTarget(next, damage, destination.x, destination.y);
  makeBurst(destination.x, destination.y, "#ed3fb7", 7);
  chainNoteFrom(next, damage + 0.1, remaining - 1, visited);
}

function updateNoteProjectiles(dt) {
  for (const note of noteProjectiles) {
    if (!note.target || !note.target.alive) {
      note.target = findNearestNoteTarget(note.x, note.depth, new Set());
    }
    if (note.target) {
      const position = getTargetPosition(note.target);
      const deltaX = position.x - note.x;
      const deltaY = position.y - note.y;
      const deltaDepth = position.depth - note.depth;
      const length = Math.hypot(deltaX, deltaY, deltaDepth * 450) || 1;
      const speed = rainTimer > 0 ? 760 : 610;
      note.vx += ((deltaX / length) * speed - note.vx) * Math.min(1, dt * 7);
      note.vy += ((deltaY / length) * speed - note.vy) * Math.min(1, dt * 7);
      note.depth += (deltaDepth / length) * speed * 0.0022 * dt;
      note.x += note.vx * dt;
      note.y += note.vy * dt;
      const hit =
        Math.hypot(deltaX, deltaY) < 34 &&
        Math.abs(note.depth - position.depth) < 0.16;
      if (hit) {
        note.life = 0;
        damageCombatTarget(note.target, note.damage, position.x, position.y);
        makeBurst(position.x, position.y, "#ce38ff", 10);
        chainNoteFrom(note.target, 0.8, 3, new Set());
      }
    } else {
      note.x += note.vx * dt;
      note.y += note.vy * dt;
    }
    note.life -= dt;
  }
  noteProjectiles = noteProjectiles.filter(
    (note) =>
      note.life > 0 &&
      note.x > -120 &&
      note.x < viewportWidth + 120 &&
      note.y > -120 &&
      note.y < viewportHeight + 120
  );
  chainEffects.forEach((effect) => {
    effect.life -= dt;
  });
  chainEffects = chainEffects.filter((effect) => effect.life > 0);
}

function update(dt) {
  if (gameEnded) return;
  missionElapsed += dt;
  missionRemaining = Math.max(0, activeMode.duration - missionElapsed);
  if (activeMode.mutation && !mutationActive && missionElapsed >= MUTATION_TIME) activateMutation();
  mutationBannerTimer = Math.max(0, mutationBannerTimer - dt);
  if (mutationBannerTimer <= 0) mutationBannerEl.classList.remove("show");
  updateMissionHud();
  if (missionRemaining <= 0) {
    endMission(false, "救援时间耗尽");
    return;
  }

  const movingLeft = keys.has("KeyA");
  const movingRight = keys.has("KeyD");
  const movingBack = keys.has("ArrowUp");
  const movingFront = keys.has("ArrowDown");
  const speed = activeAgent === "wolf" && rainTimer > 0 ? 410 : 280;
  player.stunTimer = Math.max(0, player.stunTimer - dt);
  player.damageCooldown = Math.max(0, player.damageCooldown - dt);
  player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
  player.craterImmunity = Math.max(0, player.craterImmunity - dt);
  player.flipTimer = Math.max(0, player.flipTimer - dt);
  player.flipCooldown = Math.max(0, player.flipCooldown - dt);
  wolfAttackTimer = Math.max(0, wolfAttackTimer - dt);
  ultimateCooldown = Math.max(0, ultimateCooldown - dt);
  xinComboTimer = Math.max(0, xinComboTimer - dt);
  xinAttackCooldown = Math.max(0, xinAttackCooldown - dt);
  xinSwingTimer = Math.max(0, xinSwingTimer - dt);
  quanAttackCooldown = Math.max(0, quanAttackCooldown - dt);
  quanComboTimer = Math.max(0, quanComboTimer - dt);
  quanPunchTimer = Math.max(0, quanPunchTimer - dt);
  if (xinComboTimer <= 0) xinComboStep = 0;
  if (quanComboTimer <= 0) quanComboStep = 0;
  if (wolfVanishTimer > 0) {
    const before = wolfVanishTimer;
    wolfVanishTimer = Math.max(0, wolfVanishTimer - dt);
    if (before > 1 && wolfVanishTimer <= 1) {
      wolfSlamTimer = 1;
      player.y = Math.max(70, laneY(player.depth) - 360);
      player.vy = 0;
      player.grounded = false;
    }
    if (before > 0 && wolfVanishTimer === 0 && wolfSlamTimer > 0) {
      wolfSlamTimer = 0;
      wolfPassiveSlam();
    }
  }
  updateXinTeleport(dt);
  updateCraters(dt);
  const xinTeleporting = Boolean(xinTeleportReturn);
  const stunned = player.stunTimer > 0 || wolfVanishTimer > 0;
  const chargingJump =
    keys.has("KeyK") &&
    player.grounded &&
    !stunned &&
    !xinTeleporting;
  updateSoundscape(dt);

  if (chargingJump) {
    player.jumpCharge = Math.min(1, player.jumpCharge + dt / JUMP_CHARGE_TIME);
    if (player.jumpCharge >= 1 && !player.chargeReadyAnnounced) {
      player.chargeReadyAnnounced = true;
      playTone(620, 0.09, 0.045, "triangle");
      playTone(930, 0.16, 0.035, "sine", 0.06);
      makeBurst(player.x, player.y - 118 * depthScale(player.depth), "#ffd54a", 8);
    }
  }

  if (
    rainTimer > 0 &&
    (activeAgent === "dong" || activeAgent === "quan") &&
    keys.has("Space") &&
    !stunned
  ) {
    specialCharging = true;
    specialCharge = Math.min(1, specialCharge + dt / 1.6);
    if (specialCharge >= 1 && !specialChargeReady) {
      specialChargeReady = true;
      playTone(activeAgent === "dong" ? 74 : 420, 0.18, 0.08, "sawtooth");
    }
  }

  player.vx = 0;
  if (
    player.flipTimer > 0 &&
    !stunned &&
    !player.inCrater &&
    !xinTeleporting
  ) {
    player.vx = player.flipDirection * (activeAgent === "wolf" && rainTimer > 0 ? 470 : 390);
    player.facing = player.flipDirection;
  } else if (
    movingLeft &&
    !chargingJump &&
    !player.crouching &&
    !stunned &&
    !player.inCrater &&
    !xinTeleporting
  ) {
    player.vx = -speed;
    player.facing = -1;
  }
  if (
    player.flipTimer <= 0 &&
    movingRight &&
    !chargingJump &&
    !player.crouching &&
    !stunned &&
    !player.inCrater &&
    !xinTeleporting
  ) {
    player.vx = speed;
    player.facing = 1;
  }
  if (player.vx) player.runTime += dt;

  player.x += player.vx * dt;
  player.x = Math.max(42, Math.min(viewportWidth - 42, player.x));
  if (!chargingJump && !stunned && player.grounded && !player.inCrater && !xinTeleporting) {
    if (movingBack) player.depth -= 0.58 * dt;
    if (movingFront) player.depth += 0.58 * dt;
    player.depth = Math.max(0.15, Math.min(0.98, player.depth));
    player.y = laneY(player.depth);
  }
  player.vy += 1500 * dt;
  player.y += player.vy * dt;
  const trappedCrater = player.inCrater
    ? craters.find((crater) => crater.id === player.craterId)
    : null;
  const playerGround = laneY(player.depth) + (trappedCrater ? trappedCrater.sink : 0);
  if (player.y >= playerGround) {
    player.y = playerGround;
    player.vy = 0;
    player.grounded = true;
    player.jumpCount = 0;
  }
  checkPlayerCrater();

  if (keys.has("Space") && activeAgent !== "xin" && !stunned && !player.inCrater) shoot();
  player.shootCooldown = Math.max(0, player.shootCooldown - dt);

  bullets.forEach((bullet) => {
    bullet.x += bullet.vx * dt;
    bullet.life -= dt;
  });
  bullets = bullets.filter((bullet) => bullet.life > 0 && bullet.x > -40 && bullet.x < viewportWidth + 40);
  updateNoteProjectiles(dt);
  updateSwordSlashes(dt);
  updateShurikenProjectiles(dt);
  updateWolfClawEffects(dt);
  updateVoidProjectiles(dt);
  updatePunchEffects(dt);
  updateFirePatches(dt);

  if (rainTimer > 0) {
    rainTimer = Math.max(0, rainTimer - dt);
    if (activeAgent === "long") {
      rainSpawnTimer -= dt;
      if (rainSpawnTimer <= 0) {
        rainSpawnTimer = 0.22;
        const count = Math.random() < 0.36 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          rainBullets.push({
            x: 40 + Math.random() * (viewportWidth - 80),
            y: -40 - Math.random() * 100,
            vy: 570 + Math.random() * 180,
            angle: -0.14 + Math.random() * 0.28,
          });
        }
      }
      ultimateEl.textContent = `子弹雨 · ${rainTimer.toFixed(1)} 秒`;
      screenShake = Math.max(screenShake, 1.5);
    } else if (activeAgent === "lei") {
      ultimateEl.textContent = `雷霆演奏 · ${rainTimer.toFixed(1)} 秒`;
    } else if (activeAgent === "xin") {
      ultimateEl.textContent = `影刃手里剑 · ${rainTimer.toFixed(1)} 秒`;
      if (rainTimer <= 0) finishXinUltimate();
    } else if (activeAgent === "wolf") {
      ultimateEl.textContent = `机械狂猎 · ${rainTimer.toFixed(1)} 秒`;
    } else if (activeAgent === "dong") {
      ultimateEl.textContent = `黑洞蓄力 · ${Math.round(specialCharge * 100)}%`;
    } else if (activeAgent === "quan") {
      ultimateEl.textContent = `烈焰蓄力 · ${Math.round(specialCharge * 100)}%`;
    }
  } else {
    if (activeAgent === "xin" && xinExecutionReady) {
      ultimateEl.textContent = "空格 · 影瞬横切";
      ultimateEl.classList.add("active");
    } else if (ultimateCooldown > 0) {
      ultimateEl.textContent = `大招冷却 · ${ultimateCooldown.toFixed(1)} 秒`;
    } else {
      ultimateEl.textContent = `F · ${ultimateName(activeAgent)}`;
    }
    if (!(activeAgent === "xin" && xinExecutionReady)) ultimateEl.classList.remove("active");
  }

  rainBullets.forEach((bullet) => {
    bullet.y += bullet.vy * dt;
    bullet.x += Math.sin(bullet.angle) * 100 * dt;
  });
  rainBullets = rainBullets.filter((bullet) => bullet.y < groundY() + 30);

  enemyTimer -= dt;
  if (!bossMode && enemyTimer <= 0) {
    spawnEnemy();
    const missionProgress = Math.min(1, missionElapsed / activeMode.duration);
    const spawnsPerSecond =
      activeMode.spawnStart +
      missionProgress * (activeMode.spawnEnd - activeMode.spawnStart);
    enemyTimer = (1 / spawnsPerSecond) * (0.86 + Math.random() * 0.28);
  }
  enemies.forEach((enemy) => {
    enemy.slowTimer = Math.max(0, (enemy.slowTimer || 0) - dt);
    const deltaToPlayer = player.x - enemy.x;
    const depthDelta = player.depth - enemy.depth;
    enemy.direction = deltaToPlayer >= 0 ? 1 : -1;
    const distance = Math.abs(deltaToPlayer);
    const crowdRing = enemy.type === "small"
      ? 24 + (enemy.id % 3) * 9
      : 42 + (enemy.id % 4) * 13;
    const mutationBoost = mutationActive && enemy.type === "small" ? 1.48 : 1;
    const wolfHitSlow = enemy.slowTimer > 0 ? 0.7 : 1;
    const wolfUltimateSlow = activeAgent === "wolf" && rainTimer > 0 ? 0.55 : 1;
    const approachFactor = distance < crowdRing + 34
      ? (enemy.type === "small" ? 0.55 : 0.2)
      : 1;
    if (distance > crowdRing) {
      enemy.x +=
        enemy.direction *
        enemy.baseSpeed *
        mutationBoost *
        approachFactor *
        wolfHitSlow *
        wolfUltimateSlow *
        dt;
    }
    if (Math.abs(depthDelta) > 0.055) {
      enemy.depth +=
        Math.sign(depthDelta) *
        (enemy.type === "small" ? 0.34 : 0.12) *
        wolfHitSlow *
        wolfUltimateSlow *
        dt;
      enemy.depth = Math.max(0.12, Math.min(0.99, enemy.depth));
      enemy.y = laneY(enemy.depth);
    }
    enemy.phase += dt;
    enemy.contactCooldown = Math.max(0, enemy.contactCooldown - dt);
  });

  for (const enemy of enemies) {
    for (const bullet of bullets) {
      const enemyScale = depthScale(enemy.depth);
      const horizontalHit = Math.abs(bullet.x - enemy.x) < (enemy.width * enemyScale) / 2;
      const verticalHit = bullet.y > enemy.y - enemy.height * enemyScale && bullet.y < enemy.y;
      const depthHit = Math.abs(bullet.depth - enemy.depth) < 0.18;
      if (horizontalHit && verticalHit && depthHit && bullet.life > 0) {
        bullet.life = 0;
        if (bullet.explosive) {
          createBlast(bullet.x, bullet.y, bullet.depth, 105, bullet.damage, "#ff7a1a", bullet.fire);
        } else {
          damageEnemy(enemy, bullet.damage, bullet.x, bullet.y);
        }
      }
    }
    for (const bullet of rainBullets) {
      const horizontalHit = Math.abs(bullet.x - enemy.x) < enemy.width / 2;
      const verticalHit = bullet.y > enemy.y - enemy.height && bullet.y < enemy.y;
      if (horizontalHit && verticalHit && bullet.y < groundY() + 30) {
        bullet.y = groundY() + 40;
        damageEnemy(enemy, 1, bullet.x, bullet.y);
      }
    }
    if (gameEnded) break;
    handleEnemyContact(enemy);
  }
  enemies = enemies.filter((enemy) => enemy.alive);
  updateBoss(dt);
  updateBossProjectiles(dt);

  blastEffects.forEach((blast) => {
    blast.life -= dt;
  });
  blastEffects = blastEffects.filter((blast) => blast.life > 0);
  particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 420 * dt;
    particle.life -= dt;
  });
  particles = particles.filter((particle) => particle.life > 0);
  screenShake = Math.max(0, screenShake - 16 * dt);
}

function activateMutation() {
  mutationActive = true;
  mutationBannerTimer = 4.2;
  mutationBannerEl.classList.add("show");
  screenShake = 15;
  playTone(46, 1.5, 0.16, "sawtooth");
  playTone(30, 2.1, 0.12, "square", 0.18);
  playZombieGrowl();
}

function checkPlayerCrater() {
  if (
    !bossMode ||
    player.inCrater ||
    !player.grounded ||
    player.craterImmunity > 0 ||
    playerIsInvincible()
  ) {
    return;
  }
  const crater = craters.find(
    (item) =>
      Math.abs(item.depth - player.depth) < 0.1 &&
      Math.abs(item.x - player.x) < item.radius * 0.68
  );
  if (!crater) return;
  player.inCrater = true;
  player.craterId = crater.id;
  player.vx = 0;
  player.crouching = false;
  player.y = laneY(player.depth) + crater.sink;
  screenShake = Math.max(screenShake, 4);
  playNoise(0.25, 0.12, 280);
}

function updateCraters(dt) {
  for (const crater of craters) crater.life -= dt;
  craters = craters.filter((crater) => crater.life > 0);
  if (
    player.inCrater &&
    !craters.some((crater) => crater.id === player.craterId)
  ) {
    player.inCrater = false;
    player.craterId = null;
    player.craterImmunity = Math.max(player.craterImmunity, 0.45);
    player.y = laneY(player.depth);
    player.vy = 0;
    player.grounded = true;
  }
}

function createBossCrater() {
  if (!boss || boss.emergeTimer > 0) return;
  const deep = Math.random() < 0.42;
  const radius = deep ? 70 + Math.random() * 25 : 46 + Math.random() * 22;
  const footOffset = boss.stepSide ? 72 : -72;
  boss.stepSide = !boss.stepSide;
  craters.push({
    id: craterId++,
    x: Math.max(45, Math.min(viewportWidth - 45, boss.x + footOffset * boss.direction)),
    depth: Math.max(0.13, Math.min(0.98, boss.depth + (Math.random() - 0.5) * 0.05)),
    radius,
    sink: deep ? 28 + Math.random() * 12 : 14 + Math.random() * 9,
    deep,
    rotation: (Math.random() - 0.5) * 0.34,
    life: 2,
  });
  if (craters.length > 22) craters.shift();
}

function playBossFootstep() {
  playTone(31, 0.34, 0.22, "sine");
  playTone(46, 0.22, 0.12, "square", 0.02);
  playNoise(0.28, 0.16, 190);
  screenShake = Math.max(screenShake, boss && boss.enraged ? 15 : 11);
}

function enterBossMode() {
  bossMode = true;
  enemies = [];
  bullets = [];
  noteProjectiles = [];
  chainEffects = [];
  swordSlashes = [];
  shurikenProjectiles = [];
  xinMarks = [];
  wolfClawEffects = [];
  voidProjectiles = [];
  punchEffects = [];
  blastEffects = [];
  firePatches = [];
  xinExecutionReady = false;
  rainBullets = [];
  scoreLabelEl.textContent = "BOSS 阶段";
  scoreEl.textContent = "50";
  scoreTargetEl.textContent = "首领";
  const spawnLeft = player.x > viewportWidth / 2;
  const depth = player.depth > 0.55 ? 0.28 : 0.9;
  const targetY = laneY(depth);
  boss = {
    x: spawnLeft ? 120 : viewportWidth - 120,
    y: targetY + 520,
    targetY,
    depth,
    direction: spawnLeft ? 1 : -1,
    width: 390,
    height: 660,
    visualScale: 2.5,
    hp: 50,
    maxHp: 50,
    legHits: 0,
    enraged: false,
    phase: 0,
    emergeTimer: 2.4,
    attackCooldown: 3.2,
    swingTimer: 0,
    stepTimer: 0.35,
    stepSide: false,
    slowTimer: 0,
    alive: true,
  };
  bossIntroTimer = 2.4;
  bossHudEl.classList.add("show");
  updateBossHud();
  mutationActive = true;
  mutationBannerEl.querySelector("span").textContent = "首领苏醒";
  mutationBannerEl.classList.add("show");
  mutationBannerTimer = 2.6;
  screenShake = 18;
  playTone(31, 2.4, 0.18, "sawtooth");
  playZombieGrowl();
}

function updateBoss(dt) {
  if (!bossMode || !boss || !boss.alive) return;
  boss.phase += dt;
  boss.swingTimer = Math.max(0, boss.swingTimer - dt);
  boss.slowTimer = Math.max(0, (boss.slowTimer || 0) - dt);

  if (boss.emergeTimer > 0) {
    boss.emergeTimer = Math.max(0, boss.emergeTimer - dt);
    const progress = 1 - boss.emergeTimer / 2.4;
    boss.y = boss.targetY + (1 - progress) * 520;
    screenShake = Math.max(screenShake, 5);
    return;
  }

  const deltaX = player.x - boss.x;
  const deltaDepth = player.depth - boss.depth;
  boss.direction = deltaX >= 0 ? 1 : -1;
  const distance = Math.abs(deltaX);
  const wolfHitSlow = boss.slowTimer > 0 ? 0.7 : 1;
  const wolfUltimateSlow = activeAgent === "wolf" && rainTimer > 0 ? 0.58 : 1;
  const speed = (boss.enraged
    ? 105
    : 35 * (0.45 + Math.abs(Math.sin(boss.phase * 4.2)) * 0.75)) *
    wolfHitSlow *
    wolfUltimateSlow;
  let bossMoved = false;
  if (distance > 225) {
    boss.x += boss.direction * speed * dt;
    bossMoved = true;
  }
  if (Math.abs(deltaDepth) > 0.06) {
    boss.depth +=
      Math.sign(deltaDepth) *
      (boss.enraged ? 0.2 : 0.08) *
      wolfHitSlow *
      wolfUltimateSlow *
      dt;
    boss.depth = Math.max(0.12, Math.min(0.99, boss.depth));
    boss.targetY = laneY(boss.depth);
    boss.y = boss.targetY;
    bossMoved = true;
  }
  boss.stepTimer -= dt;
  if (bossMoved && boss.stepTimer <= 0) {
    boss.stepTimer = boss.enraged ? 0.42 : 0.76;
    playBossFootstep();
    createBossCrater();
  }

  boss.attackCooldown -= dt;
  if (boss.attackCooldown <= 0) {
    bossAttack();
    boss.attackCooldown = boss.enraged ? 1.75 : 2.8;
  }

  for (const bullet of bullets) {
    if (bullet.life <= 0 || Math.abs(bullet.depth - boss.depth) > 0.2) continue;
    const hitbox = getBossHitbox();
    const horizontalHit = bullet.x > hitbox.left && bullet.x < hitbox.right;
    const verticalHit = bullet.y > hitbox.top && bullet.y < hitbox.bottom;
    if (horizontalHit && verticalHit) {
      bullet.life = 0;
      const legHit = bullet.y > boss.y - 82 * hitbox.scale;
      if (bullet.explosive) {
        createBlast(bullet.x, bullet.y, bullet.depth, 105, bullet.damage, "#ff7a1a", bullet.fire);
      } else {
        damageBoss(bullet.damage, legHit, bullet.x, bullet.y);
      }
    }
  }
  for (const rainBullet of rainBullets) {
    const hitbox = getBossHitbox();
    const hit =
      rainBullet.x > hitbox.left &&
      rainBullet.x < hitbox.right &&
      rainBullet.y > hitbox.top &&
      rainBullet.y < hitbox.bottom;
    if (hit) {
      rainBullet.y = groundY() + 40;
      damageBoss(activeMode.gunDamage, false, rainBullet.x, rainBullet.y);
    }
  }

  if (
    player.damageCooldown <= 0 &&
    !playerIsInvincible() &&
    Math.abs(boss.depth - player.depth) < 0.15 &&
    Math.abs(boss.x - player.x) < 175
  ) {
    damagePlayer(1);
    player.stunTimer = 0.5;
    player.x -= boss.direction * 46;
    screenShake = 13;
  }
}

function bossAttack() {
  if (!boss) return;
  boss.swingTimer = 0.52;
  const deltaX = player.x - boss.x;
  const deltaDepth = player.depth - boss.depth;
  const length = Math.hypot(deltaX, deltaDepth * 500) || 1;
  bossProjectiles.push({
    x: boss.x + boss.direction * 190,
    depth: boss.depth,
    vx: (deltaX / length) * 430,
    vDepth: (deltaDepth * 500 / length) * 0.72,
    life: 3.4,
    angle: 0,
  });
  playTone(170, 0.38, 0.12, "sawtooth");
  playTone(86, 0.46, 0.08, "square", 0.04);
}

function bossProjectileHitsPlayer(projectile) {
  const projectileScale = depthScale(projectile.depth);
  const projectileY = laneY(projectile.depth) - 76 * projectileScale;
  const playerScale = depthScale(player.depth);
  const playerHeight = player.crouching
    ? 86
    : activeAgent === "xin"
      ? 145
      : activeAgent === "wolf"
        ? 138
        : 126;
  const playerTop = player.y - playerHeight * playerScale;
  const playerBottom = player.y + 4 * playerScale;
  const projectileRadiusX = 17 * projectileScale;
  const projectileRadiusY = 13 * projectileScale;
  const playerHalfWidth = player.width * playerScale * 0.25;

  return (
    Math.abs(projectile.x - player.x) < projectileRadiusX + playerHalfWidth &&
    Math.abs(projectile.depth - player.depth) < 0.075 &&
    projectileY + projectileRadiusY > playerTop &&
    projectileY - projectileRadiusY < playerBottom
  );
}

function updateBossProjectiles(dt) {
  for (const projectile of bossProjectiles) {
    projectile.x += projectile.vx * dt;
    projectile.depth += projectile.vDepth * dt;
    projectile.angle += dt * 8;
    projectile.life -= dt;
    if (
      projectile.life > 0 &&
      player.damageCooldown <= 0 &&
      !playerIsInvincible() &&
      bossProjectileHitsPlayer(projectile)
    ) {
      projectile.life = 0;
      damagePlayer(1.5);
      screenShake = 10;
    }
  }
  bossProjectiles = bossProjectiles.filter(
    (projectile) =>
      projectile.life > 0 &&
      projectile.x > -120 &&
      projectile.x < viewportWidth + 120
  );
}

function damageBoss(amount, legHit, hitX, hitY) {
  if (!boss || boss.hp <= 0) return;
  boss.hp = Math.max(0, boss.hp - amount);
  if (legHit && boss.legHits < 3) {
    boss.legHits += 1;
    if (boss.legHits >= 3) {
      boss.enraged = true;
      screenShake = 16;
      playZombieGrowl();
    }
  }
  makeBurst(hitX, hitY, "#b625ff", 12);
  updateBossHud();
  if (boss.hp <= 0) {
    boss.alive = false;
    bossHudEl.classList.remove("show");
    makeBurst(boss.x, boss.y - boss.height * 0.45, "#b625ff", 35);
    endMission(true, "变异首领已被击败，地狱救援完成");
  }
}

function updateBossHud() {
  if (!boss) return;
  bossHealthValueEl.textContent = Number.isInteger(boss.hp) ? String(boss.hp) : boss.hp.toFixed(1);
  bossHealthFillEl.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
}

function handleEnemyContact(enemy) {
  if (
    !enemy.alive ||
    enemy.contactCooldown > 0 ||
    player.damageCooldown > 0 ||
    playerIsInvincible()
  ) return;
  if (Math.abs(enemy.depth - player.depth) > 0.15) return;
  const enemyScale = depthScale(enemy.depth);
  const playerScale = depthScale(player.depth);
  const playerHeight = player.crouching
    ? 86
    : activeAgent === "xin"
      ? 145
      : activeAgent === "wolf"
        ? 138
        : 126;
  const horizontalHit =
    Math.abs(enemy.x - player.x) <
    (enemy.width * enemyScale + player.width * playerScale) * 0.48;
  const verticalHit =
    enemy.y > player.y - playerHeight * playerScale &&
    enemy.y - enemy.height * enemyScale < player.y;
  if (!horizontalHit || !verticalHit) return;

  if (enemy.type === "small") {
    damagePlayer(0.5);
    enemy.contactCooldown = 0.8;
    enemy.x += enemy.direction * -46;
  } else {
    damagePlayer(1);
    player.stunTimer = 0.5;
    player.crouching = false;
    player.x += enemy.direction * 34;
    player.x = Math.max(42, Math.min(viewportWidth - 42, player.x));
    player.vy = -130;
    player.grounded = false;
    enemy.contactCooldown = 1.1;
    enemy.x += enemy.direction * -70;
    screenShake = 11;
    speakBruteLine();
  }
}

function damagePlayer(amount) {
  if (playerIsInvincible()) return;
  player.health = Math.max(0, player.health - amount);
  player.damageCooldown = 0.38;
  if (player.health <= 1 && player.health > 0) {
    if (activeAgent === "dong") triggerDongPassive();
    if (activeAgent === "wolf") triggerWolfPassive();
  }
  updateHealthHud();
  makeBurst(player.x, player.y - 48, "#ffffff", 9);
  if (player.health <= 0) endMission(false, "特工被敌人击败");
}

function updateHealthHud() {
  healthValueEl.textContent = Number.isInteger(player.health)
    ? String(player.health)
    : player.health.toFixed(1);
  healthFillEl.style.width = `${(player.health / player.maxHealth) * 100}%`;
}

function updateMissionHud() {
  const seconds = Math.ceil(missionRemaining);
  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsPart = String(seconds % 60).padStart(2, "0");
  rescueTimeEl.textContent = `${minutesPart}:${secondsPart}`;
  rescueTimeBoxEl.classList.toggle("danger", missionRemaining <= 30);
}

function speakBruteLine() {
  playBruteZombieRoar();
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance("面对我吧！");
  utterance.lang = "zh-CN";
  utterance.rate = 0.58;
  utterance.pitch = 0.2;
  utterance.volume = 0.78;
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
  if (chineseVoice) utterance.voice = chineseVoice;
  window.speechSynthesis.speak(utterance);
}

function playBruteZombieRoar() {
  if (!ensureAudio()) return;
  const now = audioContext.currentTime;
  const duration = 1.15;
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  let roughness = 0;
  for (let i = 0; i < data.length; i += 1) {
    const envelope = Math.sin(Math.min(1, i / (sampleRate * 0.12)) * Math.PI / 2)
      * Math.pow(1 - i / data.length, 0.55);
    roughness = roughness * 0.78 + (Math.random() * 2 - 1) * 0.22;
    data[i] = roughness * envelope;
  }

  const source = audioContext.createBufferSource();
  const lowpass = audioContext.createBiquadFilter();
  const bandpass = audioContext.createBiquadFilter();
  const roarGain = audioContext.createGain();
  const throat = audioContext.createOscillator();
  const throatGain = audioContext.createGain();
  const wobble = audioContext.createOscillator();
  const wobbleDepth = audioContext.createGain();

  source.buffer = buffer;
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(720, now);
  lowpass.frequency.linearRampToValueAtTime(380, now + duration);
  bandpass.type = "bandpass";
  bandpass.frequency.value = 185;
  bandpass.Q.value = 0.7;
  roarGain.gain.setValueAtTime(0.0001, now);
  roarGain.gain.exponentialRampToValueAtTime(0.24, now + 0.09);
  roarGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  throat.type = "sine";
  throat.frequency.setValueAtTime(52, now);
  throat.frequency.linearRampToValueAtTime(31, now + duration);
  throatGain.gain.setValueAtTime(0.0001, now);
  throatGain.gain.exponentialRampToValueAtTime(0.16, now + 0.08);
  throatGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  wobble.type = "sine";
  wobble.frequency.value = 8.5;
  wobbleDepth.gain.value = 92;
  wobble.connect(wobbleDepth);
  wobbleDepth.connect(lowpass.frequency);
  source.connect(lowpass);
  lowpass.connect(bandpass);
  bandpass.connect(roarGain);
  roarGain.connect(masterGain);
  throat.connect(throatGain);
  throatGain.connect(masterGain);

  source.start(now);
  throat.start(now);
  wobble.start(now);
  source.stop(now + duration);
  throat.stop(now + duration);
  wobble.stop(now + duration);
}

function damageEnemy(enemy, amount, hitX, hitY) {
  if (activeMode.hell && bossMode) return;
  enemy.hp -= amount;
  makeBurst(hitX, hitY, "#e32636", enemy.type === "brute" ? 7 : 10);
  if (enemy.hp > 0) return;
  enemy.alive = false;
  score += 1;
  scoreEl.textContent = String(score);
  makeBurst(enemy.x, enemy.y - enemy.height * 0.5, "#e32636", 15);
  if (activeMode.hell && score >= activeMode.target && !bossMode) {
    enterBossMode();
  } else if (!activeMode.hell && score >= activeMode.target) {
    endMission(true, `已击败 ${activeMode.target} 名敌人，救援队安全抵达`);
  }
}

function endMission(success, detail) {
  if (gameEnded) return;
  gameEnded = true;
  running = false;
  keys.clear();
  resultKickerEl.textContent = success ? "MISSION COMPLETE" : "MISSION FAILED";
  resultTitleEl.textContent = success ? "救援成功！" : "失败";
  const progressText = activeMode.hell && bossMode
    ? `大怪 ${score} / ${activeMode.target}`
    : `击败 ${score} / ${activeMode.target}`;
  resultDetailEl.textContent = `${detail} · ${progressText}`;
  resultOverlayEl.classList.add("show");
  if (audioContext && masterGain) {
    masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.18);
  }
}

function drawBackground() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  if (background.complete && background.naturalWidth) {
    const imageRatio = background.naturalWidth / background.naturalHeight;
    const screenRatio = viewportWidth / viewportHeight;
    let sx = 0;
    let sy = 0;
    let sw = background.naturalWidth;
    let sh = background.naturalHeight;
    if (imageRatio > screenRatio) {
      sw = sh * screenRatio;
      sx = (background.naturalWidth - sw) / 2;
    } else {
      sh = sw / screenRatio;
      sy = (background.naturalHeight - sh) / 2;
    }
    ctx.globalAlpha = 0.68;
    ctx.drawImage(background, sx, sy, sw, sh, 0, 0, viewportWidth, viewportHeight);
    ctx.globalAlpha = 1;
    const haze = ctx.createLinearGradient(0, 0, 0, viewportHeight);
    haze.addColorStop(0, "rgba(255,255,255,.32)");
    haze.addColorStop(0.62, "rgba(255,255,255,.08)");
    haze.addColorStop(1, "rgba(255,255,255,.22)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  if (mutationActive) {
    const redSky = ctx.createLinearGradient(0, 0, 0, groundY());
    redSky.addColorStop(0, "rgba(120, 0, 8, .78)");
    redSky.addColorStop(0.55, "rgba(92, 0, 5, .52)");
    redSky.addColorStop(1, "rgba(45, 0, 0, .22)");
    ctx.fillStyle = redSky;
    ctx.fillRect(0, 0, viewportWidth, groundY());

    const moonX = viewportWidth * 0.52;
    const moonY = viewportHeight * 0.23;
    const moonRadius = Math.min(viewportWidth, viewportHeight) * 0.105;
    const moonGlow = ctx.createRadialGradient(
      moonX,
      moonY,
      moonRadius * 0.35,
      moonX,
      moonY,
      moonRadius * 1.75
    );
    moonGlow.addColorStop(0, "rgba(255, 42, 42, .95)");
    moonGlow.addColorStop(0.55, "rgba(196, 0, 12, .62)");
    moonGlow.addColorStop(1, "rgba(110, 0, 0, 0)");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 1.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a7000d";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(55,0,5,.26)";
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.37;
      ctx.beginPath();
      ctx.arc(
        moonX + Math.cos(angle) * moonRadius * 0.55,
        moonY + Math.sin(angle) * moonRadius * 0.48,
        moonRadius * (0.06 + (i % 3) * 0.025),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.fillStyle = "rgba(20,20,20,.82)";
  ctx.fillRect(0, groundY(), viewportWidth, viewportHeight - groundY());
  ctx.fillStyle = "#e32636";
  ctx.fillRect(0, groundY(), viewportWidth, 4);
}

function drawBullet(context, bullet, rain = false) {
  context.save();
  context.translate(bullet.x, bullet.y);
  if (rain) context.rotate(Math.PI / 2 + bullet.angle);
  context.fillStyle = bullet.explosive ? "#ff9d1a" : "#e32636";
  context.shadowColor = bullet.explosive ? "#ff5b16" : "#ff243a";
  context.shadowBlur = bullet.explosive ? 18 : 10;
  context.beginPath();
  context.ellipse(
    0,
    0,
    rain ? 13 : bullet.explosive ? 17 : 11,
    rain ? 4 : bullet.explosive ? 8 : 4.5,
    0,
    0,
    Math.PI * 2
  );
  context.fill();
  context.restore();
}

function drawNoteProjectile(note) {
  ctx.save();
  ctx.translate(note.x, note.y);
  ctx.shadowColor = "#dc39ff";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#c235ff";
  ctx.strokeStyle = "#ff55bd";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-5, 7, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 7);
  ctx.lineTo(2, -17);
  ctx.lineTo(15, -12);
  ctx.stroke();
  ctx.restore();
}

function drawVoidProjectile(orb) {
  const scale = depthScale(orb.depth);
  const radius = (orb.charged ? 24 : 13) * scale;
  ctx.save();
  ctx.translate(orb.x, orb.y);
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#9d4be0";
  ctx.lineWidth = orb.charged ? 8 : 5;
  ctx.shadowColor = "#a84cff";
  ctx.shadowBlur = orb.charged ? 30 : 18;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBlastEffect(blast) {
  const progress = 1 - blast.life / blast.maxLife;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - progress);
  ctx.strokeStyle = blast.color;
  ctx.shadowColor = blast.color;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 11 * (1 - progress * 0.5);
  ctx.beginPath();
  ctx.arc(blast.x, blast.y, blast.radius * progress, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFirePatch(fire) {
  const y = laneY(fire.depth) - 4;
  ctx.save();
  ctx.translate(fire.x, y);
  ctx.globalAlpha = Math.min(1, fire.life * 2);
  for (let i = 0; i < 7; i += 1) {
    const x = (i - 3) * 18;
    const flame = 16 + Math.sin(missionElapsed * 13 + i) * 8;
    const gradient = ctx.createLinearGradient(x, 0, x, -flame);
    gradient.addColorStop(0, "#e32616");
    gradient.addColorStop(0.55, "#ff7a12");
    gradient.addColorStop(1, "#ffe14d");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x - 10, 0);
    ctx.quadraticCurveTo(x - 2, -flame * 0.55, x, -flame);
    ctx.quadraticCurveTo(x + 9, -flame * 0.42, x + 10, 0);
    ctx.fill();
  }
  ctx.restore();
}

function drawPunchEffect(punch) {
  if (!punch.activated) return;
  const progress = 1 - punch.life / punch.maxLife;
  ctx.save();
  ctx.translate(punch.x, punch.y);
  ctx.scale(punch.facing, 1);
  ctx.globalAlpha = Math.max(0, 1 - progress);
  if (punch.super) {
    const length = punch.range * Math.min(1, progress * 2.4);
    const gradient = ctx.createRadialGradient(length * 0.55, 0, 10, length * 0.55, 0, 105);
    gradient.addColorStop(0, "#fff04a");
    gradient.addColorStop(0.45, "#ff9d18");
    gradient.addColorStop(1, "#d51b0d");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "#ff4417";
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.moveTo(24, -42);
    ctx.quadraticCurveTo(length * 0.55, -120, length, -18);
    ctx.quadraticCurveTo(length * 0.62, 102, 24, 42);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = "#ff5a20";
    ctx.shadowColor = "#ffb21f";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.quadraticCurveTo(punch.range * 0.45, -30, punch.range, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChainEffect(effect) {
  const alpha = effect.life / effect.maxLife;
  const segments = 7;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ff3b9d";
  ctx.shadowColor = "#b72cff";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(effect.x1, effect.y1);
  for (let i = 1; i < segments; i++) {
    const progress = i / segments;
    const x = effect.x1 + (effect.x2 - effect.x1) * progress;
    const y =
      effect.y1 +
      (effect.y2 - effect.y1) * progress +
      (i % 2 ? -1 : 1) * (8 + Math.random() * 8);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(effect.x2, effect.y2);
  ctx.stroke();
  ctx.strokeStyle = "#f3a7ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawSwordSlash(slash) {
  if (!slash.activated) return;
  const progress = 1 - slash.life / slash.maxLife;
  const scale = depthScale(slash.depth);
  const baseY = slash.y - 73 * scale;
  const length = slash.execution ? 300 : slash.comboStep === 4 ? 260 : 225;
  ctx.save();
  ctx.translate(slash.x, baseY);
  ctx.scale(slash.facing, 1);
  ctx.globalAlpha = Math.max(0, 1 - progress);
  ctx.strokeStyle = "#1a0e22";
  ctx.shadowColor = "#8f35c8";
  ctx.shadowBlur = slash.execution ? 28 : 18;
  ctx.lineWidth = slash.execution ? 17 : 11;
  ctx.beginPath();
  if (slash.style === "vertical") {
    ctx.arc(45, -5, 72, -1.42, 0.75);
  } else if (slash.style === "diagonal") {
    ctx.moveTo(15, -65);
    ctx.quadraticCurveTo(length * 0.55, 0, length, 56);
  } else {
    ctx.moveTo(12, 12);
    ctx.quadraticCurveTo(length * 0.55, -22, length, 4);
  }
  ctx.stroke();
  ctx.strokeStyle = "#8e3cc5";
  ctx.lineWidth = slash.execution ? 5 : 3;
  ctx.stroke();
  ctx.restore();
}

function drawWolfClawEffect(claw) {
  const alpha = Math.max(0, claw.life / claw.maxLife);
  const scale = depthScale(claw.depth);
  const length = claw.range * scale;
  ctx.save();
  ctx.translate(claw.x, claw.y);
  ctx.scale(claw.facing, 1);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = claw.ultimate ? "#ff5b43" : "#d92f2f";
  ctx.shadowColor = "#a90000";
  ctx.shadowBlur = claw.ultimate ? 22 : 15;
  ctx.lineWidth = claw.ultimate ? 7 : 5;
  const trailCount = claw.ultimate ? 3 : 5;
  for (let i = 0; i < trailCount; i += 1) {
    const offset = (i - (trailCount - 1) / 2) * 10;
    ctx.beginPath();
    ctx.moveTo(30 * scale, -6 * scale + offset);
    ctx.quadraticCurveTo(
      length * 0.48,
      -30 * scale + offset,
      length,
      25 * scale + offset
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawShurikenProjectile(shuriken) {
  ctx.save();
  ctx.translate(shuriken.x, shuriken.y);
  ctx.rotate(shuriken.angle);
  ctx.scale(depthScale(shuriken.depth), depthScale(shuriken.depth));
  ctx.fillStyle = "#17101d";
  ctx.strokeStyle = "#8e3cc5";
  ctx.shadowColor = "#9b3bd5";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 8;
    const radius = i % 2 === 0 ? 16 : 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawXinMarks() {
  for (const mark of xinMarks) {
    if (!mark.target || !mark.target.alive) continue;
    const position = getTargetPosition(mark.target);
    const visibleCount = Math.min(5, mark.count);
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.fillStyle = "#17101d";
    ctx.strokeStyle = "#9a43d2";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#8f35c8";
    ctx.shadowBlur = 9;
    for (let i = 0; i < visibleCount; i += 1) {
      const angle = -0.9 + i * 0.42;
      ctx.save();
      ctx.translate(Math.cos(angle) * 23, Math.sin(angle) * 18);
      ctx.rotate(angle + missionElapsed * 0.25);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (mark.count > visibleCount) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#efe4ff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`×${mark.count}`, 27, -16);
    }
    ctx.restore();
  }
}

function drawRaggedCloth(context, top, bottom, width) {
  context.fillStyle = "#6e2529";
  context.beginPath();
  context.moveTo(-width, top);
  context.lineTo(width, top);
  context.lineTo(width - 3, bottom - 7);
  context.lineTo(width * 0.45, bottom);
  context.lineTo(0, bottom - 8);
  context.lineTo(-width * 0.48, bottom + 1);
  context.lineTo(-width, bottom - 5);
  context.closePath();
  context.fill();
  context.strokeStyle = "#3a1114";
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.moveTo(-width * 0.35, top + 6);
  context.lineTo(-width * 0.05, top + 17);
  context.moveTo(width * 0.2, top + 3);
  context.lineTo(width * 0.48, top + 14);
  context.stroke();
}

function drawSmallEnemy(enemy) {
  const dir = enemy.direction;
  const run = Math.sin(enemy.phase * 10);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const scale = depthScale(enemy.depth);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#351013";
  ctx.fillStyle = "#351013";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(0, -45, 9, 0, Math.PI * 2);
  ctx.stroke();
  drawRaggedCloth(ctx, -36, -17, 10);
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(13 * dir, -25);
  ctx.moveTo(0, -18);
  ctx.lineTo(-9 + run * 5, 0);
  ctx.moveTo(0, -18);
  ctx.lineTo(10 - run * 5, 0);
  ctx.stroke();
  ctx.restore();
}

function drawBruteEnemy(enemy) {
  const dir = enemy.direction;
  const run = Math.sin(enemy.phase * 6);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const scale = depthScale(enemy.depth);
  ctx.scale(scale, scale);
  ctx.strokeStyle = mutationActive ? "#253019" : "#351013";
  ctx.fillStyle = mutationActive ? "#253019" : "#351013";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, -111, 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = mutationActive ? "#53633a" : "#4f171b";
  ctx.beginPath();
  ctx.ellipse(0, -61, 37, 49, 0, 0, Math.PI * 2);
  ctx.fill();
  drawRaggedCloth(ctx, -92, -33, 34);

  if (mutationActive) {
    ctx.fillStyle = "#72844d";
    ctx.strokeStyle = "#28321b";
    ctx.lineWidth = 2;
    const bumps = [
      [-29, -92, 8], [23, -88, 10], [-35, -65, 7], [31, -57, 9],
      [-18, -38, 6], [15, -30, 8], [-10, -116, 5], [14, -108, 6]
    ];
    bumps.forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = "#d31c28";
    ctx.beginPath();
    ctx.arc(-7 * dir, -113, 3, 0, Math.PI * 2);
    ctx.arc(8 * dir, -113, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = mutationActive ? "#253019" : "#351013";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-24, -79);
  ctx.lineTo((-45 + run * 4) * dir, -51);
  ctx.moveTo(24, -79);
  ctx.lineTo((45 - run * 4) * dir, -55);
  ctx.moveTo(-16, -23);
  ctx.lineTo(-24 + run * 5, 0);
  ctx.moveTo(16, -23);
  ctx.lineTo(25 - run * 5, 0);
  ctx.stroke();

  const barWidth = 76;
  ctx.fillStyle = "rgba(0,0,0,.72)";
  ctx.fillRect(-barWidth / 2, -146, barWidth, 8);
  ctx.fillStyle = "#e32636";
  ctx.fillRect(-barWidth / 2 + 2, -144, (barWidth - 4) * (enemy.hp / enemy.maxHp), 4);
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.globalAlpha = 0.94;
  if (enemy.type === "small") drawSmallEnemy(enemy);
  else drawBruteEnemy(enemy);
  ctx.restore();
}

function drawCrater(crater) {
  const y = laneY(crater.depth) + 5;
  const scale = depthScale(crater.depth);
  ctx.save();
  ctx.globalAlpha = Math.min(1, crater.life / 0.35);
  ctx.translate(crater.x, y);
  ctx.rotate(crater.rotation);
  ctx.scale(scale, scale);
  ctx.fillStyle = crater.deep ? "rgba(18, 8, 8, .9)" : "rgba(36, 21, 18, .78)";
  ctx.strokeStyle = crater.deep ? "#090405" : "#2c1816";
  ctx.lineWidth = crater.deep ? 8 : 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, crater.radius, crater.radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = crater.deep ? "rgba(87,45,40,.9)" : "rgba(100,66,54,.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -2, crater.radius * 0.72, crater.radius * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 7; i++) {
    const angle = (Math.PI * 2 * i) / 7 + crater.rotation;
    const startX = Math.cos(angle) * crater.radius * 0.65;
    const startY = Math.sin(angle) * crater.radius * 0.2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      Math.cos(angle) * crater.radius * (1.05 + (i % 2) * 0.16),
      Math.sin(angle) * crater.radius * (0.42 + (i % 3) * 0.08)
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawCraterFrontLip(crater) {
  const y = laneY(crater.depth) + 5;
  const scale = depthScale(crater.depth);
  ctx.save();
  ctx.globalAlpha = Math.min(1, crater.life / 0.35);
  ctx.translate(crater.x, y);
  ctx.rotate(crater.rotation);
  ctx.scale(scale, scale);
  ctx.strokeStyle = crater.deep ? "#16090a" : "#3a211d";
  ctx.lineWidth = crater.deep ? 10 : 7;
  ctx.beginPath();
  ctx.ellipse(0, 2, crater.radius, crater.radius * 0.34, 0, 0.08, Math.PI - 0.08);
  ctx.stroke();
  ctx.restore();
}

function drawBoss() {
  if (!boss || !boss.alive) return;
  const dir = boss.direction;
  const scale = depthScale(boss.depth) * boss.visualScale;
  const limp = boss.enraged ? Math.sin(boss.phase * 11) * 7 : Math.max(0, Math.sin(boss.phase * 4.2)) * 13;
  const swing = boss.swingTimer > 0 ? Math.sin((boss.swingTimer / 0.52) * Math.PI) : 0;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(33,0,43,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 5, 84, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#211328";
  ctx.fillStyle = "#576b3a";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, -225, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#607a40";
  ctx.beginPath();
  ctx.ellipse(0, -125, 65, 94, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#2b1931";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(-42, -167);
  ctx.lineTo((-96 - swing * 62) * dir, -114 - swing * 54);
  ctx.moveTo(42, -167);
  ctx.lineTo((92 + swing * 65) * dir, -121 - swing * 45);
  ctx.moveTo(-29, -47);
  ctx.lineTo(-38 - limp, 0);
  ctx.moveTo(29, -47);
  ctx.lineTo(39 + limp * 0.3, 0);
  ctx.stroke();

  ctx.fillStyle = "#879d5c";
  ctx.strokeStyle = "#324020";
  ctx.lineWidth = 3;
  const bumps = [
    [-48,-186,13],[43,-180,16],[-61,-136,12],[58,-122,14],[-35,-82,11],
    [32,-64,13],[-21,-235,10],[24,-226,9],[4,-154,12],[-3,-104,10]
  ];
  bumps.forEach(([x,y,r]) => {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = "#dc38ff";
  ctx.shadowColor = "#d52dff";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(-12 * dir, -232, 5, 0, Math.PI * 2);
  ctx.arc(13 * dir, -232, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawBossProjectile(projectile) {
  const y = laneY(projectile.depth) - 76 * depthScale(projectile.depth);
  const scale = depthScale(projectile.depth);
  ctx.save();
  ctx.translate(projectile.x, y);
  ctx.rotate(projectile.angle);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#d75cff";
  ctx.lineWidth = 10;
  ctx.shadowColor = "#a600ff";
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(0, 0, 27, -1.2, 1.2);
  ctx.stroke();
  ctx.restore();
}

function drawJumpChargeBar() {
  const shownCharge = specialCharging ? specialCharge : player.jumpCharge;
  if (shownCharge <= 0) return;
  const scale = depthScale(player.depth);
  const agentHeight = activeAgent === "wolf" ? 138 : activeAgent === "xin" ? 145 : 128;
  const width = 68 * scale;
  const height = 10 * scale;
  const x = player.x - width / 2;
  const y = player.y - agentHeight * scale - 26;
  const full = shownCharge >= 1;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  ctx.fillRect(x - 3, y - 3, width + 6, height + 6);
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = full ? "#ffe14d" : "#e32636";
  ctx.shadowColor = full ? "#fff07a" : "#ff263c";
  ctx.shadowBlur = full ? 15 : 7;
  ctx.fillRect(x, y, width * shownCharge, height);
  ctx.shadowBlur = 0;
  if (full) {
    ctx.fillStyle = "#111";
    ctx.font = `900 ${Math.max(8, 9 * scale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("MAX", player.x, y + height - 1);
  }
  ctx.restore();
}

function draw() {
  ctx.save();
  if (screenShake) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }
  drawBackground();
  craters
    .slice()
    .sort((a, b) => laneY(a.depth) - laneY(b.depth))
    .forEach(drawCrater);
  // Ground fire belongs to the terrain layer so it never visually covers cannon shells.
  firePatches
    .slice()
    .sort((a, b) => laneY(a.depth) - laneY(b.depth))
    .forEach(drawFirePatch);

  const pose = player.stunTimer > 0
    ? "down"
    : player.crouching
      ? "crouch"
      : !player.grounded
        ? "jump"
        : player.vx
          ? "run"
          : "idle";
  const actors = enemies.map((enemy) => ({ y: enemy.y, draw: () => drawEnemy(enemy) }));
  actors.push({
    y: player.y,
    draw: () => {
      if (activeAgent === "wolf" && wolfVanishTimer > 1) return;
      ctx.save();
      if (playerIsInvincible()) {
        ctx.globalAlpha = 0.62 + Math.sin(missionElapsed * 28) * 0.2;
        ctx.shadowColor = "#b94df4";
        ctx.shadowBlur = 20;
      }
      if (player.flipTimer > 0) {
        const progress = 1 - player.flipTimer / FLIP_DURATION;
        const pivotY = player.y - 62 * depthScale(player.depth);
        ctx.translate(player.x, pivotY);
        ctx.rotate(player.flipDirection * progress * Math.PI * 2);
        ctx.translate(-player.x, -pivotY);
      }
      drawPlayer(
        ctx,
        player.x,
        player.y,
        depthScale(player.depth),
        player.facing,
        pose
      );
      ctx.restore();
    },
  });
  if (boss && boss.alive) actors.push({ y: boss.y, draw: drawBoss });
  actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
  drawJumpChargeBar();
  craters
    .slice()
    .sort((a, b) => laneY(a.depth) - laneY(b.depth))
    .forEach(drawCraterFrontLip);

  bullets.forEach((bullet) => drawBullet(ctx, bullet));
  noteProjectiles.forEach(drawNoteProjectile);
  chainEffects.forEach(drawChainEffect);
  swordSlashes.forEach(drawSwordSlash);
  wolfClawEffects.forEach(drawWolfClawEffect);
  punchEffects.forEach(drawPunchEffect);
  shurikenProjectiles.forEach(drawShurikenProjectile);
  voidProjectiles.forEach(drawVoidProjectile);
  blastEffects.forEach(drawBlastEffect);
  drawXinMarks();
  rainBullets.forEach((bullet) => drawBullet(ctx, bullet, true));
  bossProjectiles.forEach(drawBossProjectile);

  particles.forEach((particle) => {
    ctx.globalAlpha = Math.min(1, particle.life * 4);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 4, 4);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function loop(time) {
  if (!running) return;
  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function pressGameKey(code, repeat = false) {
  if (!GAME_KEY_CODES.has(code)) return;
  keys.add(code);
  if (
    running &&
    activeAgent === "xin" &&
    code === "Space" &&
    !repeat
  ) {
    xinAttack();
  }
  if (
    running &&
    player.stunTimer <= 0 &&
    !player.inCrater &&
    code === "KeyS" &&
    !repeat &&
    player.grounded
  ) {
    player.crouching = !player.crouching;
  }
  const canGroundJump = player.grounded;
  const canXinDoubleJump =
    activeAgent === "xin" && !player.grounded && player.jumpCount < 2;
  if (
    running &&
    player.stunTimer <= 0 &&
    code === "KeyW" &&
    !repeat &&
    (canGroundJump || canXinDoubleJump)
  ) {
    player.crouching = false;
    if (player.inCrater) {
      player.inCrater = false;
      player.craterId = null;
      player.craterImmunity = 0.85;
    }
    player.jumpCount += 1;
    const chargedJumpPower = -650 - player.jumpCharge * 310;
    player.vy = canXinDoubleJump ? -610 : chargedJumpPower;
    player.grounded = false;
    if (!canXinDoubleJump) {
      if (player.jumpCharge > 0.05) {
        const burstCount = Math.round(7 + player.jumpCharge * 13);
        makeBurst(player.x, player.y + 2, player.jumpCharge >= 1 ? "#ffe14d" : "#f08b3e", burstCount);
        playNoise(0.12, 0.055 + player.jumpCharge * 0.055, 900);
        playTone(180 + player.jumpCharge * 210, 0.14, 0.045, "triangle");
      }
      player.jumpCharge = 0;
      player.chargeReadyAnnounced = false;
    }
    if (activeAgent === "xin") {
      makeBurst(player.x, player.y + 2, "#9d6bb8", canXinDoubleJump ? 14 : 9);
      playNoise(0.14, canXinDoubleJump ? 0.1 : 0.07, 850);
      playTone(canXinDoubleJump ? 230 : 180, 0.12, 0.05, "triangle");
    }
  }
  if (
    running &&
    player.stunTimer <= 0 &&
    !player.inCrater &&
    !xinTeleportReturn &&
    !repeat &&
    (code === "KeyJ" || code === "KeyL") &&
    player.flipCooldown <= 0
  ) {
    const startedGrounded = player.grounded;
    player.flipDirection = code === "KeyJ" ? -1 : 1;
    player.flipTimer = FLIP_DURATION;
    player.flipCooldown = FLIP_COOLDOWN;
    player.facing = player.flipDirection;
    player.crouching = false;
    player.grounded = false;
    player.jumpCount = Math.max(player.jumpCount, 1);
    player.vy = startedGrounded ? -510 : Math.min(player.vy, -170);
    makeBurst(player.x, player.y - 8, "#d7e8f2", 10);
    playNoise(0.13, 0.07, 1400);
    playTone(260, 0.12, 0.035, "triangle");
  }
  if (running && player.stunTimer <= 0 && (code === "KeyA" || code === "KeyD")) {
    player.crouching = false;
  }
  if (running && !player.inCrater && code === "KeyF" && !repeat) startUltimate();
}

function releaseGameKey(code) {
  keys.delete(code);
  if (code === "Space" && running) releaseSpecialAttack();
}

function setupMobileControls() {
  const buttons = document.querySelectorAll(".touch-key[data-code]");
  buttons.forEach((button) => {
    const code = button.dataset.code;
    let pressed = false;

    const press = (event) => {
      event.preventDefault();
      if (pressed) return;
      pressed = true;
      button.classList.add("is-pressed");
      if (event.pointerId !== undefined && button.setPointerCapture) {
        button.setPointerCapture(event.pointerId);
      }
      ensureAudio();
      pressGameKey(code, false);
    };

    const release = (event) => {
      event.preventDefault();
      if (!pressed) return;
      pressed = false;
      button.classList.remove("is-pressed");
      releaseGameKey(code);
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  });
}

document.querySelector("#start-button").addEventListener("click", () => {
  showScreen("briefing");
  drawPreview();
  startBriefingMusic();
});

document.querySelectorAll(".agent-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedAgent = button.dataset.agent;
    document.querySelectorAll(".agent-button").forEach((item) => {
      item.classList.toggle("selected", item === button);
    });
    const skinLabel = selectedAgent === "long" && selectedSkin === "star" ? " · 星装甲" : "";
    agentCardLabelEl.textContent = `${agentName(selectedAgent)}${skinLabel} · 点击进入战斗`;
    drawPreview();
  });
});

document.querySelector("#skin-button").addEventListener("click", () => {
  showScreen("skins");
  drawSkinPreviews();
});

document.querySelector("#skin-back-button").addEventListener("click", () => {
  showScreen("briefing");
  drawPreview();
});

document.querySelectorAll(".skin-card").forEach((button) => {
  button.addEventListener("click", () => {
    selectedSkin = button.dataset.skin;
    selectedAgent = "long";
    document.querySelectorAll(".skin-card").forEach((item) => {
      item.classList.toggle("selected", item === button);
    });
    document.querySelectorAll(".agent-button").forEach((item) => {
      item.classList.toggle("selected", item.dataset.agent === "long");
    });
    const name = selectedSkin === "star" ? "星装甲" : "原装战甲";
    skinStatusEl.textContent = `当前装备：龙 · ${name}`;
    agentCardLabelEl.textContent = `龙${selectedSkin === "star" ? " · 星装甲" : ""} · 点击进入战斗`;
    drawSkinPreviews();
  });
});

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach((item) => {
      item.classList.toggle("selected", item === button);
    });
  });
});

document.querySelector("#agent-card").addEventListener("click", startGame);
document.querySelector("#restart-button").addEventListener("click", () => {
  if (running) resetGame();
  else startGame();
});
document.querySelector("#play-again-button").addEventListener("click", startGame);

addEventListener("keydown", (event) => {
  if (GAME_KEY_CODES.has(event.code)) {
    event.preventDefault();
  }
  pressGameKey(event.code, event.repeat);
});

addEventListener("keyup", (event) => {
  releaseGameKey(event.code);
});
addEventListener("blur", () => keys.clear());
addEventListener("resize", resizeCanvas);
addEventListener("orientationchange", () => setTimeout(resizeCanvas, 220));
if (window.visualViewport) {
  visualViewport.addEventListener("resize", resizeCanvas);
  visualViewport.addEventListener("scroll", syncViewportHeight);
}

setupMobileControls();
syncViewportHeight();
resizeCanvas();
drawPreview();
drawSkinPreviews();
requestAnimationFrame(demoLoop);
