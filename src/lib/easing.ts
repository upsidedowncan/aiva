import {
	cubicOut,
	quartOut,
	cubicInOut,
	backOut,
	sineOut,
	sineInOut,
	quadInOut,
	quadOut
} from 'svelte/easing';

export const easeOutExpo = (t: number) => 1 - Math.pow(2, -10 * t);
export const easeOutQuart = quartOut;
export const easeInOutQuart = cubicInOut;
export const easeOutBack = backOut;
export const easeOutCubic = cubicOut;
export const easeOutSine = sineOut;
export const easeInOutSine = sineInOut;
export const easeInOutQuad = quadInOut;
export const easeOutQuad = quadOut;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
	const NEWTON_ITERATIONS = 4;
	const NEWTON_MIN_SLOPE = 0.001;
	const SUBDIVISION_PRECISION = 1e-7;
	const SUBDIVISION_MAX_ITERATIONS = 12;

	const sampleX: number[] = [];
	const sampleY: number[] = [];
	const A = (a1: number, a2: number) => 1.0 - 3.0 * a2 + 3.0 * a1;
	const B = (a1: number, a2: number) => 3.0 * a2 - 6.0 * a1;
	const C = (a1: number) => 3.0 * a1;

	function calcBezier(t: number, a1: number, a2: number): number {
		return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
	}
	function getSlope(t: number, a1: number, a2: number): number {
		return 3.0 * A(a1, a2) * t * t + 2.0 * B(a1, a2) * t + C(a1);
	}
	function binarySubdivide(aX: number, aA: number, aB: number): number {
		let currentT: number;
		let currentX: number;
		let i = 0;
		let a = aA;
		let b = aB;
		do {
			currentT = a + (b - a) / 2.0;
			currentX = calcBezier(currentT, x1, x2) - aX;
			if (currentX > 0.0) b = currentT;
			else a = currentT;
		} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
		return currentT;
	}
	function newtonRaphsonIterate(aX: number, aGuessT: number): number {
		for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
			const currentSlope = getSlope(aGuessT, x1, x2);
			if (currentSlope === 0.0) return aGuessT;
			const currentX = calcBezier(aGuessT, x1, x2) - aX;
			aGuessT -= currentX / currentSlope;
		}
		return aGuessT;
	}

	for (let i = 0; i < 11; ++i) sampleX[i] = calcBezier(i / 10.0, x1, x2);
	for (let i = 0; i < 10; ++i)
		sampleY[i] = calcBezier((i + 1) / 10.0, x1, x2) - calcBezier(i / 10.0, x1, x2);

	function getTForX(aX: number): number {
		let intervalStart = 0.0;
		let currentSample = 1;
		const lastSample = 10;
		for (; currentSample !== lastSample && sampleX[currentSample] <= aX; ++currentSample)
			intervalStart += 0.1;
		--currentSample;
		const dist =
			(aX - sampleX[currentSample]) / (sampleX[currentSample + 1] - sampleX[currentSample]);
		const guessForT = intervalStart + dist * 0.1;
		const initialSlope = getSlope(guessForT, x1, x2);
		if (initialSlope >= NEWTON_MIN_SLOPE) return newtonRaphsonIterate(aX, guessForT);
		if (initialSlope === 0.0) return guessForT;
		return binarySubdivide(aX, intervalStart, intervalStart + 0.1);
	}

	return (t: number) => calcBezier(getTForX(t), y1, y2);
}
