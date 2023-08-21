/* global Fraction, changeDpiBlob, require */
(() =>
{
"use strict";
let initialized;
window.addEventListener("DOMContentLoaded", init);
function init ()
{
	const hasDarkMode = (() =>
	{
		if (CSS && CSS.supports)
			return CSS.supports("color-scheme", "dark");

		const element = document.createElement("div");
		element.style.display = "none";
		document.body.append(element);
		let color;
		for(let index = 0, c = ["canvastext", "initial", "unset"]; index < c.length && !color; index++ )
		{
			element.style.color = c[index];
			element.style.colorScheme = "dark";
			color = getComputedStyle(element).color;
			element.style.colorScheme = "light";
			color = color !== getComputedStyle(element).color;
		}
		element.remove();
		return color;
	})();

	document.documentElement.classList.toggle("has-dark", hasDarkMode);

	const EL = new Proxy(id => document.getElementById(id), {
		get: (target, name) => target(name)
	});

	const elementDiamTopInput = EL.diamTop;
	const elementDiamBotInput = EL.diamBot;
	const elementRadiusTop = EL.radTop;
	const elementRadiusBot = EL.radBot;
	const elementHeightInput = EL.height;
	const elementLengthTop = EL.lenTop;
	const elementLengthBot = EL.lenBot;
	const elementLengthDia = EL.lenDia;
	const elementLengthSide = EL.lenSide;
	const elementAngle = EL.angle;
	const elementHidden = EL.hidden;
	const elementCanvasCone = EL.cone;
	const elementCanvasTemplate = EL.coneTemplate;
	const elementCanvasTemplateInfo = EL.coneTemplateInfo;
	const elementNavbar = EL.navbar;
	const elementMenuFraction = document.querySelector("[data-type=\"fraction\"]");
	const contextCone = elementCanvasCone.getContext("2d");
	const SETTINGS = (() =>
	{
		const settings = {
			top: /* top */
			{
				value: 6,
			},

			bottom: /* bottom */
			{
				value: 8,
			},

			height: /* height */
			{
				value: 10,
			},

			theme: /* dark mode */
			{
				value: 2,
				valid: [0, 1, 2],
				names: ["Light", "Dark", "Auto"],
				onChange: (name, value) =>
				{
					color.theme = value === 2 ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches : value;
					setTheme(undefined, false);
					// draw(true);
				},
			},

			precision: /* precision */
			{
				value: 16,
				valid: [1, 2, 4, 8, 16, 32, 64, 128],
				// onChange: () =>
				// {
				// 	// draw(true);
				// }
			},

			dpi:
			{
				value: 300,
				valid: [96, 150, 300],
			},

			fractions: /* show as fractions */
			{
				value: 1,
				valid: [0, 1]
			}
		};
		const settingsName = "tconeData";
		const settingsData = JSON.parse(localStorage.getItem(settingsName)) || {};
		const settingsGetData = key => new Proxy(settings, {
			get: (target, name) => (Object.prototype.hasOwnProperty.call(settings, name) ? settings[name][key] : undefined),
			set: () => true //read-only
		});
		const settingsCommands = {
			$value: settingsGetData("value"),
			$valid: settingsGetData("valid"),
			$names: settingsGetData("names"),
			$onChange: settingsGetData("onChange"),
			$reset: () => settingsReset()
		};
		const settingsReset = () =>
		{
			for (const index in settingsData)
				delete settingsData[index];

			settingsSave();
			return settingsCommands.$value;
		};

		const settingsSave = () =>
		{
			const data = JSON.stringify(settingsData);
			if (data === "{}")
				localStorage.removeItem(settingsName);
			else
				localStorage.setItem(settingsName, data);
		};

		for (const index in settings)
		{
			if (!settings[index].valid)
				continue;

			if (Array.isArray(settings[index].valid)
				&& !settings[index].valid.includes(settingsData[index]))
			{
				delete settingsData[index];
			}
		}
		settingsSave();

		const settingsHandler = {
			get: (target, name) =>
			{
				if (Object.prototype.hasOwnProperty.call(settingsCommands, name))
					return settingsCommands[name];

				return Object.prototype.hasOwnProperty.call(target, name)
					? target[name]
					: Object.prototype.hasOwnProperty.call(settings, name) && settings[name].value;
			},

			set: (target, name, value) =>
			{
				if (!(name in settings))
					return true;

				if (typeof value !== typeof settings[name].value)
				{
					switch (typeof settings[name].value)
					{
						case "string": {
							value = "" + value;
							break;
						}
						case "number": {
							value = Number.parseFloat(value);
							break;
						}
						case "boolean": {
							value = value ? true : false;
						}
					}
				}
				if (typeof value !== typeof settings[name].value)
					return true;

				const isChanged = value !== target[name] && settings[name].onChange instanceof Function;

				if (settings[name].valid && !settings[name].valid.includes(value))
					value = settings[name].value;

				if (value === settings[name].value)
					delete target[name];
				else
					target[name] = value;

				settingsSave();

				if (isChanged)
					settings[name].onChange(name, value);

				return true;
			},

		};
		return new Proxy(settingsData, settingsHandler);
	})();
	const color = (() =>
	{
		let theme = SETTINGS.theme === 2
			? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
			: SETTINGS.theme;

		const colors = {
			error: ["red", "red"],
			highlight: ["lightgreen", "lightgreen"],
			fill: ["#008000", "#376E37"],
			fillHover: ["#E0FFE0", "#87B987"],
			get stroke ()
			{
				const c = getComputedStyle(elementCanvasCone).color;
				return [c, c];
			},
			get label ()
			{
				const c = getComputedStyle(document.documentElement).getPropertyValue("--label-color").trim();
				return [c, c];
			},
		};

		const handler = {
			set: function (target, name, value)
			{
				if (name === "theme")
					theme = Math.trunc(value);

				return true;
			},
			get: function (target, name)
			{
				return name === "theme" ? theme : target[name][Math.trunc(theme)];
			},
		};

		return new Proxy(colors, handler);
	})();

	const fractions = (() =>
	{
		const list = {
			"½": "1/2",
			"⅓": "1/3",
			"¼": "1/4",
			"⅕": "1/5",
			"⅙": "1/6",
			"⅐": "1/7",
			"⅛": "1/8",
			"⅑": "1/9",
			"⅒": "1/10",
			"⅔": "2/3",
			"⅖": "2/5",
			"¾": "3/4",
			"⅗": "3/5",
			"⅜": "3/8",
			"⅘": "4/5",
			"⅚": "5/6",
			"⅝": "5/8",
			"⅞": "7/8",
		};
		for(const key in list)
			list[list[key]] = key;

		return list;
	})();
	const fractionGlyphs = Object.keys(fractions).filter(a => a.length < 2).join("");
	const fractionFilter = new RegExp("[" + fractionGlyphs + "]", "g");
	const canvasWidth = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--size"));
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

	let previousFocus = elementDiamTopInput;
	let previousHighlightHover;
	let previousErrorDiamTop;
	let previousErrorDiamBot;
	let previousErrorHeight;
	let highlightHover = 0;
	let highlighted = elementDiamTopInput;
	let contextDiamTop;
	let contextDiamBot;
	let contextHeight;
	let currentX;
	let currentY;

	elementDiamTopInput.value = SETTINGS.top;
	elementDiamBotInput.value = SETTINGS.bottom;
	elementHeightInput.value = SETTINGS.height;
	// closeMenu();
	setTheme();
	onFocus({target: previousFocus});

	if (initialized)
		return;

//--------------------------------[ functions ]-----------------------------------

	function drawImage (options) //canvas, d1, d2, h, _lineWidth, strokeColor, fillColor, patternOnly, fullSize) =>
	{
		const canvas = options.canvas;
		const top = options.top;
		const bottom = options.bottom;
		const height = options.height;
		const _lineWidth = options.lineWidth || lineWidth;
		const backgroundColor = options.background || "transparent";
		const strokeColor = options.stroke || color.stroke;
		const fillColor = options.fill || color.fill;
		const templateOnly = options.templateOnly;
		const dpi = options.dpi;

		const data = (() =>
		{
			/** using proxy object to convert any variables that start with _ to percentage value and $ = round to 2 decimal places */
			const arcEnd = (c1, c2, radius, angleRad, isBottom) => (!Number.isFinite(radius) || !radius
				? [
					c1,
					c2 + (isBottom ? height : 0),
					circumferenceBot,
					c2 + (isBottom ? height : 0)
				]
				: [
					/* coordinates of an arc */
					c1 + Math.cos(Math.PI / 2 - angleRad / 2) * radius /* x1 */ ,
					c2 + Math.sin(Math.PI / 2 - angleRad / 2) * radius /* y1 */ ,
					c1 + Math.cos(Math.PI / 2 + angleRad / 2) * radius /* x2 */ ,
					c2 + Math.sin(Math.PI / 2 + angleRad / 2) * radius /* y2 */ ,
				]);
			const diameterTop = Math.min(top, bottom);
			const diameterBot = Math.max(top, bottom);
			const radiusTop = diameterTop / 2 /* top radius */ ;
			const radiusBot = diameterBot / 2 /* bottom radius */ ;
			const circumferenceTop = radiusTop * Math.PI * 2;
			const circumferenceBot = radiusBot * Math.PI * 2;
			const difDiameterBotTop = diameterBot - diameterTop;
			const heightTriangle = (height * diameterBot) / (difDiameterBotTop || 0) /* triangle height (center of radius to bottom of the cone) */ ;
			// const b = radiusBot - radiusTop ? radiusBot - radiusTop : 0 /* difference between top and bottom */ ;
			const difRadiusBotTop = radiusBot - radiusTop;/* difference between top and bottom */
			const radiusHeight = Math.hypot(height, difRadiusBotTop) /* radius for cone height (cone slope length) */ ;
			const templateRadiusBot = Math.hypot(heightTriangle, radiusBot) /* pattern outer radius */ ;
			const templateRadiusTop = templateRadiusBot - radiusHeight /* pattern inner radius */ ;
			const circumference = Math.PI * diameterBot /* cone circumference */ ;
			// const cT = Math.PI * 2 * r2 /* total pattern circumference */ ;
			const templateAngRadians = top === bottom ? Math.PI : circumference / templateRadiusBot /* angle in radians */ ;
			const templateAngDegrees = (templateAngRadians * 180) / Math.PI /*(360 * c) / cT*/ /* angle in degrees */ ;
			const templateLengthTop = templateAngRadians * templateRadiusTop /* length of top arc */ ;
			const templateLengthBot = templateAngRadians * templateRadiusBot /* length of bottom arc */ ;
			const templateArcEndTop = arcEnd(0, 0, templateRadiusTop, templateAngRadians);
			const templateArcEndBot = arcEnd(0, 0, templateRadiusBot, templateAngRadians, true);
			const l1 = lineLength(...templateArcEndTop);
			const l2 = lineLength(...templateArcEndBot);
			const l3 = lineLength(templateArcEndTop[0], templateArcEndTop[1], templateArcEndBot[2], templateArcEndBot[3]);
			const bounds = [templateArcEndBot[1] < 0 ? templateRadiusBot * 2 : l2, Number.isFinite(templateRadiusBot) ? templateRadiusBot - Math.min(templateArcEndBot[1], templateArcEndTop[1]) : templateArcEndBot[1]];
			const dataObject = {
				x: canvas.width / 2,
				y: 0,
				angleDeg: top === bottom ? 0 : templateAngDegrees,
				angleRad: top === bottom ? 0 : templateAngRadians,
				arcEnd,
				bounds,
				circumferenceBot,
				circumferenceTop,
				diameterBot,
				diameterTop,
				difRadiusBotTop,
				dpi,
				height,
				heightTriangle,
				l1,
				l2,
				l3,
				lineLength,
				radiusBot,
				radiusHeight,
				radiusTop,
				templateArcEndBot,
				templateArcEndTop,
				templateLengthBot,
				templateLengthTop,
				templateRadiusBot,
				templateRadiusTop,
			};
			const n2p = N2P(
				top === bottom
					? Math.max((top / 2) * Math.PI * 2, height)
					: (templateOnly
						? Math.max(...bounds)
						: Math.max(
							templateRadiusBot,
							templateRadiusBot - templateArcEndBot[1],
							templateArcEndBot[1] < 0
								? templateRadiusBot * 2
								: lineLength(...templateArcEndBot)
						)),
				(dpi ? Math.max(...bounds.map(s => s * dpi - _lineWidth))
					: Math.max(canvas.width, canvas.height)) - _lineWidth * 2
			);
			const commands = {
				_: n2p, //convert number to percentage
				$: round, //round to 2 decimal places
			};
			const handler = {
				get: function (target, property)
				{
					if (Object.prototype.hasOwnProperty.call(target, property))
						return target[property];

					const command = property[0];
					if (Object.prototype.hasOwnProperty.call(commands, command))
					{
						const name = property.slice(1);
						const commandFunction = commands[command];
						if (Object.prototype.hasOwnProperty.call(target, name))
						{
							target[property] = (Array.isArray(target[name]) ? target[name].map(commandFunction) : commandFunction(target[name]));
						}
					}
					return target[property];
				}
			};

			return new Proxy(dataObject, handler);
		})();
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
			data.y = -Math.min(data._templateArcEndTop[1], data._templateArcEndBot[1]);
		}
		else
		{
			data.y = Math.min(data._templateArcEndTop[1], data._templateArcEndBot[1]);
			data.y = data.y < 0 ? Math.abs(data.y) + _lineWidth : _lineWidth;
		}

		const topArcEnds = data.arcEnd(data.x, data.y, data._templateRadiusTop, data.angleRad);
		const bottomArcEnds = data.arcEnd(
			data.x,
			data.y,
			data._templateRadiusBot,
			data.angleRad,
			true
		);
		const context = canvas.getContext("2d");

		data.topArcEnds = topArcEnds;
		data.bottomArcEnds = bottomArcEnds;
		// ctx.fillStyle = color.fill;
		context.save();
		context.fillStyle = backgroundColor;
		// ctx.fillStyle = "black";
		context.strokeStyle = strokeColor;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.lineWidth = _lineWidth;
		context.fillStyle = fillColor;

		context.beginPath();
		if (Number.isFinite(data.templateRadiusTop))
		{
	// console.log(data.x, data.y, data._templateRadiusTop, data);
			context.beginPath();
			context.arc(
				data.x,
				data.y,
				data._templateRadiusTop,
				Math.PI / 2 - data.angleRad / 2,
				Math.PI / 2 + data.angleRad / 2
			);
			context.arc(
				data.x,
				data.y,
				data._templateRadiusBot,
				Math.PI / 2 + data.angleRad / 2,
				Math.PI / 2 - data.angleRad / 2,
				true
			);
			context.fill();
			context.stroke();

			context.beginPath();
			/* left side line */
			// drawn by stroke of 2 arcs

			/* right side line */
			context.moveTo(topArcEnds[0], topArcEnds[1]);
			context.lineTo(bottomArcEnds[0], bottomArcEnds[1]);
			context.stroke();

			if (!templateOnly)
			{
				context.beginPath();
				/* dotted line */
				context.setLineDash([5, 8]);
				context.lineWidth = _lineWidth / 4;
				context.moveTo(topArcEnds[2], topArcEnds[1]);
				context.lineTo(data.x, data.y);
				context.lineTo(topArcEnds[0], topArcEnds[1]);
				context.stroke();
				context.setLineDash([]);

				/* center mark */
				context.beginPath();
				context.arc(data.x, data.y, 2, 0, Math.PI * 2);
				context.fillStyle = "red";
				context.fill();
			}
		}
		else
		{
			const x = data.topArcEnds[0] - data.x + _lineWidth/2;
			const y = data.topArcEnds[1] - data.y + _lineWidth/2;
			const w = data._circumferenceTop;
			const h = data._height;

			context.rect(x, y, w, h);
			context.fill();
			context.stroke();
		}

		// ctx.beginPath();
		// ctx.arc(data.x,  data.y + (4 * Math.sin(data.angleRad/2) * (Math.pow(data._templateRadiusBot, 3) - Math.pow(data._templateRadiusTop, 3)))/ (3*data.angleRad*(data._templateRadiusBot*data._templateRadiusBot - data._templateRadiusTop*data._templateRadiusTop)) , 3, 0, Math.PI*2);
		// ctx.fillStyle = "red"
		// ctx.fill();
		context.restore();
		return data;
	}//drawImage()

	function draw (force)
	{
		// Inputs
		const diamTopValue = filter(elementDiamTopInput.value);
		const diamBotValue = filter(elementDiamBotInput.value); //.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
		const heightValue = filter(elementHeightInput.value); //.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
		const previousDiamTopFrac = new Fraction("" + SETTINGS.top);
		const previousDiamBotFrac = new Fraction("" + SETTINGS.bottom);
		const previousHeightFrac = new Fraction("" + SETTINGS.height);
		const diamTopFrac = new Fraction(diamTopValue || 0);
		const diamBotFrac = new Fraction(diamBotValue || 0);
		const heightFrac = new Fraction(heightValue || 0);
		const errorDiamTop = !diamTopFrac.valueOf();
		const errorDiamBot = !diamBotFrac.valueOf();
		const errorHeight = !heightFrac.valueOf();
		const diamTop = errorDiamTop ? previousDiamTopFrac.valueOf() : diamTopFrac.valueOf();
		const diamBot = errorDiamBot ? previousDiamBotFrac.valueOf() : diamBotFrac.valueOf();
		const height = errorHeight ? previousHeightFrac.valueOf() : heightFrac.valueOf();

		if (force !== true
			&& !(SETTINGS.top !== diamTop
				|| SETTINGS.bottom !== diamBot
				|| SETTINGS.height !== height
				|| previousFocus !== highlighted
				|| previousErrorDiamTop !== errorDiamTop
				|| previousErrorDiamBot !== errorDiamBot
				|| previousErrorHeight !== errorHeight
				|| previousHighlightHover !== highlightHover)
		)
			return;
		previousErrorDiamTop = errorDiamTop;
		previousErrorDiamBot = errorDiamBot;
		previousErrorHeight = errorHeight;
		previousHighlightHover = highlightHover;
		//  if (e)
		//   lastFocus = e.target;
		inputWidth(elementDiamTopInput);
		elementDiamTopInput.classList.toggle("error", errorDiamTop);
		inputWidth(elementDiamBotInput);
		elementDiamBotInput.classList.toggle("error", errorDiamBot);
		inputWidth(elementHeightInput);
		elementHeightInput.classList.toggle("error", errorHeight);

		elementCanvasCone.width = canvasWidth;
		elementCanvasCone.height = canvasHeight;
		elementCanvasCone.style.width = canvasWidth + "px";
		elementCanvasCone.style.height = canvasHeight + "px";
		elementCanvasTemplate.width = canvasWidth;
		elementCanvasTemplate.height = canvasHeight;
		elementCanvasTemplate.style.width = canvasWidth + "px";
		elementCanvasTemplate.style.height = canvasHeight + "px";
		contextCone.strokeStyle = color.stroke;
		contextCone.fillStyle = "transparent";
		//   ctx.fillStyle = color.fill;
		contextCone.fillRect(0, 0, elementCanvasCone.width, elementCanvasCone.width);

		let arrow = new Arrow(contextCone);
		const max = Math.max(diamTop, diamBot, height);
		const lineWidthOffset = 6;
		const maxWidth = elementCanvasCone.width - lineWidthOffset - (max === height ? lineWidthOffset : 0) - arrow.headWidth * 2 - lineWidth * (max === height ? 0.5 : 1);
		const n2p = N2P(max, maxWidth);
		const _height = n2p(height);
		const offsetY = (canvasHeight - _height) / 2;
		const _r1 = n2p(diamTop / 2);
		const _r2 = n2p(diamBot / 2);
		const dMax = Math.max(diamTop, diamBot);
		const ratio = Math.min(dMax, height) / Math.max(dMax, height);
		const t = Math.abs(ratio* height % 18 - 18); //Math.min(1, Math.max(0.1, tt)),
		const _r1Tilt = n2p(Math.max(0, diamTop / (t || 1)));
		const _r2Tilt = n2p(Math.max(0, diamBot / (t || 1)));
		const x = n2p(Math.max(diamTop, diamBot)) / 2 + lineWidth;
		const arrowTopY = offsetY - lineWidthOffset;
		const arrowTopLeft = x - _r1;
		const arrowTopRight = x + _r1;
		const arrowBottomY = _height + offsetY + lineWidthOffset;
		const arrowBottomLeft = x - _r2;
		const arrowBottomRight = x + _r2;
		const arrowRightX = x + Math.max(_r1, _r2) + lineWidthOffset;
		const arrowRightTop = offsetY + _r1Tilt;
		const arrowRightBottom = _height + offsetY - _r2Tilt;

		//top arrow
		arrow(
			[arrowTopLeft, arrowTopY, arrowTopRight, arrowTopY],
			true,
			true,
			errorDiamTop
		);
		//bottom arrow
		arrow(
			[arrowBottomLeft, arrowBottomY, arrowBottomRight, arrowBottomY],
			true,
			true,
			errorDiamBot
		);
		//vertical arrow
		arrow(
			[arrowRightX, arrowRightTop, arrowRightX, arrowRightBottom],
			true,
			true,
			errorHeight
		);

		contextDiamTop = new Path2D();
		contextDiamTop.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2); //top ellipse
		contextDiamBot = new Path2D();
		contextDiamBot.ellipse(x, _height - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI * 2); //top ellipse

		//height path
		contextHeight = new Path2D();
		contextHeight.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI); //top ellipse
		contextHeight.lineTo(arrowBottomLeft, _height - _r2Tilt + offsetY); //left side
		contextHeight.moveTo(x + _r1, _r1Tilt + offsetY);
		contextHeight.ellipse(x, _height - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI, true); //bottom outside ellipse

		//mask
		contextCone.save();
		contextCone.beginPath();
		contextCone.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true); //top ellipse
		contextCone.ellipse(
			x,
			_height - _r2Tilt + offsetY,
			_r2,
			_r2Tilt,
			Math.PI,
			0,
			Math.PI,
			true
		); //bottom outside ellipse
		contextCone.restore();
		contextCone.clip();
		//end mask

		contextCone.lineWidth = lineWidth;
		const highlight = (element, fillStyle) =>
		{
			contextCone.beginPath();
			contextCone.fillStyle = fillStyle;
			switch (element)
			{
				case elementDiamTopInput: {
					contextCone.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2);
					break;
				}
				case elementDiamBotInput: {
					contextCone.ellipse(
						x,
						_height - _r2Tilt + offsetY,
						_r2,
						_r2Tilt,
						0,
						0,
						Math.PI * 2
					);
					break;
				}
				case elementHeightInput: {
					contextCone.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, Math.PI, 0, Math.PI, true); //top ellipse
					contextCone.ellipse(x, _height - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI); //bottom outside ellipse

					break;
				}
			// No default
			}
			contextCone.fill();
		};
		if (highlighted)
			highlight(highlighted, color.fill);

		if (highlightHover === 1 && highlighted !== elementDiamTopInput)
			highlight(elementDiamTopInput, color.fillHover);
		else if (highlightHover === 2 && highlighted !== elementDiamBotInput)
			highlight(elementDiamBotInput, color.fillHover);
		else if (highlightHover === 3 && highlighted !== elementHeightInput)
			highlight(elementHeightInput, color.fillHover);

		contextCone.beginPath();
		contextCone.setLineDash([_r2Tilt / 4, _r2Tilt / 3]);
		contextCone.lineWidth /= 2;
		contextCone.strokeStyle = errorDiamBot && showErrorSides
			? color.error
			: color.stroke;
			// : highlightHover == 2
			// 	? color.stroke
			// 	: color.stroke;
		contextCone.ellipse(
			x,
			_height - _r2Tilt + offsetY,
			_r2,
			_r2Tilt,
			0,
			0,
			Math.PI,
			true
		); //bottom ellipse far side
		contextCone.stroke();
		contextCone.setLineDash([]);

		contextCone.lineWidth = lineWidth * 2;
		contextCone.beginPath();
		contextCone.strokeStyle =
			errorHeight && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		contextCone.moveTo(x + _r1, _r1Tilt + offsetY);
		contextCone.lineTo(arrowBottomRight, _height - _r2Tilt + offsetY); //right side
		contextCone.moveTo(x - _r1, _r1Tilt + offsetY);
		contextCone.lineTo(arrowBottomLeft, _height - _r2Tilt + offsetY); //left side
		contextCone.stroke();

		contextCone.lineWidth = lineWidth;
		contextCone.beginPath();
		contextCone.strokeStyle =
			errorDiamTop && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 1 || highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		contextCone.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI); //top ellipse close side
		contextCone.stroke();

		contextCone.lineWidth = lineWidth * 2;
		contextCone.beginPath();
		contextCone.strokeStyle =
			errorDiamTop && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 1 || highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		contextCone.ellipse(x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true); //top ellipse far side
		contextCone.stroke();

		contextCone.beginPath();
		contextCone.strokeStyle =
			errorDiamBot && showErrorSides ?
				color.error :
				color.stroke;
				// highlightHover == 2 || highlightHover == 3 ?
				// 	color.stroke :
				// 	color.stroke;
		contextCone.ellipse(x, _height - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI); //bottom ellipse close side
		contextCone.stroke();

		//---------------------------[ generate preview ]-----------------------------
		const data = drawImage({canvas: elementCanvasTemplate, top: diamTop, bottom: diamBot, height: height, lineWidth: lineWidth, templateOnly: false});
		console.log(data);
		//-----------------------------[ generate DXF ]-------------------------------
		(() =>
		{
			const link = EL.dxf;
			if (link._prev && link._prev.diamTop === diamTop && link._prev.diamBot === diamBot && link._prev.height === height)
				return;

			link._prev = {diamTop, diamBot, height};
			const DXF = require("Drawing");
			const dxf = new DXF();
			dxf.setUnits("Inches");
			const arcStartAngle = toRadians(270 - data.angleDeg / 2);
			const arcEndAngle = toRadians(270 + data.angleDeg / 2);
			const dxfArcEnd = radius => [
				Math.cos(arcStartAngle) * radius,
				Math.sin(arcStartAngle) * radius,
				Math.cos(arcEndAngle) * radius,
				Math.sin(arcEndAngle) * radius,
			];
			const arcEndTop = dxfArcEnd(data.templateRadiusTop);
			const arcEndBot = dxfArcEnd(data.templateRadiusBot);

			dxf.header("ACADVER", [[1, "AC1500"]]);
			// const vY = -(data.templateRadiusBot - r2e[1] + r1e[1])/2;
			let viewportX = data.circumferenceTop / 2;
			let viewportY = height /2 ;
			let viewportWidth = data.circumferenceTop / 1.5;
			// let viewportHeight = 0;
			const isRectangle = diamTop === diamBot;
			if (!isRectangle) //not rectangle
			{
/* failed attempt to calculate viewport size */
				// const mod = (n, m) => ((n % m) + m) % m;
				// const arcBoundingBox = (startAngle, endAngle, radius) =>
				// {
				// 	const cross0 = mod(startAngle, 360) >= mod(endAngle, 360);
				// 	const cross90 = mod(startAngle - 90, 360) >= mod(endAngle - 90, 360);
				// 	const cross180 = mod(startAngle - 180, 360) >= mod(endAngle - 180, 360);
				// 	const cross270 = mod(startAngle - 270, 360) >= mod(endAngle - 270, 360);

				// 	const startX = radius * Math.cos(startAngle);
				// 	const startY = radius * Math.sin(startAngle);
				// 	const endX = radius * Math.cos(endAngle);
				// 	const endY = radius * Math.sin(endAngle);

				// 	const right = cross0 ? +radius : Math.max(startX, endX);
				// 	const bottom = cross90 ? +radius : Math.max(startY, endY);
				// 	const left = cross180 ? -radius : Math.min(startX, endX);
				// 	const top = cross270 ? -radius : Math.min(startY, endY);
				// 	return {left, top, right, bottom};
				// };
				viewportX = Math.min(arcEndTop[0], arcEndBot[0]);
				viewportY = -(4 * Math.sin(data.angleRad / 2)
									* (Math.pow(data.templateRadiusBot, 3) - Math.pow(data.templateRadiusTop, 3)))
									/ (3 * data.angleRad * (data.templateRadiusBot * data.templateRadiusBot - data.templateRadiusTop * data.templateRadiusTop));
				viewportWidth = arcEndBot[1] > 0
					? data.templateRadiusBot * 2
					: Math.max(data.lineLength(...arcEndBot), data.templateRadiusBot - (data.templateRadiusBot - Math.abs(arcEndTop[1])));
// 				const angleStart = Math.PI - arcStartAngle;
// 				const angleEnd = Math.PI - arcEndAngle;
// 				const boundingBoxTop = arcBoundingBox(angleStart, angleEnd, data.templateRadiusTop);
// 				const boundingBoxBottom = arcBoundingBox(angleStart, angleEnd, data.templateRadiusBot);
// 				viewportX = Math.min(boundingBoxTop.left, boundingBoxBottom.left);
// 				viewportY = Math.min(boundingBoxTop.bottom, boundingBoxBottom.bottom);
// 				viewportWidth = Math.max(boundingBoxTop.right, boundingBoxBottom.right) - viewportX;
// 				viewportHeight = Math.max(boundingBoxTop.top, boundingBoxBottom.top) - viewportY;
// 				dxf.drawRect(viewportX, viewportY, viewportWidth, viewportHeight);
// 				dxf.drawRect(boundingBoxTop.left, boundingBoxTop.bottom, boundingBoxTop.right - boundingBoxTop.left, boundingBoxTop.top - boundingBoxTop.bottom);
// 				dxf.drawRect(boundingBoxBottom.left, boundingBoxBottom.bottom, boundingBoxBottom.right - boundingBoxBottom.left, boundingBoxBottom.top - boundingBoxBottom.bottom);
// console.log({arcEndTop, arcEndBot, arcStartAngle, arcEndAngle, arcStartAngleDeg: toDegree(arcStartAngle), arcEndAngleDeg: toDegree(arcEndAngle), angleStartDeg: toDegree(angleStart), angleEndDeg: toDegree(angleEnd)});
// console.log({boundingBoxTop, boundingBoxBottom});
// console.log({viewportX, viewportY, viewportWidth, viewportHeight});
			}
			dxf.setViewport(viewportX, viewportY, viewportWidth);
			if (diamTop === diamBot)
				dxf.drawRect(0, 0, data.circumferenceTop, height);
			else
				dxf.drawPolyline(
					[
						[arcEndBot[0], arcEndBot[1], Math.tan(data.angleRad / 4)],
						[arcEndBot[2], arcEndBot[3]],
						[arcEndTop[2], arcEndTop[3], -Math.tan(data.angleRad / 4)],
						[arcEndTop[0], arcEndTop[1]],
					],
					true
				);

			setTimeout(() =>
			{
				link.setAttribute(
					"download",
					`cone_template_${data.$diameterTop}x${data.$diameterBot}x${data.$height}.dxf`
				);
				link.href = URL.createObjectURL(new Blob([dxf.toDxfString()],
					{
						type: "application/dxf",
					})
				);
			});
		})();
		//--------------------------[ generate DXF end ]-------------------------------

		//----------------------------[ generate PNG ]--------------------------------
		(() =>
		{
			const link = EL.png;
			if (link._prev && link._prev.diamTop === diamTop && link._prev.diamBot === diamBot && link._prev.height === height && link._prev.dpi === SETTINGS.dpi)
				return;

			link._prev = {diamTop, diamBot, height, dpi: SETTINGS.dpi};
			link.removeAttribute("download");
			link.removeAttribute("href");
			setTimeout(() =>
			{
				const canvas = document.createElement("canvas");
				drawImage(
					{
						canvas,
						top: diamTop,
						bottom: diamBot,
						height: height,
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

					link.setAttribute("download", `cone_template_${data.$diameterTop}x${data.$diameterBot}x${data.$height}_(${SETTINGS.dpi}dpi).png`);
					changeDpiBlob(blob, SETTINGS.dpi).then(_blob => link.href = URL.createObjectURL(_blob)).catch(console.error);
				});
			});
		})();
		//-------------------------[ generate PNG end ]--------------------------------

		const angleDegrees = round(toDegree(data.angleRad));

		showValue(elementRadiusTop, data.templateRadiusTop, data.$templateRadiusTop);
		showValue(elementRadiusBot, data.templateRadiusBot, data.$templateRadiusTop);
		showValue(elementLengthTop, data.l1, data.$l1);
		showValue(elementLengthBot, data.l2, data.$l2);
		showValue(elementLengthDia, data.l3, data.$l3);
		showValue(elementLengthSide, data.radiusHeight, data.$radiusHeight);
		showValue(elementAngle, angleDegrees ? angleDegrees + "°" : Number.NaN, angleDegrees ? round(data.angleRad) + " radians" : Number.NaN, false);

		/* mock-up */
		const contextR2 = elementCanvasTemplateInfo.getContext("2d");
		const computedStyle = window.getComputedStyle(elementCanvasTemplateInfo);

		elementCanvasTemplateInfo.width = Number.parseFloat(computedStyle.getPropertyValue("--width"));
		elementCanvasTemplateInfo.height = Number.parseFloat(computedStyle.getPropertyValue("--height"));
		elementCanvasTemplateInfo.style.width = elementCanvasTemplateInfo.width + "px";
		elementCanvasTemplateInfo.style.height = elementCanvasTemplateInfo.height + "px";
		arrow = new Arrow(contextR2);

		contextR2.translate(7, 0);
		contextR2.font = computedStyle.fontWeight + " " + computedStyle.fontSize + " " + computedStyle.fontFamily;
		contextR2.textAlign = "center";
		const d = drawImage({canvas: elementCanvasTemplateInfo,
			top: 1,
			bottom: 2,
			height: 4,
			lineWidth,
			stroke: color.stroke,
			fill: "transparent"
		});
		contextR2.lineWidth = 0.25;
		contextR2.strokeStyle = color.stroke;
		contextR2.fillStyle = color.stroke;
		contextR2.globalAlpha = 1;

		/* Radius Top */
		let x1 = d.x - 28;
		let x2 = d.topArcEnds[2] - 28;
		let y1 = d.y;
		let y2 = d.topArcEnds[1] - 10;

		/** arrow Radius Top */
		arrow([x1, y1, x2, y2], true, true, false, [
			elementRadiusTop, [x1, y1, x2, y2],
			d.topArcEnds[1] / 2,
		]);

		/* Radius Bot */
		contextR2.globalAlpha = 1;
		x1 = d.x - 14;
		x2 = d.bottomArcEnds[2] - 14;
		y2 = d.bottomArcEnds[1] - 10;

		/** arrow Radius Bot */
		arrow([x1, y1, x2, y2], true, true, false, [
			elementRadiusBot, [x1, y1, x2, y2],
			d.bottomArcEnds[1] - d._radiusHeight / 2,
		]);

		/* Angle */
		x1 = d.x;
		y1 = d.y + 40;
		x2 = x1 + 30;
		y2 = y1;

		/** arrow Angle */
		contextR2.save();
		contextR2.textAlign = "start";
		contextR2.textBaseline = "middle";
		const fontSize = Number.parseFloat(computedStyle.fontSize) / 3;
		arrow([x1, y1, x2, y2], true, false, false, [
			elementAngle, [x2, y2 + fontSize, x1, y1 + fontSize], -5,
			true,
		]);
		contextR2.restore();

		/* L1 */
		x1 = d.topArcEnds[0] - 8;
		y1 = d.topArcEnds[1] - 8;
		x2 = d.topArcEnds[2] + 8;
		y2 = d.topArcEnds[3] - 8;

		/** arrow L1 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elementLengthTop, [x1, y1, x2, y2],
			(x1 - x2) / 2,
		]);

		/* L2 */
		x1 = d.bottomArcEnds[0] - 8;
		y1 = d.bottomArcEnds[1] - 5;
		x2 = d.bottomArcEnds[2] + 8;
		y2 = d.bottomArcEnds[3] - 5;

		/** arrow L2 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elementLengthBot, [x1, y1, x2, y2],
			(x1 - x2) / 2,
		]);

		/* L3 */
		x1 = d.topArcEnds[0] - 5;
		y1 = d.topArcEnds[1] + 8;
		x2 = d.bottomArcEnds[2] + 8;
		y2 = d.bottomArcEnds[3] - 8;

		/** arrow L3 */
		arrow([x1, y1, x2, y2], true, true, false, [
			elementLengthDia, [x1, y1, x2, y2],
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
			elementLengthSide, [x2, y2, x1, y1],
			d.lineLength(x1, y1, x2, y2) / 2,
		]);

		/* move input fields */
		let inputRect = elementDiamTopInput.getBoundingClientRect();
		let inputX = x - inputRect.width / 2 > 0 ? x : inputRect.width / 2;
		let inputY = arrowTopY - 4;

		elementDiamTopInput.style.left = inputX - inputRect.width / 2 + "px";
		elementDiamTopInput.style.top = inputY - inputRect.height + "px";

		inputRect = elementDiamBotInput.getBoundingClientRect();
		inputX = x - inputRect.width / 2 > 0 ? x : inputRect.width / 2;
		inputY = arrowBottomY + inputRect.height + 4;
		elementDiamBotInput.style.left = inputX - inputRect.width / 2 + "px";
		elementDiamBotInput.style.top = inputY - inputRect.height + "px";

		inputRect = elementHeightInput.getBoundingClientRect();
		inputX = arrowRightX + 4;
		inputY = arrowRightTop + (arrowRightBottom - arrowRightTop) / 2;
		elementHeightInput.style.left = inputX + "px";
		elementHeightInput.style.top = inputY - inputRect.height / 2 + "px";

		elementHeightInput.parentNode.style.marginRight = ((arrowRightX + 4) - Number.parseFloat(elementHeightInput.style.width) >= (arrowBottomY - arrowTopY + 8)) ? elementHeightInput.style.width : ((arrowRightX + 4) + Number.parseFloat(elementHeightInput.style.width)) - (canvasWidth) + "px";

		if (!errorDiamTop)
			SETTINGS.top = diamTopValue;

		if (!errorDiamBot)
			SETTINGS.bottom = diamBotValue;

		if (!errorHeight)
			SETTINGS.height = heightValue;

		elementCanvasTemplateInfo.dataset.type = SETTINGS.fractions;
	}//draw()

	function Arrow (context, options)
	{
		const style = getComputedStyle(context.canvas);
		const getValue = (name, fallback) =>
		{
			let value = style.getPropertyValue("--" + name).trim();
			if (value === "" || value === "\"\"")
				value = fallback || "";

			switch (typeof fallback)
			{
				case "number": {
					value = Number.parseFloat(value);
					break;
				}
				case "boolean": {
					value = ("" + value).toLowerCase() === "true" || "" + value === "1";
					break;
				}
			}
			return value;
		};

		options = Object.assign(
			{
				_headWidth: getValue("arrow-head-width"),
				headSize: getValue("arrow-head-size", 8),
				get headWidth ()
				{
					return this._headWidth || this.headSize / 4;
				},
				set headWidth (value)
				{
					this._headWidth = value;
				},
				fill: getValue("arrow-fill", true),
				headClosed: getValue("arrow-head-closed", true),
				showError: true,
				lineWidth: getValue("arrow-line-width", 0.35),
				alpha: 1,
				color: getValue("arrow-color", color.stroke),
				colorError: getValue("arrow-color-error", color.error),
			}, options || {}
		);
		const fillText = (element, posBox, distribution, nopos) =>
		{
			context.save();
			const contextGlobalAlpha = context.globalAlpha;
			const computedStyle = window.getComputedStyle(elementCanvasTemplateInfo);

			const text = element.querySelector(":scope > span" + (SETTINGS.fractions || element.id === "angle" ? "" : ":nth-of-type(2)")).textContent.replaceAll(/[()]/g,"");
			let text2 = element.querySelector("label > label").textContent;

			context.globalAlpha = 1;
			const [x1, y1, x2, y2] = posBox;
			const [perpendicularX, perpendicularY] = getPerpendicular(x1, y1, x2, y2, 5);
			const xp1 = x1 + perpendicularX;
			const xp2 = x2 + perpendicularX;
			const yp1 = y1 - perpendicularY;
			const yp2 = y2 - perpendicularY;
			text2 = "" + text2 + "";
			context.translate(...getPointOnLine(xp1, yp1, xp2, yp2, distribution));
			context.rotate(Math.atan2(yp2 - yp1, xp2 - xp1) - Math.PI);

			const fontSize = Number.parseFloat(computedStyle.fontSize) / 1.7 + "px";
			context.save();
			const isnan = isNan(text);
			if (isnan)
			{
				context.font = "italic " + fontSize + " " + computedStyle.fontFamily;
				context.globalAlpha = 0.5;
			}
			elementHidden.style.padding = 0;
			elementHidden.style.border = 0;
			elementHidden.textContent = text;
			elementHidden.style.fontFamily = computedStyle.fontFamily;
			elementHidden.style.fontSize = isnan ? fontSize : computedStyle.fontSize;
			elementHidden.style.fontWeight = computedStyle.fontWeight;

			elementHidden.innerHTML = `${text}<span style="font-size:${fontSize};">${text2}</span>`;
			if (!nopos) context.textAlign = "start";
			context.fillText(
				text,
				nopos ? -2 : -elementHidden.getBoundingClientRect().width / 1.9,
				0
			);
			context.restore();
			context.fillStyle = color.label;
			context.font = computedStyle.fontWeight + " " + fontSize + " " + computedStyle.fontFamily;
			context.textAlign = "end";
			if (!nopos && !isnan) context.textBaseline = "bottom";

			context.fillText(
				text2,
				elementHidden.getBoundingClientRect()
					.width / (nopos ? 1 : 2) + 2,
				0
			);
			context.globalAlpha = contextGlobalAlpha;
			context.restore();
		};
		const showArrow = (error, alpha) =>
		{
			const adjust = 0;//a * 100 - 100;
			context.lineWidth = options.lineWidth;
			context.globalAlpha = options.alpha * (options.fill && alpha ? alpha : 1);
			context.strokeStyle = error && options.showError ? options.colorError : colorBrightness(options.color, adjust);
			context.fillStyle = error && options.showError ? options.colorError : colorBrightness(options.color, adjust);
			console.trace(context.globalAlpha, alpha, Object.assign({}, options));
			if (options.fill)
				context.fill();

			context.stroke();
		};
		const drawArrow = (x1, y1, x2, y2, start, end, error) =>
		{
			const rad = angle(x1, y1, x2, y2);
			context.save();
			/** line */
			context.beginPath();
			context.moveTo(...getPointOnLine(
				x1,
				y1,
				x2,
				y2,
				options.headClosed && start ? options.headSize : 0
			)
			);
			context.lineTo(...getPointOnLine(
				x2,
				y2,
				x1,
				y1,
				options.headClosed && end ? options.headSize : 0
			)
			);
			showArrow(error);
			context.restore();
			/** arrows */
			if (start)
			{
				context.save();
				context.beginPath();
				context.translate(x1, y1);
				context.rotate(rad);
				context.moveTo(options.headSize, -options.headWidth);
				context.lineTo(0, 0);
				context.lineTo(options.headSize, options.headWidth);
				if (options.headClosed)
					context.lineTo(options.headSize, -options.headWidth);

				showArrow(error, options.lineWidth);
				context.restore();
			}
			if (end)
			{
				context.save();
				context.beginPath();
				context.translate(x2, y2);
				context.rotate(rad);
				context.moveTo(-options.headSize, -options.headWidth);
				context.lineTo(0, 0);
				context.lineTo(-options.headSize, options.headWidth);
				if (options.headClosed)
					context.lineTo(-options.headSize, -options.headWidth);

				showArrow(error, options.lineWidth);
				context.restore();
			}
		};
		return Object.assign((p, start, end, error, text) =>
		{
			if (start || end)
				drawArrow(...p, start, end, error);

			if (text)
				fillText(...text);
		}, options);
	}//Arrow()

	function showAsFraction (f)
	{
		if (f !== undefined)
			SETTINGS.fractions = f;

		f = SETTINGS.fractions;
		elementMenuFraction.value = f;
		elementMenuFraction.setAttribute("value", f);
	}

	function dropdown (element)
	{
		const elementDropdown = element.querySelector(".dropdown-list");
		const elementUl = element.querySelector("ul");
		const elementOption = document.createElement("li");
		const setting = element.dataset.setting;
		const list = SETTINGS.$valid[element.dataset.setting] || [];
		const names = SETTINGS.$names[element.dataset.setting] || [];
		let placeholder;
		for (let index = 0, value = 1, max = 0, o; index < list.length; index++)
		{
			o = elementUl.children[index] || elementOption.cloneNode(true);
			if (element.dataset.setting === "precision")
			{
				value = index ? value * 2 : index+1;
				o.textContent = index ? "1⁄" + value : "Round";
			}
			else
			{
				value = list[index];
				o.textContent = names[index] || value;
			}
			o.value = value;
			const selected = SETTINGS[setting] === value;
			o.classList.toggle("default", value === SETTINGS.$value[setting]);
			o.classList.add("option");
			o.classList.toggle("selected", selected);
			if (!elementUl.children[index])
			{
				elementUl.append(o);
			}

			if (selected)
				elementDropdown.dataset.value = o.textContent;

			elementHidden.textContent = o.textContent;
			if (elementHidden.clientWidth > max)
			{
				max = elementHidden.clientWidth;
				placeholder = o.textContent;
			}
		}
		elementUl.parentNode.parentNode.dataset.placeholder = placeholder;
		element.querySelector("input[type=\"checkbox\"]").checked = false;
		if (element._inited)
			return;

		(element.classList.contains("dropdown-box") ? element : element.querySelector(".dropdown-box")).addEventListener("click", event_ =>
		{
			if (event_.target.tagName !== "LABEL")
				popup(element.querySelector("input[type=\"checkbox\"]"), event_.target.classList.contains("option"));

			if (!event_.target.classList.contains("option"))
				return;

			SETTINGS[setting] = event_.target.value;
			dropdown(element);
//      closeMenu(setting);
			// if (SETTINGS.onChange[setting] instanceof Function)
			// 	SETTINGS.onChange[setting](event_.target.value);

			draw(true);
			event_.preventDefault();
		});
		element._inited = true;
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

	function colorBrightness (sColor, indexAmount)
	{
		const colorValues = sColor.match(/(\d+)/g);
		let hexColor = "#";
		for (const colorValue of colorValues)
		{
			let col = Number.parseInt(colorValue);
			col = Math.min(255, Math.max(0, col + Math.round(indexAmount * 255 / 100)));
			hexColor += col.toString(16).padStart(2, "0");
		}
		return hexColor;
	}

	function showValue (element, ...arguments_)
	{
		const children = element.querySelectorAll(":scope > span"); //direct children only

		element.classList.remove("na");

		if (arguments_.at(-1) !== false)
			element.value = arguments_[0];

		for (let index = 0, na; index < arguments_.length; index++)
		{
			if (!children[index]) continue;

			const ff = fractionFormat(fractionLimit(arguments_[index], SETTINGS.precision), arguments_[index]);
			const value = index || arguments_.at(-1) === false ? arguments_[index] : ff[0];
			na = isNan(value);
			if (na)
				element.classList.add("na");

			if (!index && ff[1] !== ff[2])
			{
				element.dataset.up = ff[1] > ff[2];
			}
			children[index].classList.toggle("na", na);
			children[index].textContent = index ? "(" + showNan(value) + ")" : showNan(value);
		}
	}

	function inputWidth (element)
	{
		for (let index = 0, style = getComputedStyle(element); index < style.length; index++)
			elementHidden.style[style[index]] = /color/i.test(style[index]) ? "transparent" : style[style[index]];

		elementHidden.style.padding = "0.5em";
		elementHidden.textContent = element.value;
		element.style.width = elementHidden.getBoundingClientRect().width + "px";
	}

	function filter (t)
	{
		return t
			.replace(fractionFilter, item => " " + fractions[item])
			.replaceAll(/[^\d ,./\\-]/g, "")
			.replaceAll("-", " ")
			.replaceAll("\\", "/")
			.replaceAll(/(\d+),(\d+\.\d+)/g, "$1$2")
			.replaceAll(",", ".")
			.replaceAll(/([\s./])\1+/g, "$1")
			.trim();
	}

	function fractionLimit (number_, denominator)
	{
		if (denominator === undefined)
			denominator = SETTINGS.precision;

		if (denominator > 0)
			return new Fraction(Math.round(new Fraction(number_) * denominator), denominator).toFraction(true);
		return new Fraction(Math.floor(new Fraction(number_)), 1).toFraction(true);
	}

	function fractionFormat (fraction, n)
	{
		const roundN = round(n);
		const returnValue = [n, roundN === Number.POSITIVE_INFINITY ? 0 : roundN, Number.parseFloat(new Fraction(fraction).toString())];
		returnValue[0] = fraction.replace(/^(\d+)\/(\d+)|(\d+)(\s+(\d+)\/(\d+))|(\d+)/,
			(...arguments_) =>
			{
				let r = arguments_[3] || arguments_[7] || "";
				// if (args[1] || args[5])
				// {
				const round1 = round((arguments_[1] || arguments_[5]) / (arguments_[2] || arguments_[6]) || 0);
				const round2 = round(n % 1);
				console.log(n, round1, round2, (arguments_[1] || arguments_[5] || 0), (arguments_[2] || arguments_[6] || 0));
								// r += (r !== "" ? " "
				//  r += (r !== "" ? (round1 == round2 ? " " : "~")
				r += (r === "" ? ""
					: (round1 === round2 ? " " : round1 > round2 ? "▿" : "▵"))
					+ ((arguments_[1] || arguments_[5]) ? `${arguments_[1] || arguments_[5]}⁄${arguments_[2] || arguments_[6]}` : "");
				// }
				// r += (r !== "" ? " " : "") + `<sup>${args[1] || args[5]}</sup>&frasl;<sub>${args[2] || args[6]}</sub>`;
				return r;
			}
		);
		return returnValue;
	}

	function setTheme (theme, saveSetting)
	{
		if (theme === undefined)
			theme = SETTINGS.theme;

		if (theme === 2)
			document.documentElement.removeAttribute("theme");
		else
			document.documentElement.setAttribute("theme", SETTINGS.theme ? "dark" : "light");

		if (saveSetting !== false)
			SETTINGS.theme = theme;

		const style = EL.dropdownStyle || document.createElement("style");
		const oSelectStyle = getComputedStyle(document.querySelector("select"));
		const sStyle = [...oSelectStyle].map(k => `${k}:${oSelectStyle[k]}`).join(";");
		const css = `label.dropdown{${sStyle}}`;
		style.innerHTML = css;
		style.id = "dropdownStyle";
		document.head.insertBefore(style, document.head.querySelector("[rel='stylesheet']"));
		document.documentElement.style.setProperty("--text-color", getComputedStyle(document.documentElement).color);
	}

	function onTextInput (event_)
	{
		if (event_.timeStamp - onTextInput.timeStamp < 10)
			return;

		onTextInput.timeStamp = event_.timeStamp;

		const char = event_.key || event_.data;
		if (char === "Enter")
			return event_.target[(event_.shiftKey ? "previous" : "next") + "ElementSibling"].focus();

		if ((char === "-" && filter(event_.target.value.slice(0, Math.max(0, event_.target.selectionStart)) + char))
				|| (char && !new RegExp("[^\\d\\/., " + fractionGlyphs + "]").test(char)))
		{
			return true;
		}

		if (event_.type === "keydown" && (event_.ctrlKey || (char.length > 1 && char !== "Processing")))
			return true;

		event_.preventDefault();
		event_.stopPropagation();
		event_.stopImmediatePropagation();
		return false;
	}

	function onBlur ()
	{
		setTimeout(() =>
		{
			if (document.activeElement.tagName !== "INPUT")
			{
				highlightHover = 0;
				highlighted = undefined;
				previousFocus = false;
				draw();
			}
		});
	}

	function onFocus (event_)
	{
		highlighted = event_.target;
		highlighted.selectionStart = highlighted.value.length;
		draw();
		previousFocus = highlighted;
		setTimeout(highlighted.select.bind(highlighted));
	}

	function onInput ()
	{
		draw();
		onMouseMove(
			{
				x: currentX,
				y: currentY,
				target: elementCanvasCone,
			});
	}

	function onMouseMove (event_)
	{
		currentX = event_.offsetX;
		currentY = event_.offsetY;

		const highlightHoverNew =
			contextDiamTop && contextCone.isPointInPath(contextDiamTop, currentX, currentY)
				? 1
				: contextDiamBot && contextCone.isPointInPath(contextDiamBot, currentX, currentY)
					? 2
					: (contextHeight && contextCone.isPointInPath(contextHeight, currentX, currentY)
						? 3
						: 0);
		if (highlightHoverNew !== highlightHover) highlightHover = highlightHoverNew;

		draw();
	}

	function onClick (event_)
	{
		currentX = event_.offsetX;
		currentY = event_.offsetY;

		let element;
		if (contextCone.isPointInPath(contextDiamTop, currentX, currentY))
			element = elementDiamTopInput;

		if (contextCone.isPointInPath(contextDiamBot, currentX, currentY))
			element = elementDiamBotInput;

		if (contextCone.isPointInPath(contextHeight, currentX, currentY))
			element = elementHeightInput;

		if (element)
			highlighted = element;

		if (!highlighted)
			return;

		if (element)
			event_.preventDefault();

		highlightHover = 0;
		highlighted.focus();
		if (event_.type === "dblclick") // && highlightedPrev === highlighted)
			highlighted.select();

	}

	function popup (p, close)
	{
		if (!document.body.popups)
			document.body.popups = [];

		if (!p)
		{
			while ((p = document.body.popups.at(-1)))
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

		if (document.body.popups.length > 0)
			document.body.dataset.popup = document.body.popups.at(-1).dataset.popup;
		else
			delete document.body.dataset.popup;

	}

	elementCanvasCone.addEventListener("mousemove", onMouseMove);
	elementCanvasCone.addEventListener("mousedown", onClick);
	elementCanvasCone.addEventListener("dblclick", onClick);
	const addEventListeners = element =>
	{
		element.addEventListener("blur", onBlur);
		element.addEventListener("focus", onFocus);
		element.addEventListener("input", onInput);
		element.addEventListener("keydown", onTextInput);
		element.addEventListener("beforeinput", onTextInput); //mobile
		element.addEventListener("textInput", onTextInput); //mobile
	};
	const nlInput = document.querySelectorAll(".input input");
	for(let index = 0; index < nlInput.length; index++)
		addEventListeners(nlInput[index]);

	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event_ =>
	{
		if (SETTINGS.theme !== 2) return;

		color.theme = event_.matches;
		setTheme();
		draw(true);
	});

	elementNavbar.addEventListener("click", event_ =>
	{
		// let clicked = false;

		if (event_.target.dataset.popup)
			popup(event_.target);

		switch (event_.target.dataset.type)
		{
			case "reset": {
				popup();
				SETTINGS.$reset();
				init();
			// clicked = true;
				event_.preventDefault();
				// setTimeout(SETTINGS.$reset);
				break;
			}

			case "fraction": {
				let fraction = SETTINGS.fractions;
				if (++fraction > 1)
					fraction = 0;

				showAsFraction(fraction);
				draw(true);
			// clicked = true;
				break;
			}
		}
		// if (e.target.classList.contains("close-layer"))
		// {
		// 	// setTimeout(e=>(closeMenu(e.target.dataset.type)), 100);
		// 	clicked = true;
		// }
		// if (clicked)
		//   e.preventDefault();
	}, true);

	elementCanvasTemplateInfo.addEventListener("click", event_ =>
	{
		const f = SETTINGS.fractions;
		SETTINGS.fractions = Math.trunc(!Math.trunc(elementCanvasTemplateInfo.dataset.type));
		draw(true);
		SETTINGS.fractions = f;
		event_.preventDefault();
	});

	elementCanvasTemplateInfo.addEventListener("dblclick", event_ =>
	{
		event_.preventDefault();
	});

	function initDropdowns ()
	{
		const dropdowns = document.querySelectorAll("[data-type=\"dropdown\"]");
		for (const elementDropdown of dropdowns)
		{
			const dropdownBox = elementDropdown.querySelector(".dropdown-box") || document.createElement("span");

			if (!dropdownBox.classList.contains("dropdown-box"))
			{
				dropdownBox.className = "dropdown-box";
				dropdownBox.innerHTML = `
<div class="dropdown">
	<input id="${elementDropdown.dataset.setting}-dropdown" type="checkbox">
	<label for="${elementDropdown.dataset.setting}-dropdown" class="close-overlay" title="" data-type="${elementDropdown.dataset.setting}"></label>
	<label for="${elementDropdown.dataset.setting}-dropdown" class="dropdown-list"><ul></ul></label>
</div>`;
				elementDropdown.append(dropdownBox);
			}
			dropdown(elementDropdown);
		}
	}
	document.documentElement.removeAttribute("notInited");
	initialized = true;
}
function showNan (t)
{

	return (isNan(t) ? "N/A" : t);
}

function getPointOnLine (x1, y1, x2, y2, distribution)
{
	const length_ = lineLength(x1, y1, x2, y2);
	const t = distribution / length_;

	return [(1 - t) * x1 + t * x2, (1 - t) * y1 + t * y2];
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

function getPerpendicular (x1, y1, x2, y2, length_)
{
	let px = y1 - y2;
	let py = x1 - x2;
	const distribution = length_ / Math.hypot(px, py);

	px *= distribution;
	py *= distribution;
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

})();