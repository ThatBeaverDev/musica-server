export function clamp(n: number, min: number, max: number) {
	if (n > max) return max;
	if (min > n) return min;
	return n;
}
