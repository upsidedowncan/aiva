export function lockScroll() {
	if (typeof document === 'undefined') return () => {};
	const prev = document.body.style.overflow;
	document.body.style.overflow = 'hidden';
	return () => {
		document.body.style.overflow = prev;
	};
}
