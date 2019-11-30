import { prop, compose, equals, dec, add, evolve, identity, ifElse, allPass } from "ramda";

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
const lessThan0 = n => n < 0;
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
const gravity = ifElse(playerIsGrounded, doNothing, gravityEvolve);
const playerYVelocity = prop("playerYVelo");
const travelBySpeed = compose(add, playerYVelocity);
const velocityTransformation = state => ({ playerYPos: travelBySpeed(state) });
const velocity = compose(evolve, velocityTransformation);
const frameRateSleep = debugMode => debugMode ? 200 : 4;

// IMPURE LOGIC /////////////////////

function resetInputs(_) {
	INPUT_MEM.jump = false;
	return _;
}
const jumpInput = () => INPUT_MEM.jump ? jump : doNothing;
const nextState = compose(velocity, gravity, resetInputs, jumpInput());

async function frame(state, debugMode = false) {
	await new Promise(r => setTimeout(r, frameRateSleep(debugMode)));
	const newState = nextState(state);
	updatePlayerPos(state);
	frame(newState);
}