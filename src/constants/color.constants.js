const yellow = {
	300: "#FFCE53",
	400: "#FFC043",
	500: "#F3B13C",
	600: "#EAAE3C",
	700: "#EDA434",
}

const brickLives = {
	1: "../../public/assets/gameTextures/brick_orange.svg",
	2: "../../public/assets/gameTextures/brick_purple.svg",
	3: "../../public/assets/gameTextures/brick_cyan.svg",
	4: "../../public/assets/gameTextures/brick_green.svg",
	5: "../../public/assets/gameTextures/brick_bomb.svg"
}

export const COLORS = {
	brick_1: brickLives[1],
	brick_2: brickLives[2],
	brick_3: brickLives[3],
	brick_4: brickLives[4],
	bomb: brickLives[5],

	primary: '#5f2263',
	yellow: yellow[500],
	black: '#484444',
	white: '#f9f9f9',
	transparent: 'transparent'
}