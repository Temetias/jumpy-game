import { prop, compose, equals, dec, divide, add, evolve, identity, ifElse, allPass } from "ramda";

// CONSTANTS ////////////////////////

const FRAME_GAP = 4
const DEBUG_FRAME_GAP = FRAME_GAP + 200;
const INITIAL_STATE = { playerYPos: 0, playerYVelo: 0 };

// HELPERS //////////////////////////

function debug(x) {
	console.debug(x);
	return x;
}

// GLOBAL STATE /////////////////////

const INPUT_MEM = { jump: false };

// PURE LOGIC ///////////////////////

const doNothing = identity;
const playerYPos = prop("playerYPos");
const equals0 = equals(0);
const playerIsGroundLevel = compose(equals0, playerYPos);
const ground = prop("ground");
const equalsTrue = equals(true);
const groundExists = compose(equalsTrue, ground);
const playerIsGrounded = allPass([ groundExists, playerIsGroundLevel ]);
const add100 = add(100);
const jumpTransformation = { playerYVelo: add100 };
const jumpEvolve = evolve(jumpTransformation);
const jump = ifElse(playerIsGrounded, jumpEvolve, doNothing);
const gravityTransformation = { playerYVelo: dec };
const gravityEvolve = evolve(gravityTransformation);
const setTo0 = _ => 0;
const landingTransformation = { playerYVelo: setTo0 };
const landingEvolve = evolve(landingTransformation);
const gravity = ifElse(playerIsGrounded, landingEvolve, gravityEvolve);
const playerYVelocity = prop("playerYVelo");
const travelBySpeed = compose(add, playerYVelocity);
const velocityTransformation = state => ({ playerYPos: travelBySpeed(state) });
const velocity = compose(evolve, velocityTransformation);
const physics = compose(velocity, gravity);
const frameRateSleep = debugMode => debugMode ? DEBUG_FRAME_GAP : FRAME_GAP;
const divideBy10 = divide(10);
const toPx = x => `${x}px`;
const playerYPosToPx = compose(toPx, add100, divideBy10, playerYPos);

// IMPURE LOGIC /////////////////////

function resetInputs(_) {
	INPUT_MEM.jump = false;
	return _;
}

const getJumpInput = () => INPUT_MEM.jump ? jump : doNothing;
const inputs = compose(resetInputs, getJumpInput());
const calculateNextState = compose(physics, inputs);

function updatePlayerPos(state) {
	document.getElementById("player").style.bottom = playerYPosToPx(state);
}

async function frame(state, debugMode = false) {
	await new Promise(r => setTimeout(r, frameRateSleep(debugMode)));
	const debuggerFn = debugMode ? debug : doNothing;
	const nextState = compose(debuggerFn, calculateNextState)(state);
	updatePlayerPos(state);
	frame(nextState);
}

document.onkeypress = ({ keyCode }) => keyCode === 32 ? INPUT_MEM.jump = true : doNothing;

export default debug => frame(INITIAL_STATE, debug);
