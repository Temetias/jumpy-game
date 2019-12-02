import { prop, compose, equals, dec, divide, add, evolve, identity, ifElse, allPass, flip, curry, nth, times, concat, flatten } from "ramda";

// CONSTANTS ////////////////////////

const FRAME_GAP = 4
const DEBUG_FRAME_GAP = FRAME_GAP + 10;
const INITIAL_STATE = { playerYPos: 0, playerYVelo: 0, world: [], worldIdx: 0 };

// GLOBAL STATE /////////////////////

const INPUT_MEM = { jump: false, forward: false, backward: false };

// UTILS ////////////////////////////

const smallerThan = curry((x, y) => x > y);
const doNothing = identity;
const smallerThan1 = smallerThan(1);
const equalsTrue = equals(true);
const add100 = add(100);
const add1 = add(1);
const divideBy = flip(divide);
const divideBy50 = divideBy(50);
const setTo0 = _ => 0;
const timesN = flip(times);
const times100 = timesN(100);
const times1000 = timesN(1000);
const times50 = timesN(50);
const aTrue = _ => true;
const aFalse = _ => false;
const getFrom = flip(nth);

// PHYSICS /////////////////////////

const playerYPos = prop("playerYPos");
const playerIsGroundLevel = compose(smallerThan1, playerYPos);
const worldIndex = prop("worldIdx");
const world = prop("world");
const ground = state => nth(worldIndex(state), world(state));
const groundExists = compose(equalsTrue, ground);
const playerIsGrounded = allPass([ groundExists, playerIsGroundLevel ]);
const jumpTransformation = { playerYVelo: add100, playerYPos: add1 };
const jumpEvolve = evolve(jumpTransformation);
const jump = ifElse(playerIsGrounded, jumpEvolve, doNothing);
const gravityTransformation = { playerYVelo: dec };
const gravityEvolve = evolve(gravityTransformation);
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
const playerYPosToPx = compose(toPx, add100, compose(divideBy50, playerYPos));
const stepTransformationFn = worldIdx => INPUT_MEM.forward ? add1(worldIdx) : INPUT_MEM.backward ? dec(worldIdx) : doNothing(worldIdx);
const stepTransformation = { worldIdx: stepTransformationFn };
const step = evolve(stepTransformation);

// WORLD ////////////////////////////

const generateGroundBlock = () => times100(aTrue);
const generateHoleBlock = () => concat(times50(aFalse), times50(aTrue));
const randomBlock = difficulty => Math.random() > difficulty ? generateGroundBlock() : generateHoleBlock();
const generateWorld = difficulty => flatten(times1000(() => randomBlock(difficulty)));
const getFromWorld = compose(getFrom, world);

// "IMPURE BUSINESS LOGIC" /////////

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

function updateBlockStyle(index, status) {
	document.getElementsByClassName(`ground${index}`)[0].style.background = status ? "black" : "white";
}

function drawWorldBlocks(state) {
	const getter = getFromWorld(state);
	const worldIdx = worldIndex(state);
	for (let i = -40; i < 41; i++) {
		updateBlockStyle(i, getter(worldIdx + i));
	}
}

async function frame(state, debugMode = false) {
	await new Promise(r => setTimeout(r, frameRateSleep(debugMode)));
	const debuggerFn = debugMode ? debug : doNothing;
	const nextState = compose(debuggerFn, step, physics, getJumpInput())(state);
	resetInputs();
	drawWorldBlocks(state);
	updatePlayerPos(nextState);
	frame(nextState, debugMode);
}


document.onkeyup = ({ keyCode }) => {
	keyCode === 68 ? INPUT_MEM.forward = false : doNothing;
	keyCode === 65 ? INPUT_MEM.backward = false : doNothing;
};
document.onkeydown = ({ keyCode }) => {
	keyCode === 87 ? INPUT_MEM.jump = true : doNothing;
	keyCode === 68 ? INPUT_MEM.forward = true : doNothing;
	keyCode === 65 ? INPUT_MEM.backward = true : doNothing;
};

export default debug => frame({ ...INITIAL_STATE, world: generateWorld(.3) }, debug);
