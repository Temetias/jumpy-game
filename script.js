import { prop, compose, equals, dec, divide, add, evolve, identity, ifElse, allPass, flip, curry, nth } from "ramda";

// CONSTANTS ////////////////////////

const FRAME_GAP = 4
const DEBUG_FRAME_GAP = FRAME_GAP + 10;
const INITIAL_STATE = { playerYPos: 0, playerYVelo: 0, world: [], worldIdx: 0 };

// GLOBAL STATE /////////////////////

const INPUT_MEM = { jump: false };

// PURE LOGIC ///////////////////////

const smallerThan = curry((x, y) => x > y);
const doNothing = identity;
const playerYPos = prop("playerYPos");
const smallerThan0 = smallerThan(0);
const playerIsGroundLevel = compose(smallerThan0, playerYPos);
const worldIndex = prop("worldIdx");
const world = prop("world");
const ground = state => nth(worldIndex(state), world(state));
const equalsTrue = equals(true);
const groundExists = compose(equalsTrue, ground);
const playerIsGrounded = allPass([ groundExists, playerIsGroundLevel ]);
const add100 = add(100);
const add1 = add(1);
const jumpTransformation = { playerYVelo: add100, playerYPos: add1 };
const jumpEvolve = evolve(jumpTransformation);
const jump = ifElse(playerIsGrounded, jumpEvolve, jumpEvolve);
const gravityTransformation = { playerYVelo: dec };
const gravityEvolve = evolve(gravityTransformation);
const setTo0 = _ => 0;
const landingTransformation = { playerYVelo: setTo0, playerYPos: setTo0 };
const landingEvolve = evolve(landingTransformation);
const gravity = ifElse(playerIsGrounded, landingEvolve, gravityEvolve);
const playerYVelocity = prop("playerYVelo");
const addPlayerVelocity = compose(add, playerYVelocity);
const velocityTransformation = state => ({ playerYPos: addPlayerVelocity(state) });
const velocity = state => evolve(velocityTransformation(state), state);
const physics = compose(gravity, velocity);
const frameRateSleep = debugMode => debugMode ? DEBUG_FRAME_GAP : FRAME_GAP;
const toPx = x => `${x}px`;
const divideBy50 = flip(divide)(50);
const playerYPosToPx = compose(toPx, add100, compose(divideBy50, playerYPos));
const stepTransformation = { worldIdx: add1 };
const step = evolve(stepTransformation);

// IMPURE LOGIC /////////////////////

function debug(x) {
	console.log(x);
	return x;
}

function resetInputs() {
	INPUT_MEM.jump = false;
}

const getJumpInput = () => INPUT_MEM.jump ? jump : doNothing;

function updatePlayerPos(state) {
	document.getElementById("player").style.bottom = playerYPosToPx(state);
}

function generateGroundBlock() {
	let block = [];
	for (let i = 0; i < 100; i++) {
		block.push(true);
	}
	return block;
}

function generateHoleBlock() {
	let block = [];
	for (let i = 0; i < 50; i++) {
		block.push(false);
	}
	for (let i = 0; i < 50; i++) {
		block.push(true);
	}
	return block;
}

function generateWorld() {
	let world = [];
	for (let i = 0; i < 1000; i++) {
		let generator = Math.random();
		world = generator > .3 ? [ ...world, ...generateGroundBlock() ] : [ ...world, ...generateHoleBlock() ];
	}
	return world;
}

async function frame(state, debugMode = false) {
	await new Promise(r => setTimeout(r, frameRateSleep(debugMode)));
	const debuggerFn = debugMode ? debug : doNothing;
	const nextState = compose(debuggerFn, step, physics, getJumpInput())(state);
	resetInputs();
	updatePlayerPos(nextState);
	frame(nextState, debugMode);
}

document.onkeypress = ({ keyCode }) => keyCode === 32 ? INPUT_MEM.jump = true : doNothing;

export default debug => frame({ ...INITIAL_STATE, world: generateWorld() }, debug);
