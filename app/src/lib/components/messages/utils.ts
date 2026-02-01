export function stringToColor(str: string) {
	let hash = 0;
	for (let index = 0; index < str.length; index++) {
		hash = str.charCodeAt(index) + ((hash << 5) - hash);
	}
	return hash;
}

export function intToRGB(value: number) {
	const hexValue = (value & 0x00ffffff).toString(16).toUpperCase();
	return '#' + '00000'.substring(0, 6 - hexValue.length) + hexValue;
}

export function getNameColor(name: string) {
	return intToRGB(stringToColor(name));
}
