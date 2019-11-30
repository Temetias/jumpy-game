import { prop, compose, equals, dec, add, evolve, identity, ifElse } from "ramda";

const doNothing = identity;

const INPUT_QUE = { jump: false };

const playerPosState = prop("playerPos");

const equalsZero = equals(0);

const lessThanZero = n => n < 0;

const playerIsGrounded = compose(equalsZero, playerPosState);

const add100 = add(100);

const jumpTransformation = { playerVelo: add100 };

const jumpEvolve = evolve(jumpTransformation);

const jump = ifElse(playerIsGrounded, jumpEvolve, doNothing);

const gravityTransformation = { playerVelo: dec };

const gravityEvolve = evolve(gravityTransformation);

const gravity = ifElse(playerIsGrounded, doNothing, gravityEvolve);

const playerVeloState = prop("playerVelo");

const veloToPosEffect = compose(add, playerVeloState);

const getVeloTransformation = state => ({ playerPos: veloToPosEffect(state) });

const velocityEvolve = state => evolve(getVeloTransformation(state), state);

const stopTransformation = { playerVelo: () => 0, playerPos: () => 0 };

const stopEvolve = evolve(stopTransformation);

const playerHasLanded = compose(lessThanZero, playerPosState);

const velocity = ifElse(playerHasLanded, stopEvolve, velocityEvolve);

//// Impures

const jumpEffect = () => INPUT_QUE.jump ? jump : doNothing;

const resetInputQue = () => INPUT_QUE.jump = false;

function updatePlayerPos(state) {
	document.getElementById("player").style.bottom = `${playerPosState(state) / 10 + 100}px`;
}

async function frame(state) {
	await new Promise(r => setTimeout(r, 4));
	const newState = compose(
		velocity,
		gravity,
		jumpEffect(),
	)(state);
	resetInputQue();
	updatePlayerPos(state);
	frame(newState);
}

document.onkeypress = e => e.keyCode === 32 ? INPUT_QUE.jump = true : null;

export default () => frame({ playerPos: 0, playerVelo: 0 });
