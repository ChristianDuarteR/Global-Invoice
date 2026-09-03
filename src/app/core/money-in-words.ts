const UNITS = [
	'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete',
	'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
];

const TENS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

export function moneyInSpanish(value: number): string {
	const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
	const roundedValue = Math.round((safeValue + Number.EPSILON) * 100) / 100;
	const whole = Math.floor(roundedValue);
	const cents = Math.round((roundedValue - whole) * 100);
	const currency = whole === 1 ? 'peso' : 'pesos';
	const centsText = cents === 1 ? 'centavo' : 'centavos';

	return `${numberInSpanish(whole)} ${currency} con ${cents} ${centsText}`;
}

function numberInSpanish(value: number): string {
	if (value < 16) {
		return UNITS[value];
	}
	if (value < 20) {
		return `dieci${UNITS[value - 10]}`;
	}
	if (value < 30) {
		return value === 20 ? 'veinte' : `veinti${UNITS[value - 20]}`;
	}
	if (value < 100) {
		const tens = Math.floor(value / 10);
		const remainder = value % 10;
		return remainder ? `${TENS[tens]} y ${UNITS[remainder]}` : TENS[tens];
	}
	if (value < 1000) {
		if (value === 100) {
			return 'cien';
		}
		const hundreds = Math.floor(value / 100);
		const remainder = value % 100;
		return `${HUNDREDS[hundreds]}${remainder ? ` ${numberInSpanish(remainder)}` : ''}`;
	}
	if (value < 1_000_000) {
		const thousands = Math.floor(value / 1000);
		const remainder = value % 1000;
		const prefix = thousands === 1 ? 'mil' : `${numberInSpanish(thousands)} mil`;
		return remainder ? `${prefix} ${numberInSpanish(remainder)}` : prefix;
	}

	const millions = Math.floor(value / 1_000_000);
	const remainder = value % 1_000_000;
	const prefix = millions === 1 ? 'un millón' : `${numberInSpanish(millions)} millones`;
	return remainder ? `${prefix} ${numberInSpanish(remainder)}` : prefix;
}
