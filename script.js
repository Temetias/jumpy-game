import {
	prop,
	compose,
	equals,
	dec,
	divide,
	add,
	evolve,
	identity,
	ifElse,
	allPass,
	flip,
	nth,
	subtract,
	not,
	inc,
	times,
	flatten,
	concat,
} from "ramda";

// CONSTANTS ///////////////////////

const FRAME_GAP = 4;
const DEBUG_FRAME_GAP = 10;
const JUMP_STRENGTH = 800;
const JUMP_INITIAL_STRENGTH = 100;
const GRAVITY_STRENGTH = 13;
const INITIAL_STATE = {
	previousState: {
		posX: 100,
		veloX: 0,
		posY: 0,
		veloY: 0,
	},
	posX: 100,
	veloX: 0,
	posY: 0,
	veloY: 0,
	world: [],
};

// INPUT STATE /////////////////////

const INPUT_STATE = {
	jump: false,
	forward: false,
	backward: false,
};

document.onkeydown = ({ keyCode }) => {
	keyCode === 87 ? INPUT_STATE.jump = true : null;
	keyCode === 68 ? INPUT_STATE.forward = true : null;
	keyCode === 65 ? INPUT_STATE.backward = true : null;
};

document.onkeyup = ({ keyCode }) => {
	keyCode === 87 ? INPUT_STATE.jump = false : null;
	keyCode === 68 ? INPUT_STATE.forward = false : null;
	keyCode === 65 ? INPUT_STATE.backward = false : null;
};

// PURE LOGIC //////////////////////

const doNothing = identity;
const positive = x => x > 0;
const negative = compose(not, positive);
const setTo0 = _ => 0;

const posX = prop("posX");
const veloX = prop("veloX");
const posY = prop("posY");
const veloY = prop("veloY");
const world = prop("world");
const previousState = prop("previousState");

const playerIsGroundLevel = compose(equals(0), posY);
const worldPos = state => nth(posX(state), world(state));
const playerHasGround = compose(equals(true), worldPos);
const playerIsGrounded = allPass([ playerIsGroundLevel, playerHasGround ]);

const jumpEvolve = evolve({ veloY: add(JUMP_STRENGTH), posY: add(JUMP_INITIAL_STRENGTH) });
const jump = ifElse(playerIsGrounded, jumpEvolve, doNothing);

const previousPosYPositive = compose(positive, posY, previousState);
const posYNegative = compose(negative, posY);
const fallingThroughFloor = allPass([ previousPosYPositive, posYNegative ]);

const gravityEvolve = ifElse(
	fallingThroughFloor,
	evolve({ posY: setTo0, veloY: setTo0 }),
	evolve({ veloY: flip(subtract)(GRAVITY_STRENGTH) }),
);
const gravity = ifElse(playerIsGrounded, doNothing, gravityEvolve);

const addVeloY = compose(add, veloY);
const addVeloX = compose(add, veloX);
const velocity = state => evolve({ posY: addVeloY(state), posX: addVeloX(state) }, state);

const currentState = state => ({ posX: posX(state), veloX: veloX(state), posY: posY(state), veloY: veloY(state) });
const memorizePreviousState = state => evolve({ previousState: () => currentState(state) }, state);

const goForward = evolve({ veloX: () => 1 });
const goBackward = evolve({ veloX: () => -1 });

const physics = compose(gravity, velocity);
const asPx = x => `${x}px`;
const posYAsPX = compose(asPx, add(100), flip(divide)(100), posY);

// WORLD ///////////////////////////

const getTrue = () => true;
const getFalse = () => false;

const generateGroundBlock = () => times(getTrue, 100);
const generateHoleBlock = () => concat(times(getFalse, 50), times(getTrue, 50));
const generateRandomBlock = difficulty => Math.random() > difficulty ? generateGroundBlock() : generateHoleBlock()
const generateWorld = difficulty => flatten(times(() => generateRandomBlock(difficulty), 1000));

const nthOf = flip(nth);
const getFromWorld = compose(nthOf, world);

// WRAP UP /////////////////////////

function debug(state) {
	console.log(state);
	return state;
}

function drawPlayerPos(state) {
	document.getElementById("player").style.bottom = posYAsPX(state);
	return state;
}

function drawBlock(index, ground) {
	document.getElementsByClassName(`ground${index}`)[0].style.background = ground ? "black" : "white";
}

function drawWorldBlocks(state) {
	const worldGetter = getFromWorld(state);
	const playerPosition = posX(state);
	for (let i = -100; i < 101; i++) {
		drawBlock(i, worldGetter(playerPosition + i));
	}
	return state;
}

const draw = compose(drawWorldBlocks, drawPlayerPos);

const readInputState = flip(prop)(INPUT_STATE);

const jumpEffect = () => readInputState("jump") ? jump : doNothing;
const forwardEffect = () => readInputState("forward") ? goForward : doNothing;
const backwardEffect = () => readInputState("backward") ? goBackward : doNothing;

const getFrameGap = debugMode => debugMode ? DEBUG_FRAME_GAP : FRAME_GAP;
const getDebugger = debugMode => debugMode ? debug : doNothing;

async function frame(state, debugMode = false) {
	await new Promise(r => setTimeout(r, getFrameGap(debugMode)));
	const effects = compose(jumpEffect(), forwardEffect(), backwardEffect());
	const nextState = compose(
		memorizePreviousState,
		getDebugger(debugMode),
		draw,
		physics,
		effects,
	)(state);
	frame(nextState, debugMode);
}

function populateWorldDrawBlocks() {
	for (let i = -100; i < 101; i++) {
		const block = document.createElement("div");
		block.setAttribute("class", `ground ground${i}`);
		block.style.left = `${i / 2 + 50}vw`;
		block.style.background = "black";
		document.body.prepend(block);
	}
}

export default debugMode => {
	populateWorldDrawBlocks();
	frame({ ...INITIAL_STATE, world: generateWorld(.5) }, debugMode);
};
