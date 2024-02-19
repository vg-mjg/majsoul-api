export function escapeRegexp(str: string) {
	return String(str).replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
}
