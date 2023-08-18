/*global Fraction, changeDpiBlob*/
(() =>
{
'use strict';
window.addEventListener("DOMContentLoaded", init);
function init ()
{
	const hasDarkMode = (() =>
	{
		if (CSS && CSS.supports)
			return CSS.supports("color-scheme", "dark");

		const el = document.createElement("div");
		el.style.display = "none";
		document.body.appendChild(el);
		let color;
		for(let i = 0, c = ["canvastext", "initial", "unset"]; i < c.length && !color; i++ )
		{
			el.style.color = c[i];
			el.style.colorScheme = "dark";
			color = getComputedStyle(el).color;
			el.style.colorScheme = "light";
			color = color !== getComputedStyle(el).color;
		}
		document.body.removeChild(el);
		return color;
	})();

	document.documentElement.classList.toggle("hasDark", hasDarkMode);

	const EL = new Proxy(id => document.getElementById(id), {
		get: (target, name) => target(name)
	});

	const elDiamTopInput = EL.diamTop;
	const elDiamBotInput = EL.diamBot;
	const elR1 = EL.r1;
	const elR2 = EL.r2;
	const elHeightInput = EL.height;
	const elL1 = EL.l1;
	const elL2 = EL.l2;
	const elL3 = EL.l3;
	const elL4 = EL.l4;
	const elAngle = EL.angle;
	const elHidden = EL.hidden;
	const elCanvasCone = EL.cone;
	const elCanvasTemplate = EL.coneTemplate;
	const elCanvasTemplateInfo = EL.coneTemplateInfo;
	const elNavbar = EL.navbar;
	const elMenuFraction = document.querySelector('[data-type="fraction"]');
				// menus = {
				//   precision: EL.precision-dropdown,
				//   mainMenu: EL.main-menu,
				// },
	const ctxCone = elCanvasCone.getContext("2d");
	const SETTINGS = new Proxy(JSON.parse(localStorage.getItem("tconeData")) || {},
		{
			inited: false,
			init (target)
			{
				for (const i in this.default)
				{
					if (!this.default[i].valid)
						continue;

					if (Array.isArray(this.default[i].valid)
							&& this.default[i].valid.indexOf(target[i]) === -1)
					{
						delete target[i];
					}
				}

				this.target = target;
				this.inited = true;
				this.save();
			},
			get: function (target, name)
			{
				if (!this.inited)
				{
					this.init(target);
				}

				if (name === "reset")
				{
					const thisTarget = this.target;
					for (const i in thisTarget)
						delete thisTarget[i];

					name = "default";
					this.save();
				}

				if (name === "default")
					return Object.keys(this.default).reduce(
						(a, v) => {return {...a, [v]: this.default[v].value};},
						{}
					);

				if (name === "valid")
					return Object.keys(this.default).reduce(
						(a, v) => {return {...a, [v]: this.default[v].valid};},
						{}
					);

				if (name === "names")
					return Object.keys(this.default).reduce(
						(a, v) => {return {...a, [v]: this.default[v].names};},
						{}
					);

				if (name === "onChange")
					return Object.keys(this.default).reduce(
						(a, v) => {return {...a, [v]: this.default[v].onChange};},
						{}
					);

				return name in target ? target[name] : this.default[name] && this.default[name].value;
			},
			set: function (target, name, value)
			{
				if (!(name in this.default))
					return true;

				if (typeof value !== typeof this.default[name].value)
				{
					switch (typeof this.default[name].value)
					{
					case "string":
						value = "" + value;
						break;
					case "number":
						value = parseFloat(value);
						break;
					case "boolean":
						value = value ? true : false;
					}
				}
				if (typeof value !== typeof this.default[name].value)
					return true;

				target[name] = value;
				for (const i in target)
				{
					if (!(i in this.default) || (this.default[i].valid && this.default[i].valid.indexOf(target[i]) === -1))
					{
						delete target[i];
					}
				}
				this.save();
				if (name === "d")
				{
					color.theme = value === 2 ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches : value;
				}
				return true;
			},
			save ()
			{
				const data = JSON.stringify(this.target);
				if (data === "{}")
					localStorage.removeItem("tconeData");
				else
					localStorage.setItem("tconeData", data);
			},
			default:
			{
				t:
				{
					/**top */
					value: 6,
				},

				b:
				{
					/**bottom */
					value: 8,
				},

				h:
				{
					/**height */
					value: 10,
				},

				d: /**dark mode */
				{
					value: 2,
					valid: [0, 1, 2],
					names: ["Light", "Dark", "Auto"],
					onChange: () =>
					{
						setTheme();
						// draw(true);
					},
				},

				p: /**precision */
				{
					value: 16,
					valid: [1, 2, 4, 8, 16, 32, 64, 128],
					onChange: () =>
					{
						// draw(true);
					}
				},

				dpi:
				{
					value: 300,
					valid: [96, 150, 300],
				},

				f: /* show as fractions */
				{
					value: 1,
					valid: [0, 1]
				}
			},
		});
	const color = new Proxy({},
		{
			theme: SETTINGS.d === 2
				? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
				: SETTINGS.d,
			colors:
					{
						get stroke ()
						{
							const c = getComputedStyle(elCanvasCone).color;
							return [c, c];
						},
						error: ["red", "red"],
						highlight: ["lightgreen", "lightgreen"],
						fill: ["#008000", "#376E37"],
						fillHover: ["#E0FFE0", "#87B987"],
						get label ()
						{
							const c = getComputedStyle(document.documentElement).getPropertyValue("--labelColor").trim();
							return [c, c];
						},
					},
			set: function (target, name, value)
			{
				if (name === "theme")
					this.theme = ~~value;

				return true;
			},
			get: function (target, name)
			{
				return name === "theme" ? this.theme : this.colors[name][~~this.theme];
			},
		});
	const fractions = (() =>
	{
		const l = {
			"½": "1/2",
			"¼": "1/4",
			"¾": "3/4",
			"⅛": "1/8",
			"⅜": "3/8",
			"⅝": "5/8",
			"⅞": "7/8",
			"⅐": "1/7",
			"⅑": "1/9",
			"⅒": "1/10",
			"⅓": "1/3",
			"⅔": "2/3",
			"⅕": "1/5",
			"⅖": "2/5",
			"⅗": "3/5",
			"⅘": "4/5",
			"⅙": "1/6",
			"⅚": "5/6",
		};
		return Object.keys(l).reduce((o, a) =>
		{
			o[o[a]] = a;
			return o;
		}, l);
	})();
	const fractionGlyphs = Object.keys(fractions).filter(a => a.length < 2).join("");
	const fractionFilter = new RegExp("[" + fractionGlyphs + "]", "g");
	const canvasWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--size"));
	const canvasHeight = canvasWidth;
	const lineWidth = 1;
				/* main body line width */
	const showErrorSides = 1;

	/** show as fraction */
	showAsFraction();

	initDropdowns();

	// /** precision dropdown */
	// dropdown(elPrecision);

	// /** DPI dropdown */
	// dropdown(elDpi);

//--------------------------------[ defaults ]------------------------------------

	let prevFocus = elDiamTopInput;
	let prevHighlightHover;
	let prevErrD1;
	let prevErrD2;
	let prevErrH;
	let highlightHover = 0;
	let highlighted = elDiamTopInput;
	let ctxD1;
	let ctxD2;
	let ctxH;
	let curX;
	let curY;

	elDiamTopInput.value = SETTINGS.t;
	elDiamBotInput.value = SETTINGS.b;
	elHeightInput.value = SETTINGS.h;
	// closeMenu();
	setTheme();
	onFocus({target: prevFocus});

	if (this.inited)
		return;

//--------------------------------[ functions ]-----------------------------------

	function drawImage (options) //canvas, d1, d2, h, _lineWidth, strokeColor, fillColor, patternOnly, fullSize) =>
	{
		const canvas = options.canvas;
		const d1 = options.top;
		const d2 = options.bottom;
		const height = options.height;
		const _lineWidth = options.lineWidth || lineWidth;
		const backgroundColor = options.background || "transparent";
		const strokeColor = options.stroke || color.stroke;
		const fillColor = options.fill || color.fill;
		const templateOnly = options.templateOnly;
		const dpi = options.dpi;

		const data = new Proxy(...(() =>
		{
			const diameter1 = Math.min(d1, d2);
			const diameter2 = Math.max(d1, d2);
			const radius1 = diameter1 / 2 /* top radius */ ;
			const radius2 = diameter2 / 2 /* bottom radius */ ;
			const circumference1 = radius1 * Math.PI * 2;
			const circumference2 = radius2 * Math.PI * 2;
			const dif = diameter2 - diameter1;
			const hT = (height * diameter2) / (dif ? dif : 0) /* triangle height (center of radius to bottom of the cone) */ ;
			const b = radius2 - radius1 ? radius2 - radius1 : 0 /* difference between top and bottom */ ;
			const rH = Math.sqrt(height * height + b * b) /* radius for cone height (cone slope length) */ ;
			const r2 = Math.sqrt(hT * hT + radius2 * radius2) /* pattern outer radius */ ;
			const r1 = r2 - rH /* pattern inner radius */ ;
			const c = Math.PI * diameter2 /* cone circumference */ ;
			// const cT = Math.PI * 2 * r2 /* total pattern circumference */ ;
			const angleRadians = d1 === d2 ? Math.PI : c / r2 /* angle in radians */ ;
			const angleDegrees = (angleRadians * 180) / Math.PI /*(360 * c) / cT*/ /* angle in degrees */ ;
			const r1Length = angleRadians * r1 /* length of top arc */ ;
			const r2Length = angleRadians * r2 /* length of bottom arc */ ;
			const arcEnd = (c1, c2, radius, angleRad, bot) => (!isFinite(radius) || !radius ? [c1, c2 + (bot ? height : 0), circumference2, c2 + (bot ? height : 0)] : [
							/* coordinates of an arc */
				c1 + Math.cos(Math.PI / 2 - angleRad / 2) * radius /* x1 */ ,
				c2 + Math.sin(Math.PI / 2 - angleRad / 2) * radius /* y1 */ ,
				c1 + Math.cos(Math.PI / 2 + angleRad / 2) * radius /* x2 */ ,
				c2 + Math.sin(Math.PI / 2 + angleRad / 2) * radius /* y2 */ ,
			]);
			const r1Ends = arcEnd(0, 0, r1, angleRadians);
			const r2Ends = arcEnd(0, 0, r2, angleRadians, true);
			const l1 = lineLength(...r1Ends);
			const l2 = lineLength(...r2Ends);
			const l3 = lineLength(r1Ends[0], r1Ends[1], r2Ends[2], r2Ends[3]);
			const bounds = [r2Ends[1] < 0 ? r2 * 2 : l2, isFinite(r2) ? r2 - Math.min(r2Ends[1], r1Ends[1]) : r2Ends[1]];
			const returnData = {
				x: canvas.width / 2,
				y: 0,
				radius1,
				radius2,
				diameter1,
				diameter2,
				circumference1,
				circumference2,
				r1,
				r2,
				angleRad: d1 === d2 ? 0 : angleRadians,
				angleDeg: d1 === d2 ? 0 : angleDegrees,
				hT,
				b,
				h: height,
				rH,
				r1Ends,
				r2Ends,
				r1Length,
				r2Length,
				l1,
				l2,
				l3,
				arcEnd,
				lineLength,
				bounds,
				dpi,
			};
			const handler = {
							/** using proxy object to convert any variables that start with _ to percentage value and $ = round to 2 decimal places */
				get: function (target, prop)
				{
					if (!(prop in target))
					{
						const func = {
							_: this.n2p,
							$: round,
						};
						const F = Object.keys(func).join("").replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&");
						const match = (prop.match(new RegExp("^([" + F + "]*)", "")) || ["", "",])[1].split("");

						if (match.length)
						{
							const key = prop.replace(new RegExp("^[" + F + "]+", ""), "");
							let val = target[key];
							for (let i = 0; i < match.length; i++)
							{
								if (key in target)
								{
									val = (val instanceof Array ? val.map(func[match[i]]) : func[match[i]](val));
									target[prop] = val;
								}
							}
						}
					}
					return target[prop];
				},
				n2p: new N2P(
					d1 === d2 ?
						Math.max((d1 / 2) * Math.PI * 2, height) :
						templateOnly ? Math.max(...bounds) :
							Math.max(
								r2,
								r2Ends[1] < 0 ? r2 * 2 : lineLength(...r2Ends),
								r2 - r2Ends[1]
							),
					(dpi ? Math.max(...bounds.map(s => s * dpi - _lineWidth)) : Math.max(canvas.width, canvas.height)) - _lineWidth * 2
				),
			};

			return [returnData, handler];
		})());
		if (dpi)
		{
			canvas.width = data.bounds[0] * data.dpi;
			canvas.height = data.bounds[1] * data.dpi;
			canvas.style.width = canvas.width + "px";
			canvas.style.height = canvas.height + "px";
		}
		if (templateOnly)
		{
			data.x = canvas.width / 2;
			data.y = -Math.min(data._r1Ends[1], data._r2Ends[1]);
		}
		else
		{
			data.y = Math.min(data._r1Ends[1], data._r2Ends[1]);
			if (data.y < 0)
				data.y = Math.abs(data.y) + _lineWidth;
			else
				data.y = _lineWidth;
		}

		const topArcEnds = data.arcEnd(data.x, data.y, data._r1, data.angleRad);
		const bottomArcEnds = data.arcEnd(
			data.x,
			data.y,
			data._r2,
			data.angleRad,
			true
		);
		const ctx = canvas.getContext("2d");

		data.topArcEnds = topArcEnds;
		data.bottomArcEnds = bottomArcEnds;
		// ctx.fillStyle = color.fill;
		ctx.save();
		ctx.fillStyle = backgroundColor;
		// ctx.fillStyle = "black";
		ctx.strokeStyle = strokeColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.lineWidth = _lineWidth;
		ctx.fillStyle = fillColor;

		ctx.beginPath();
		if (isFinite(data.r1))
		{
	// console.log(data.x, data.y, data._r1, data);
			ctx.beginPath();
			ctx.arc(
				data.x,
				data.y,
				data._r1,
				Math.PI / 2 - data.angleRad / 2,
				Math.PI / 2 + data.angleRad / 2
			);
			ctx.arc(
				data.x,
				data.y,
				data._r2,
				Math.PI / 2 + data.angleRad / 2,
				Math.PI / 2 - data.angleRad / 2,
				true
			);
			ctx.fill();
			ctx.stroke();

			ctx.beginPath();
			/* left side line */
			// drawn by stroke of 2 arcs

			/* right side line */
			ctx.moveTo(topArcEnds[0], topArcEnds[1]);
			ctx.lineTo(bottomArcEnds[0], bottomArcEnds[1]);
			ctx.stroke();

			if (!templateOnly)
			{
				ctx.beginPath();
				/* dotted line */
				ctx.setLineDash([5, 8]);
				ctx.lineWidth = _lineWidth / 4;
				ctx.moveTo(topArcEnds[2], topArcEnds[1]);
				ctx.lineTo(data.x, data.y);
				ctx.lineTo(topArcEnds[0], topArcEnds[1]);
				ctx.stroke();
				ctx.setLineDash([]);

				/* center mark */
				ctx.beginPath();
				ctx.arc(data.x, data.y, 2, 0, Math.PI * 2);
				ctx.fillStyle = "red";
				ctx.fill();
			}
		}
		else
		{
			const x = data.topArcEnds[0] - data.x + _lineWidth/2;
			const y = data.topArcEnds[1] - data.y + _lineWidth/2;
			const w = data._circumference1;
			const h = data._h;

			ctx.rect(x, y, w, h);
			ctx.fill();
			ctx.stroke();
		}

		// ctx.beginPath();
		// ctx.arc(data.x,  data.y + (4 * Math.sin(data.angleRad/2) * (Math.pow(data._r2, 3) - Math.pow(data._r1, 3)))/ (3*data.angleRad*(data._r2*data._r2 - data._r1*data._r1)) , 3, 0, Math.PI*2);
		// ctx.fillStyle = "red"
		// ctx.fill();
		ctx.restore();
		return data;
	}//drawImage()

	function draw (force)
	{
		// Inputs
		const d1Value = filter(elDiamTopInput.value);
		const d2Value = filter(elDiamBotInput.value); //.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
		const hValue = filter(elHeightInput.value); //.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
		const prevD1Frac = new Fraction("" + SETTINGS.t);
		const prevD2Frac = new Fraction("" + SETTINGS.b);
		const prevHFrac = new Fraction("" + SETTINGS.h);
		const D1 = new Fraction(d1Value || 0);
		const D2 = new Fraction(d2Value || 0);
		const H = new Fraction(hValue || 0);
		const errD1 = !D1.valueOf();
		const errD2 = !D2.valueOf();
		const errH = !H.valueOf();
		const d1 = errD1 ? prevD1Frac.valueOf() : D1.valueOf();
		const d2 = errD2 ? prevD2Frac.valueOf() : D2.valueOf();
		const h = errH ? prevHFrac.valueOf() : H.valueOf();

		if (force !== true && !(SETTINGS.t !== d1
										|| SETTINGS.b !== d2
										|| SETTINGS.h !== h
										|| prevFocus !== highlighted
										|| prevErrD1 !== errD1
										|| prevErrD2 !== errD2
										|| prevErrH !== errH
										|| prevHighlightHover !== highlightHover)
		)
			return;
		console.log(force, [
			{"SETTINGS.t": SETTINGS.t,
				d1},
			{"SETTINGS.b": SETTINGS.b,
				d2},
			{"SETTINGS.h": SETTINGS.h,
				h},
			{prevFocus,
				highlighted},
			{prevErrD1,
				errD1},
			{prevErrD2,
				errD2},
			{prevErrH,
				errH},
			{prevHighlightHover,
				highlightHover}
		]);
		prevErrD1 = errD1;
		prevErrD2 = errD2;
		prevErrH = errH;
		prevHighlightHover = highlightHover;
		//  if (e)
		//   lastFocus = e.target;
		inputWidth(elDiamTopInput);
		elDiamTopInput.classList.toggle("error", errD1);
		inputWidth(elDiamBotInput);
		elDiamBotInput.classList.toggle("error", errD2);
		inputWidth(elHeightInput);
		elHeightInput.classList.toggle("error", errH);

		elCanvasCone.width = canvasWidth;
		elCanvasCone.height = canvasHeight;
		elCanvasCone.style.width = canvasWidth + "px";
		elCanvasCone.style.height = canvasHeight + "px";
		elCanvasTemplate.width = canvasWidth;
		elCanvasTemplate.height = canvasHeight;
		elCanvasTemplate.style.width = canvasWidth + "px";
		elCanvasTemplate.style.height = canvasHeight + "px";
		ctxCone.strokeStyle = color.stroke;
		ctxCone.fillStyle = "transparent";
		//   ctx.fillStyle = color.fill;
		ctxCone.fillRect(0, 0, elCanvasCone.width, elCanvasCone.width);

		let arrow = new Arrow(ctxCone);
		const max = Math.max(d1, d2, h);
		const lineWidthOffset = 6;
		const maxWidth = elCanvasCone.width - lineWidthOffset - (max === h ? lineWidthOffset : 0) - arrow.headWidth * 2 - lineWidth * (max === h ? 0.5 : 1);
		const n2p = new N2P(max, maxWidth);
		const _h = n2p(h);
		const offsetY = (canvasHeight - _h) / 2;
		const _r1 = n2p(d1 / 2);
		const _r2 = n2p(d2 / 2);
		const dMax = Math.max(d1, d2);
		const ratio = Math.min(dMax, h) / Math.max(dMax, h);
		const t = Math.abs(ratio* h % 18 - 18); //Math.min(1, Math.max(0.1, tt)),
		const _r1Tilt = n2p(Math.max(0, d1 / (t || 1)));
		const _r2Tilt = n2p(Math.max(0, d2 / (t || 1)));
		const _x = n2p(Math.max(d1, d2)) / 2 + lineWidth;
		const arrowTopY = offsetY - lineWidthOffset;
		const arrowTopLeft = _x - _r1;
		const arrowTopRight = _x + _r1;
		const arrowBottomY = _h + offsetY + lineWidthOffset;
		const arrowBottomLeft = _x - _r2;
		const arrowBottomRight = _x + _r2;
		const arrowRightX = _x + Math.max(_r1, _r2) + lineWidthOffset;
		const arrowRightTop = offsetY + _r1Tilt;
		const arrowRightBottom = _h + offsetY - _r2Tilt;

		//top arrow
		arrow(
			[arrowTopLeft, arrowTopY, arrowTopRight, arrowTopY],
			true,
			true,
			errD1
		);
		//bottom arrow
		arrow(
			[arrowBottomLeft, arrowBottomY, arrowBottomRight, arrowBottomY],
			true,
			true,
			errD2
		);
		//vertical arrow
		arrow(
			[arrowRightX, arrowRightTop, arrowRightX, arrowRightBottom],
			true,
			true,
			errH
		);

		ctxD1 = new Path2D();
		ctxD1.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2); //top ellipse
		ctxD2 = new Path2D();
		ctxD2.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI * 2); //top ellipse

		//height path
		ctxH = new Path2D();
		ctxH.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI); //top ellipse
		ctxH.lineTo(arrowBottomLeft, _h - _r2Tilt + offsetY); //left side
		ctxH.moveTo(_x + _r1, _r1Tilt + offsetY);
		ctxH.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI, true); //bottom outside ellipse

		//mask
		ctxCone.save();
		ctxCone.beginPath();
		ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true); //top ellipse
		ctxCone.ellipse(
			_x,
			_h - _r2Tilt + offsetY,
			_r2,
			_r2Tilt,
			Math.PI,
			0,
			Math.PI,
			true
		); //bottom outside ellipse
		ctxCone.restore();
		ctxCone.clip();
		//end mask

		ctxCone.lineWidth = lineWidth;
		const highlight = (el, fillStyle) =>
		{
			ctxCone.beginPath();
			ctxCone.fillStyle = fillStyle;
			if (el === elDiamTopInput)
				ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2);
			//top ellipse close side
			else if (el === elDiamBotInput)
				ctxCone.ellipse(
					_x,
					_h - _r2Tilt + offsetY,
					_r2,
					_r2Tilt,
					0,
					0,
					Math.PI * 2
				);
			//bottom outside ellipse
			else if (el === elHeightInput)
			{
				ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, Math.PI, 0, Math.PI, true); //top ellipse
				ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI); //bottom outside ellipse
			}
			ctxCone.fill();
		};
		if (highlighted)
			highlight(highlighted, color.fill);

		if (highlightHover === 1 && highlighted !== elDiamTopInput)
			highlight(elDiamTopInput, color.fillHover);
		else if (highlightHover === 2 && highlighted !== elDiamBotInput)
			highlight(elDiamBotInput, color.fillHover);
		else if (highlightHover === 3 && highlighted !== elHeightInput)
			highlight(elHeightInput, color.fillHover);

		ctxCone.beginPath();
		ctxCone.setLineDash([_r2Tilt / 4, _r2Tilt / 3]);
		ctxCone.lineWidth /= 2;
		ctxCone.strokeStyle = errD2 && showErrorSides
			? color.error
			: color.stroke;
			// : highlightHover == 2
			// 	? color.stroke
			// 	: color.stroke;
		ctxCone.ellipse(
			_x,
			_h - _r2Tilt + offsetY,
			_r2,
			_r2Tilt,
			0,
			0,
			Math.PI,
			true
		); //bottom ellipse far side
		ctxCone.stroke();
		ctxCone.setLineDash([]);

		ctxCone.lineWidth = lineWidth * 2;
		ctxCone.beginPath();
		ctxCone.strokeStyle =
			errH && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		ctxCone.moveTo(_x + _r1, _r1Tilt + offsetY);
		ctxCone.lineTo(arrowBottomRight, _h - _r2Tilt + offsetY); //right side
		ctxCone.moveTo(_x - _r1, _r1Tilt + offsetY);
		ctxCone.lineTo(arrowBottomLeft, _h - _r2Tilt + offsetY); //left side
		ctxCone.stroke();

		ctxCone.lineWidth = lineWidth;
		ctxCone.beginPath();
		ctxCone.strokeStyle =
			errD1 && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 1 || highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI); //top ellipse close side
		ctxCone.stroke();

		ctxCone.lineWidth = lineWidth * 2;
		ctxCone.beginPath();
		ctxCone.strokeStyle =
			errD1 && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 1 || highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true); //top ellipse far side
		ctxCone.stroke();

		ctxCone.beginPath();
		ctxCone.strokeStyle =
			errD2 && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 2 || highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI); //bottom ellipse close side
		ctxCone.stroke();

		//---------------------------[ generate preview ]-----------------------------
		const data = drawImage({canvas: elCanvasTemplate, top: d1, bottom: d2, height: h, lineWidth: lineWidth, templateOnly: false});

		//-----------------------------[ generate DXF ]-------------------------------
		(() =>
		{
			const link = EL.dxf;
			if (link._prev && link._prev.d1 === d1 && link._prev.d2 === d2 && link._prev.h === h)
				return;

			link._prev = {d1, d2, h};
			const DXF = require("Drawing");
			const dxf = new DXF();
			const arcStartAngle = toRadians(270 - data.angleDeg / 2);
			const arcEndAngle = toRadians(270 + data.angleDeg / 2);
			const dxfArcEnd = radius => [
				Math.cos(arcStartAngle) * radius,
				Math.sin(arcStartAngle) * radius,
				Math.cos(arcEndAngle) * radius,
				Math.sin(arcEndAngle) * radius,
			];
			const r1e = dxfArcEnd(data.r1);
			const r2e = dxfArcEnd(data.r2);

			dxf.generateAutocadExtras();
			dxf.header("ACADVER", [[1, "AC1500"]]);
			const //vY = -(data.r2 - r2e[1] + r1e[1])/2,
				vY = -(4 * Math.sin(data.angleRad / 2)
									* (Math.pow(data.r2, 3) - Math.pow(data.r1, 3)))
									/ (3 * data.angleRad * (data.r2 * data.r2 - data.r1 * data.r1));
			const vW = r2e[1] > 0
				? data.r2 * 2
				: Math.max(data.lineLength(...r2e), data.r2 - (data.r2 - Math.abs(r1e[1])));

			dxf.viewport(
				d1 === d2 ? data.circumference1 / 2 : 0,
				d1 === d2 ? h / 2 : vY,
				d1 === d2 ? data.circumference1 / 1.5 : vW
			);
			dxf.setUnits("Inches");
			if (d1 === d2)
			{
				dxf.drawRect(0, 0, data.circumference1, h);
			}
			else
				dxf.drawPolyline(
					[
						[r2e[0], r2e[1], Math.tan(data.angleRad / 4)],
						[r2e[2], r2e[3]],
						[r1e[2], r1e[3], -Math.tan(data.angleRad / 4)],
						[r1e[0], r1e[1]],
					],
					true
				);

			setTimeout(() =>
			{
				link.setAttribute(
					"download",
					`cone_template_${data.$diameter1}x${data.$diameter2}x${data.$h}.dxf`
				);
				link.href = URL.createObjectURL(
					new Blob([dxf.toDxfString()],
						{
							type: "application/dxf",
						})
				);
			});
		})();

		//----------------------------[ generate PNG ]--------------------------------
		(() =>
		{
			const link = EL.png;
			if (link._prev && link._prev.d1 === d1 && link._prev.d2 === d2 && link._prev.h === h && link._prev.dpi === SETTINGS.dpi)
				return;

			link._prev = {d1, d2, h, dpi: SETTINGS.dpi};
			link.removeAttribute("download");
			link.removeAttribute("href");
			setTimeout(() =>
			{
				const canvas = document.createElement("canvas");
				drawImage(
					{
						canvas,
						top: d1,
						bottom: d2,
						height: h,
						lineWidth: 1,
						stroke: "black",
						background: "white",
						fill: "transparent",
						templateOnly: true,
						dpi: SETTINGS.dpi
					});

				canvas.toBlob(blob =>
				{
					if (!blob)
						return;

					link.setAttribute("download", `cone_template_${data.$diameter1}x${data.$diameter2}x${data.$h}_(${SETTINGS.dpi}dpi).png`);
					changeDpiBlob(blob, SETTINGS.dpi).then(_blob => link.href = URL.createObjectURL(_blob));
				});
			});
		})();

		const angleDegrees = round(toDegree(data.angleRad));

		showValue(elR1, data.r1, data.$r1);
		showValue(elR2, data.r2, data.$r2);
		showValue(elL1, data.l1, data.$l1);
		showValue(elL2, data.l2, data.$l2);
		showValue(elL3, data.l3, data.$l3);
		showValue(elL4, data.rH, data.$rH);
		showValue(elAngle, angleDegrees ? angleDegrees + "°" : NaN, angleDegrees ? round(data.angleRad) + " radians" : NaN, false);

		/* mock-up */
		const ctxR2 = elCanvasTemplateInfo.getContext("2d");
		const resStyle = window.getComputedStyle(elCanvasTemplateInfo);

		elCanvasTemplateInfo.width = parseFloat(resStyle.getPropertyValue("--width"));
		elCanvasTemplateInfo.height = parseFloat(resStyle.getPropertyValue("--height"));
		elCanvasTemplateInfo.style.width = elCanvasTemplateInfo.width + "px";
		elCanvasTemplateInfo.style.height = elCanvasTemplateInfo.height + "px";
		arrow = new Arrow(ctxR2);

		ctxR2.translate(7, 0);
		ctxR2.font = resStyle.fontWeight + " " + resStyle.fontSize + " " + resStyle.fontFamily;
		ctxR2.textAlign = "center";
		const d = drawImage({canvas: elCanvasTemplateInfo,
			top: 1,
			bottom: 2,
			height: 4,
			lineWidth: lineWidth,
			stroke: color.stroke,
			fill: "transparent"
		});
		ctxR2.lineWidth = 0.25;
		ctxR2.strokeStyle = color.stroke;
		ctxR2.fillStyle = color.stroke;

		/* R1 */
		let x1 = d.x - 28;
		let x2 = d.topArcEnds[2] - 28;
		let y1 = d.y;
		let y2 = d.topArcEnds[1] - 10;

		/** arrow R1 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elR1, [x1, y1, x2, y2],
			d.topArcEnds[1] / 2,
		]);

		/* R2 */
		ctxR2.globalAlpha = 1;
		x1 = d.x - 14;
		x2 = d.bottomArcEnds[2] - 14;
		y2 = d.bottomArcEnds[1] - 10;

		/** arrow R2 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elR2, [x1, y1, x2, y2],
			d.bottomArcEnds[1] - d._rH / 2,
		]);

		/* Angle */
		x1 = d.x;
		y1 = d.y + 40;
		x2 = x1 + 30;
		y2 = y1;

		/** arrow Angle */
		ctxR2.save();
		ctxR2.textAlign = "start";
		ctxR2.textBaseline = "middle";
		const fontSize = parseFloat(resStyle.fontSize) / 3;
		arrow([x1, y1, x2, y2], true, false, false, [
			elAngle, [x2, y2 + fontSize, x1, y1 + fontSize], -5,
			true,
		]);
		ctxR2.restore();

		/* L1 */
		x1 = d.topArcEnds[0] - 8;
		y1 = d.topArcEnds[1] - 8;
		x2 = d.topArcEnds[2] + 8;
		y2 = d.topArcEnds[3] - 8;

		/** arrow L1 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elL1, [x1, y1, x2, y2],
			(x1 - x2) / 2,
		]);

		/* L2 */
		x1 = d.bottomArcEnds[0] - 8;
		y1 = d.bottomArcEnds[1] - 5;
		x2 = d.bottomArcEnds[2] + 8;
		y2 = d.bottomArcEnds[3] - 5;

		/** arrow L2 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elL2, [x1, y1, x2, y2],
			(x1 - x2) / 2,
		]);

		/* L3 */
		x1 = d.topArcEnds[0] - 5;
		y1 = d.topArcEnds[1] + 8;
		x2 = d.bottomArcEnds[2] + 8;
		y2 = d.bottomArcEnds[3] - 8;

		/** arrow L3 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elL3, [x1, y1, x2, y2],
			d.lineLength(x1, y1, x2, y2) / 2.2,
		]);

		/* Height */
		x1 = d.topArcEnds[0] + 14;
		y1 = d.topArcEnds[1];
		x2 = d.bottomArcEnds[0] + 14;
		y2 = d.bottomArcEnds[1] - 8;
		//        [x1, y1, x2, y2] = getParallelLine(d.topArcEnds[0], d.topArcEnds[1], d.bottomArcEnds[0], d.bottomArcEnds[1], 14);

		/** arrow Height */
		arrow([x1, y1, x2, y2], true, true, false, [
			elL4, [x2, y2, x1, y1],
			d.lineLength(x1, y1, x2, y2) / 2,
		]);

		/* move input fields */
		let r = elDiamTopInput.getBoundingClientRect();
		let x = _x - r.width / 2 > 0 ? _x : r.width / 2;
		let y = arrowTopY - 4;

		elDiamTopInput.style.left = x - r.width / 2 + "px";
		elDiamTopInput.style.top = y - r.height + "px";

		r = elDiamBotInput.getBoundingClientRect();
		x = _x - r.width / 2 > 0 ? _x : r.width / 2;
		y = arrowBottomY + r.height + 4;
		elDiamBotInput.style.left = x - r.width / 2 + "px";
		elDiamBotInput.style.top = y - r.height + "px";

		r = elHeightInput.getBoundingClientRect();
		x = arrowRightX + 4;
		y = arrowRightTop + (arrowRightBottom - arrowRightTop) / 2;
		elHeightInput.style.left = x + "px";
		elHeightInput.style.top = y - r.height / 2 + "px";

		elHeightInput.parentNode.style.marginRight = ((arrowRightX + 4) - parseFloat(elHeightInput.style.width) >= (arrowBottomY - arrowTopY + 8)) ? elHeightInput.style.width : ((arrowRightX + 4) + parseFloat(elHeightInput.style.width)) - (canvasWidth) + "px";

		if (!errD1)
			SETTINGS.t = d1Value;

		if (!errD2)
			SETTINGS.b = d2Value;

		if (!errH)
			SETTINGS.h = hValue;

		elCanvasTemplateInfo.dataset.type = SETTINGS.f;
	}//draw()

	function Arrow (ctx, options)
	{
		const style = getComputedStyle(ctx.canvas);
		const getValue = (name, fallback) =>
		{
			let val = style.getPropertyValue("--" + name).trim();
			if (val === "" || val === '""')
				val = fallback || "";

			switch (typeof fallback)
			{
			case "number":
				val = parseFloat(val);
				break;
			case "boolean":
				val = ("" + val).toLowerCase() === "true" || "" + val === "1";
				break;
			}
			return val;
		};

		options = Object.assign(
			{
				_headWidth: getValue("arrowHeadWidth"),
				headSize: getValue("arrowHeadSize", 8),
				get headWidth ()
				{
					return this._headWidth || this.headSize / 4;
				},
				set headWidth (val)
				{
					this._headWidth = val;
				},
				fill: getValue("arrowFill", true),
				headClosed: getValue("arrowHeadClosed", true),
				showError: true,
				lineWidth: getValue("arrowLineWidth", 0.35),
				alpha: 1,
				color: getValue("arrowColor", color.stroke),
				colorError: getValue("arrowColorError", color.error),
			}, options || {}
		);

		const fillText = (el, p, dist, nopos) =>
		{
			ctx.save();
			const ca = ctx.globalAlpha;
			const resStyle = window.getComputedStyle(elCanvasTemplateInfo);

			const text = el.querySelector("span" + (SETTINGS.f || el.id === "angle" ? "" : ":nth-of-type(2)")).textContent.replace(/[()]/g,'');
			let text2 = el.querySelector("label > label").textContent;

			ctx.globalAlpha = 1;
			const [x1, y1, x2, y2] = p;
			const [px, py] = getPerpendicular(x1, y1, x2, y2, 5);
			const xp1 = x1 + px;
			const xp2 = x2 + px;
			const yp1 = y1 - py;
			const yp2 = y2 - py;
			text2 = "" + text2 + "";
			ctx.translate(...getPointOnLine(xp1, yp1, xp2, yp2, dist));
			ctx.rotate(Math.atan2(yp2 - yp1, xp2 - xp1) - Math.PI);

			const fontSize = parseFloat(resStyle.fontSize) / 1.7 + "px";
			ctx.save();
			const isnan = isNan(text);
			if (isnan)
			{
				ctx.font = "italic " + fontSize + " " + resStyle.fontFamily;
				ctx.globalAlpha = 0.5;
			}
			elHidden.style.padding = 0;
			elHidden.style.border = 0;
			elHidden.textContent = text;
			elHidden.style.fontFamily = resStyle.fontFamily;
			elHidden.style.fontSize = isnan ? fontSize : resStyle.fontSize;
			elHidden.style.fontWeight = resStyle.fontWeight;

			elHidden.innerHTML = `${text}<span style="font-size:${fontSize};">${text2}</span>`;
			if (!nopos) ctx.textAlign = "start";

			ctx.fillText(
				text,
				nopos ? -2 : -elHidden.getBoundingClientRect().width / 1.9,
				0
			);
			ctx.restore();
			ctx.fillStyle = color.label;
			ctx.font =
							resStyle.fontWeight + " " + fontSize + " " + resStyle.fontFamily;
			ctx.textAlign = "end";
			if (!nopos && !isnan) ctx.textBaseline = "bottom";

			ctx.fillText(
				text2,
				elHidden.getBoundingClientRect()
					.width / (nopos ? 1 : 2) + 2,
				0
			);
			ctx.globalAlpha = ca;
			ctx.restore();
		};
		const arrowDraw = (e, a) =>
		{
			const adjust = 0;//a * 100 - 100;
			ctx.lineWidth = options.lineWidth;
			ctx.globalAlpha = options.alpha * (options.fill && a ? a : 1);
			ctx.strokeStyle = e && options.showError ? options.colorError : colorBrightness(options.color, adjust);
			ctx.fillStyle = e && options.showError ? options.colorError : colorBrightness(options.color, adjust);
			if (options.fill)
				ctx.fill();

			ctx.stroke();
		};
		const drawArrow = (x1, y1, x2, y2, start, end, err) =>
		{
			const rad = angle(x1, y1, x2, y2);
			ctx.save();
						/** line */
			ctx.beginPath();
			ctx.moveTo(...getPointOnLine(
				x1,
				y1,
				x2,
				y2,
				options.headClosed && start ? options.headSize : 0
			)
			);
			ctx.lineTo(...getPointOnLine(
				x2,
				y2,
				x1,
				y1,
				options.headClosed && end ? options.headSize : 0
			)
			);
			arrowDraw(err);
			ctx.restore();
						/** arrows */
			if (start)
			{
				ctx.save();
				ctx.beginPath();
				ctx.translate(x1, y1);
				ctx.rotate(rad);
				ctx.moveTo(options.headSize, -options.headWidth);
				ctx.lineTo(0, 0);
				ctx.lineTo(options.headSize, options.headWidth);
				if (options.headClosed)
					ctx.lineTo(options.headSize, -options.headWidth);

				arrowDraw(err, options.lineWidth);
				ctx.restore();
			}
			if (end)
			{
				ctx.save();
				ctx.beginPath();
				ctx.translate(x2, y2);
				ctx.rotate(rad);
				ctx.moveTo(-options.headSize, -options.headWidth);
				ctx.lineTo(0, 0);
				ctx.lineTo(-options.headSize, options.headWidth);
				if (options.headClosed)
					ctx.lineTo(-options.headSize, -options.headWidth);

				arrowDraw(err, options.lineWidth);
				ctx.restore();
			}
		};
		return Object.assign((p, start, end, err, text) =>
		{
			if (start || end)
				drawArrow(...p, start, end, err);

			if (text)
				fillText(...text);
		}, options);
	}//Arrow()

	function showAsFraction (f)
	{
		if (f !== undefined)
			SETTINGS.f = f;

		f = SETTINGS.f;
		elMenuFraction.value = f;
		elMenuFraction.setAttribute("value", f);
	}

	function dropdown (el)
	{
		const elDropdown = el.querySelector(".dropdown-list");
		const elUl = el.querySelector("ul");
		const elOption = document.createElement("li");
		const setting = el.dataset.setting;
		const list = SETTINGS.valid[el.dataset.setting];
		const names = SETTINGS.names[el.dataset.setting] || [];

		let placeholder;
		for (let i = 0, val = 1, max = 0, o; i < list.length; i++)
		{
			o = elUl.children[i] || elOption.cloneNode(true);
			if (el.dataset.setting === "p")
			{
				val = i ? val * 2 : i+1;
				o.textContent = !i ? "Round" : "1⁄" + val;
			}
			else
			{
				val = list[i];
				o.textContent = names[i] || val;
			}
			o.value = val;
			const selected = SETTINGS[setting] === val;
			o.classList.toggle("default", val === SETTINGS.default[setting]);
			o.classList.add("option");
			o.classList.toggle("selected", selected);
			if (!elUl.children[i])
			{
				elUl.appendChild(o);
			}

			if (selected)
				elDropdown.dataset.value = o.textContent;

			elHidden.textContent = o.textContent;
			if (elHidden.clientWidth > max)
			{
				max = elHidden.clientWidth;
				placeholder = o.textContent;
			}
		}
		elUl.parentNode.parentNode.dataset.placeholder = placeholder;
		el.querySelector('input[type="checkbox"]').checked = false;
		if (el._inited)
			return;

		(el.classList.contains("dropdown-box") ? el : el.querySelector('.dropdown-box')).addEventListener("click", evt =>
		{
			if (evt.target.tagName !== "LABEL")
				popup(el.querySelector('input[type="checkbox"]'), evt.target.classList.contains("option"));

			if (!evt.target.classList.contains("option"))
				return;

			SETTINGS[setting] = evt.target.value;
			dropdown(el);
//      closeMenu(setting);
			if (SETTINGS.onChange[setting] instanceof Function)
				SETTINGS.onChange[setting](evt.target.value);

			draw(true);
			evt.preventDefault();
		});
		el._inited = true;
	}

	function toRadians (ang)
	{
		return (ang * Math.PI) / 180;
	}

	function toDegree (ang)
	{
		return (ang * 180) / Math.PI;
	}

	function lineLength (x1, y1, x2, y2)
	{
		return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
	}

	// function getParallelLine (x1, y1, x2, y2, dist)
	// {
	// 	const [px, py] = getPerpendicular(x2, y2, x1, y1, dist);
	// 	const xp1 = x1 + px;
	// 	const xp2 = x2 + px;
	// 	const yp1 = y1 - py;
	// 	const yp2 = y2 - py;

	// 	return [...getPointOnLine(xp2, yp2, xp1, yp1, 0), ...getPointOnLine(xp1, yp1, xp2, yp2, 0)];
	// }

	function getPointOnLine (x1, y1, x2, y2, dist)
	{
		const len = lineLength(x1, y1, x2, y2);
		const t = dist / len;

		return [(1 - t) * x1 + t * x2, (1 - t) * y1 + t * y2];
	}

	function colorBrightness (sColor, iAmount)
	{
		const colorValues = sColor.match(/([0-9]+)/g);
		let hexColor = "#";
		for (let i = 0; i < colorValues.length; i++)
		{
			let col = parseInt(colorValues[i]);
			col = Math.min(255, Math.max(0, col + Math.round(iAmount * 255 / 100)));
			hexColor += col.toString(16).padStart(2, "0");
		}
		return hexColor;
	}

	function getPerpendicular (x1, y1, x2, y2, len)
	{
		let px = y1 - y2;
		let py = x1 - x2;
		const dist = len / Math.hypot(px, py);

		px *= dist;
		py *= dist;
		return [px, py];
	}

	function angle (cx, cy, ex, ey)
	{
		return Math.atan2(ey - cy, ex - cx);
	}

	function isNan (t)
	{
		return ("" + t).match(/^(NaN|Infinity|undefined|n\/a|N\/A)$/);
	}

	function showValue (el, ...args)
	{
		const children = el.querySelectorAll("span");
		const f = t => (isNan(t) ? "N/A" : t);

		el.classList.remove("na");

		if (args[args.length - 1] !== false)
			el.value = args[0];

		for (let i = 0, na; i < args.length; i++)
		{
			if (!children[i]) continue;

			const ff = fractionFormat(fractionLimit(args[i], SETTINGS.p), args[i]);
			const val = i || args[args.length - 1] === false ? args[i] : ff[0];
			na = isNan(val);
			if (na)
				el.classList.add("na");

			if (!i && ff[1] !== ff[2])
			{
				el.dataset.up = ff[1] > ff[2];
			}
			children[i].classList.toggle("na", na);
			children[i].innerHTML = i ? "(" + f(val) + ")" : f(val);
		}
	}

	function inputWidth (el)
	{
		for (let i = 0, style = getComputedStyle(el); i < style.length; i++)
			elHidden.style[style[i]] = style[i].match(/color/i) ? "transparent" : style[style[i]];

		elHidden.style.padding = "0.5em";
		elHidden.textContent = el.value;
		el.style.width = elHidden.getBoundingClientRect().width + "px";
	}

	function filter (t)
	{
		return t
			.replace(fractionFilter, e => " " + fractions[e])
			.replace(/[^-\d .,\\/]/g, "")
			.replace(/-/g, " ")
			.replace(/\\/g, "/")
			.replace(/([0-9]+),([0-9]+\.[0-9]+)/g, "$1$2")
			.replace(/,/g, ".")
			.replace(/([\s/.])\1+/g, "$1")
			.trim();
	}

	function N2P (max, size)
	{
		return n => (n * size) / max || 0;
	}

	function round (n, d)
	{
		d = Math.pow(10, d || 2);
		d = Math.round(n * d) / d;
		return d;
	}

	function fractionLimit (num, denominator)
	{
		if (denominator === undefined)
			denominator = SETTINGS.p;

		if (denominator > 0)
			return new Fraction(Math.round(new Fraction(num) * denominator), denominator).toFraction(true);
		return new Fraction(Math.floor(new Fraction(num)), 1).toFraction(true);
	}

	function fractionFormat (fraction, n)
	{
		const roundN = round(n);
		const ret = [n, roundN === Infinity ? 0 : roundN, parseFloat(new Fraction(fraction).toString())];
		ret[0] = fraction.replace(/^([0-9]+)\/([0-9]+)|([0-9]+)(\s+([0-9]+)\/([0-9]+))|([0-9]+)/,
			(...args) =>
			{
				let r = args[3] || args[7] || "";
				// if (args[1] || args[5])
				// {
				const round1 = round((args[1] || args[5]) / (args[2] || args[6]) || 0);
				const round2 = round(n % 1);
				console.log(n, round1, round2, (args[1] || args[5] || 0), (args[2] || args[6] || 0));
								// r += (r !== "" ? " "
				//  r += (r !== "" ? (round1 == round2 ? " " : "~")
				r += (r !== "" ? (round1 === round2 ? " " : round1 > round2 ? "▿" : "▵")
					: "")
					+ ((args[1] || args[5]) ? `${args[1] || args[5]}⁄${args[2] || args[6]}` : "");
				// }
				// r += (r !== "" ? " " : "") + `<sup>${args[1] || args[5]}</sup>&frasl;<sub>${args[2] || args[6]}</sub>`;
				return r;
			}
		);
		return ret;
	}

	function setTheme (theme)
	{
		if (theme === undefined)
			theme = SETTINGS.d;

		if (theme === 2)
			document.documentElement.removeAttribute("theme");
		else
			document.documentElement.setAttribute("theme", SETTINGS.d ? "dark" : "light");

		SETTINGS.d = theme;
		const style = EL.dropdownStyle || document.createElement("style");
		const oSelectStyle = getComputedStyle(document.querySelector("select"));
		const sStyle = Array.from(oSelectStyle).map(k => `${k}:${oSelectStyle[k]}`).join(";");
		const css = `label.dropdown{${sStyle}}`;
		style.innerHTML = css;
		style.id = "dropdownStyle";
		document.head.insertBefore(style, document.head.querySelector("[rel='stylesheet']"));
		document.documentElement.style.setProperty("--textColor", getComputedStyle(document.documentElement).color);
	}

	function onTextInput (evt)
	{
		if (evt.timeStamp - onTextInput.timeStamp < 10)
			return;

		onTextInput.timeStamp = evt.timeStamp;

		const char = evt.key || evt.data;
		if (char === "Enter")
			return evt.target[(evt.shiftKey ? "previous" : "next") + "ElementSibling"].focus();

		if ((char === "-" && filter(evt.target.value.substr(0, evt.target.selectionStart) + char))
				|| (char && !char.match(new RegExp("[^\\d\\/., " + fractionGlyphs + "]"))))
		{
			return true;
		}

		if (evt.type === "keydown" && (evt.ctrlKey || (char.length > 1 && char !== "Processing")))
			return true;

		evt.preventDefault();
		evt.stopPropagation();
		evt.stopImmediatePropagation();
		return false;
	}

	function onBlur ()
	{
		setTimeout(() =>
		{
			if (document.activeElement.tagName !== "INPUT")
			{
				highlightHover = 0;
				highlighted = null;
				prevFocus = false;
				draw();
			}
		});
	}

	function onFocus (evt)
	{
		highlighted = evt.target;
		highlighted.selectionStart = highlighted.value.length;
		draw();
		prevFocus = highlighted;
		setTimeout(highlighted.select.bind(highlighted));
	}

	function onInput ()
	{
		draw();
		onMouseMove(
			{
				x: curX,
				y: curY,
				target: elCanvasCone,
			});
	}

	function onMouseMove (evt)
	{
		curX = evt.offsetX;
		curY = evt.offsetY;

		const highlightHoverNew =
			ctxD1 && ctxCone.isPointInPath(ctxD1, curX, curY) ?
				1 :
				ctxD2 && ctxCone.isPointInPath(ctxD2, curX, curY) ?
					2 :
					ctxH && ctxCone.isPointInPath(ctxH, curX, curY) ?
						3 :
						0;
		if (highlightHoverNew !== highlightHover) highlightHover = highlightHoverNew;

		draw();
	}

	function onClick (evt)
	{
		curX = evt.offsetX;
		curY = evt.offsetY;

		let el;
		if (ctxCone.isPointInPath(ctxD1, curX, curY))
			el = elDiamTopInput;

		if (ctxCone.isPointInPath(ctxD2, curX, curY))
			el = elDiamBotInput;

		if (ctxCone.isPointInPath(ctxH, curX, curY))
			el = elHeightInput;

		if (el)
			highlighted = el;

		if (!highlighted)
			return;

		if (el)
			evt.preventDefault();

		highlightHover = 0;
		highlighted.focus();
		if (evt.type === "dblclick") // && highlightedPrev === highlighted)
			highlighted.select();

	}

	function popup (p, close)
	{
		if (!document.body.popups)
			document.body.popups = [];

		if (!p)
		{
			while ((p = document.body.popups[document.body.popups.length-1]))
				popup(p, true);
		}

		if (!p)
			return;

		const index = document.body.popups.indexOf(p);
		if (close)
			p.checked = false;

		if (p.checked)
		{
			if (index === -1)
				document.body.popups.push(p);
		}
		else
			document.body.popups.splice(index, 1);

		if (document.body.popups.length)
			document.body.dataset.popup = document.body.popups[document.body.popups.length-1].dataset.popup;
		else
			delete document.body.dataset.popup;

	}

	elCanvasCone.addEventListener("mousemove", onMouseMove);
	elCanvasCone.addEventListener("mousedown", onClick);
	elCanvasCone.addEventListener("dblclick", onClick);
	const addEventListeners = el =>
	{
		el.addEventListener("blur", onBlur);
		el.addEventListener("focus", onFocus);
		el.addEventListener("input", onInput);
		el.addEventListener("keydown", onTextInput);
		el.addEventListener("beforeinput", onTextInput); //mobile
		el.addEventListener("textInput", onTextInput); //mobile
	};
	document.querySelectorAll(".input input").forEach(addEventListeners);

	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", evt =>
	{
		if (SETTINGS.d !== 2) return;

		color.theme = evt.matches;
		setTheme();
		draw(true);
	});

	elNavbar.addEventListener("click", e =>
	{
		// let clicked = false;
		let t;

		if (e.target.dataset.popup)
			popup(e.target);

		switch (e.target.dataset.type)
		{
		case "reset":
			popup();
			// eslint-disable-next-line no-unused-expressions
			SETTINGS.reset;
			init();
			// clicked = true;
			e.preventDefault();
			setTimeout(() => SETTINGS.reset);
			break;

		case "fraction":
			t = SETTINGS.f;
			if (++t > 1)
				t = 0;

			showAsFraction(t);
			draw(true);
			// clicked = true;
			break;
		}
		// if (e.target.classList.contains("close-layer"))
		// {
		// 	// setTimeout(e=>(closeMenu(e.target.dataset.type)), 100);
		// 	clicked = true;
		// }
		// if (clicked)
		//   e.preventDefault();
	}, true);

	elCanvasTemplateInfo.addEventListener("click", evt =>
	{
		const f = SETTINGS.f;
		SETTINGS.f = ~~!~~elCanvasTemplateInfo.dataset.type;
		draw(true);
		SETTINGS.f = f;
		evt.preventDefault();
	});

	elCanvasTemplateInfo.addEventListener("dblclick", e =>
	{
		e.preventDefault();
	});

	function initDropdowns ()
	{
		const dropdowns = document.querySelectorAll('[data-type="dropdown"]');
		for (let i = 0; i < dropdowns.length; i++)
		{
			const elDropdown = dropdowns[i];
			const dropdownBox = elDropdown.querySelector(".dropdown-box") || document.createElement("span");

			if (!dropdownBox.classList.contains("dropdown-box"))
			{
				dropdownBox.className = "dropdown-box";
				dropdownBox.innerHTML = `
<div class="dropdown">
	<input id="${elDropdown.dataset.setting}-dropdown" type="checkbox">
	<label for="${elDropdown.dataset.setting}-dropdown" class="close-overlay" title="" data-type="${elDropdown.dataset.setting}"></label>
	<label for="${elDropdown.dataset.setting}-dropdown" class="dropdown-list"><ul></ul></label>
</div>`;
				elDropdown.appendChild(dropdownBox);
			}
			dropdown(elDropdown);
		}
	}
	document.documentElement.removeAttribute("notInited");
	this.inited = true;
}
})();