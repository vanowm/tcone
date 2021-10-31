//jshint -W018,-W014
window.addEventListener("DOMContentLoaded", init);

function init(e)
{
    const drawImage = (canvas, d1, d2, h, _lineWidth, strokeColor, fillColor) =>
    {
        const data = new Proxy(...(() =>
        {
            if (!_lineWidth)
                _lineWidth = lineWidth;

            const diameter1 = Math.min(d1, d2),
                diameter2 = Math.max(d1, d2),
                radius1 = diameter1 / 2 /* top radius */ ,
                radius2 = diameter2 / 2 /* bottom radius */ ,
                circumference1 = radius1 * Math.PI * 2,
                circumference2 = radius2 * Math.PI * 2,
                dif = diameter2 - diameter1,
                hT = (h * diameter2) / (dif ? dif : 0) /* triangle height (center of radius to bottom of the cone) */ ,
                b = radius2 - radius1 ? radius2 - radius1 : 0 /* difference between top and bottom */ ,
                rH = Math.sqrt(h * h + b * b) /* radius for cone height (cone slope length) */ ,
                r2 = Math.sqrt(hT * hT + radius2 * radius2) /* pattern outer radius */ ,
                r1 = r2 - rH /* pattern inner radius */ ,
                c = Math.PI * diameter2 /* cone circumference */ ,
                cT = Math.PI * 2 * r2 /* total pattern circumference */ ,
                angleRad = d1 == d2 ? Math.PI : c / r2 /* angle in radians */ ,
                angleDeg = angleRad * 180 / Math.PI /*(360 * c) / cT*/ /* angle in degres */ ,
                r1Length = angleRad * r1 /* length of top arc */ ,
                r2Length = angleRad * r2 /* length of bottom arc */ ,
                arcEnd = (c1, c2, radius, angleRad, bot) => !isFinite(radius) || !radius ? [
                    c1, c2 + (bot ? h : 0), circumference2, c2 + (bot ? h : 0)
                ] : [
                    /* coordinates of an arc */
                    c1 + Math.cos(Math.PI / 2 - angleRad / 2) * radius /* x1 */ ,
                    c2 + Math.sin(Math.PI / 2 - angleRad / 2) * radius /* y1 */ ,
                    c1 + Math.cos(Math.PI / 2 + angleRad / 2) * radius /* x2 */ ,
                    c2 + Math.sin(Math.PI / 2 + angleRad / 2) * radius /* y2 */ ,
                ],
                r1Ends = arcEnd(0, 0, r1, angleRad),
                r2Ends = arcEnd(0, 0, r2, angleRad, true),
                l1 = lineLength(...r1Ends),
                l2 = lineLength(...r2Ends),
                l3 = lineLength(r1Ends[0], r1Ends[1], r2Ends[2], r2Ends[3]),
                data = {
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
                    angleRad: d1 == d2 ? 0 : angleRad,
                    angleDeg: d1 == d2 ? 0 : angleDeg,
                    hT,
                    b,
                    h,
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
                },
                handler = {
                    /** using proxy object to convert any variables that start with _ to percentatge value
                                                and $ = round to 2 decimal places
                                            */
                    get: function (target, prop)
                    {
                        if (!(prop in target))
                        {
                            const func = {
                                    _: this.n2p,
                                    $: round,
                                },
                                F = Object.keys(func)
                                .join("")
                                .replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&"),
                                match = (prop.match(new RegExp("^([" + F + "]*)", "")) || [
                                    "",
                                    "",
                                ])[1].split("");

                            if (match.length)
                            {
                                const key = prop.replace(new RegExp("^[" + F + "]+", ""), "");
                                let val = target[key];
                                for (let i = 0; i < match.length; i++)
                                {
                                    if (key in target) target[prop] = val = func[match[i]](val);
                                }
                            }
                        }
                        return target[prop];
                    },
                    n2p: new N2P(
                        d1 == d2 ? Math.max(d1 / 2 * Math.PI * 2, h) :
                        Math.max(
                            r2,
                            r2Ends[1] < 0 ? r2 * 2 : lineLength(...r2Ends),
                            r2 - r2Ends[1]
                        ),
                        Math.max(canvas.width, canvas.height) - _lineWidth * 2
                    ),
                };
            return [data, handler];
        })());

        data.y = Math.min(
            data.arcEnd(0, 0, data._r1, data.angleRad)[1],
            data.arcEnd(0, 0, data._r2, data.angleRad, true)[1]
        );
        if (data.y < 0) data.y = Math.abs(data.y) + _lineWidth;
        else data.y = _lineWidth;

        const topArcEnds = data.arcEnd(data.x, data.y, data._r1, data.angleRad),
            bottomArcEnds = data.arcEnd(data.x, data.y, data._r2, data.angleRad, true);

        data.topArcEnds = topArcEnds;
        data.bottomArcEnds = bottomArcEnds;
        const ctx = canvas.getContext("2d");
        // ctx.fillStyle = color.fill;
        ctx.save();
        ctx.fillStyle = "transparent";
        ctx.strokeStyle = strokeColor || color.stroke;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = _lineWidth;
        ctx.fillStyle = fillColor || color.fill;

        ctx.beginPath();
        if (isFinite(data.r1))
        {
            ctx.arc(
                data.x,
                data.y,
                data._r1,
                Math.PI / 2 - data.angleRad / 2,
                Math.PI / 2 + data.angleRad / 2
            );
            ctx.stroke();
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
            ctx.setLineDash([5, 8]);
            ctx.lineWidth = _lineWidth / 4;
            ctx.moveTo(topArcEnds[2], topArcEnds[1]);
            ctx.lineTo(data.x, data.y);
            ctx.lineTo(topArcEnds[0], topArcEnds[1]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.lineWidth = _lineWidth;
            ctx.moveTo(topArcEnds[0], topArcEnds[1]);
            ctx.lineTo(...bottomArcEnds);
            ctx.moveTo(topArcEnds[2], topArcEnds[1]);
            ctx.lineTo(bottomArcEnds[2], bottomArcEnds[1]);
            ctx.stroke();
            ctx.lineWidth = _lineWidth / 4;
            ctx.beginPath();
            ctx.lineTo(bottomArcEnds[0], bottomArcEnds[1]);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(data.x, data.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
        }
        else
        {
            ctx.rect(data.topArcEnds[0] - data.x + 1, data.topArcEnds[1] - data.y + 1, data._circumference1, data._h);
            ctx.fill();
            ctx.stroke();
        }


        // ctx.beginPath();
        // ctx.arc(data.x,  data.y + (4 * Math.sin(data.angleRad/2) * (Math.pow(data._r2, 3) - Math.pow(data._r1, 3)))/ (3*data.angleRad*(data._r2*data._r2 - data._r1*data._r1)) , 3, 0, Math.PI*2);
        // ctx.fillStyle = "red"
        // ctx.fill();
        ctx.restore();
        return data;
    };
    const elD1 = document.getElementById("d1"),
        elD2 = document.getElementById("d2"),
        elR1 = document.getElementById("r1"),
        elR2 = document.getElementById("r2"),
        elH = document.getElementById("h"),
        elL1 = document.getElementById("l1"),
        elL2 = document.getElementById("l2"),
        elL3 = document.getElementById("l3"),
        elAngle = document.getElementById("angle"),
        elHidden = document.getElementById("hidden"),
        elCanvasCone = document.getElementById("cone"),
        elCanvasResult = document.getElementById("coneResult"),
        elCanvasResult2 = document.getElementById("coneResult2"),
        ctxCone = elCanvasCone.getContext("2d"),
        settings = new Proxy(JSON.parse(localStorage.getItem("tconeData")) ||
        {},
        {
            get: function (target, name)
            {
                return name in target ? target[name] : this.default[name];
            },
            set: function (target, name, value)
            {
                if (!(name in this.default)) return;

                if (typeof value !== typeof this.default[name])
                {
                    switch (typeof this.default[name])
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
                if (typeof value !== typeof this.default[name]) return;

                target[name] = value;
                for (let i in target)
                    if (!(i in this.default)) delete target[i];

                localStorage.setItem("tconeData", JSON.stringify(target));
                if (name == "d")
                {
                    color.darkMode =
                        value == 2 ?
                        window.matchMedia &&
                        window.matchMedia("(prefers-color-scheme: dark)").matches :
                        value;
                }
            },
            default:
            {
                t: "6",
                b: "8",
                h: "10",
                d: 2,
            },
        }),
        color = new Proxy(
        {},
        {
            darkMode: settings.d == 2 ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches : settings.d,
            colors:
            {
                get stroke()
                {
                    const c = getComputedStyle(elCanvasCone).color;
                    return [c, c];
                },
                error: ["red", "red"],
                highlight: ["lightgreen", "lightgreen"],
                fill: ["#008000", "#376E37"],
                fillHover: ["#E0FFE0", "#87B987"],
                get label()
                {
                    const c = getComputedStyle(document.documentElement).getPropertyValue("--labelColor");
                    return [c, c];
                },
            },
            set: function (target, name, value)
            {
                if (name == "darkMode") this.darkMode = ~~value;
            },
            get: function (target, name)
            {
                return name == "darkMode" ?
                    this.darkMode :
                    this.colors[name][~~this.darkMode];
            },
        }),
        fractions = (() =>
        {
            const o = {
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
            return Object.keys(o).reduce((o, a) =>
            {
                o[o[a]] = a;
                return o;
            }, o);
        })(),
        fractionGlyphs = Object.keys(fractions)
        .filter(a => a.length < 2)
        .join(""),
        fractionFilter = new RegExp("[" + fractionGlyphs + "]", "g"),
        canvasWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--size")),
        canvasHeight = canvasWidth,
        lineWidth = 2,
        /* main body line width */
        showErrorSides = 1;

    setTheme();
    //setTimeout(elD1.select.bind(elD1), 0);
    /*default*/
    let prevFocus = elD1,
        prevHighlightHover,
        prevErrD1,
        prevErrD2,
        prevErrH,
        highlightHover = 0,
        highlighted = elD1,
        ctxD1,
        ctxD2,
        ctxH,
        curX,
        curY;

    elD1.value = settings.t;
    elD2.value = settings.b;
    elH.value = settings.h;

    function draw(e)
    {
        // Inputs
        const d1Value = filter(elD1.value),
            d2Value = filter(elD2.value), //.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
            hValue = filter(elH.value), //.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
            prevD1Frac = new Fraction(settings.t),
            prevD2Frac = new Fraction(settings.b),
            prevHFrac = new Fraction(settings.h),
            D1 = new Fraction(d1Value || 0),
            D2 = new Fraction(d2Value || 0),
            H = new Fraction(hValue || 0),
            errD1 = !D1.valueOf(),
            errD2 = !D2.valueOf(),
            errH = !H.valueOf(),
            d1 = errD1 ? prevD1Frac.valueOf() : D1.valueOf(),
            d2 = errD2 ? prevD2Frac.valueOf() : D2.valueOf(),
            h = errH ? prevHFrac.valueOf() : H.valueOf();

        if (
            e !== true &&
            !(
                settings.t != d1 ||
                settings.b != d2 ||
                settings.h != h ||
                prevFocus !== highlighted ||
                prevErrD1 != errD1 ||
                prevErrD2 != errD2 ||
                prevErrH != errH ||
                prevHighlightHover != highlightHover
            )
        )
            return;

        prevErrD1 = errD1;
        prevErrD2 = errD2;
        prevErrH = errH;
        prevHighlightHover = highlightHover;
        //  if (e)
        //   lastFocus = e.target;
        inputWidth(elD1);
        elD1.classList.toggle("error", errD1);
        inputWidth(elD2);
        elD2.classList.toggle("error", errD2);
        inputWidth(elH);
        elH.classList.toggle("error", errH);

        elCanvasCone.width = canvasWidth;
        elCanvasCone.height = canvasHeight;
        elCanvasCone.style.width = canvasWidth + "px";
        elCanvasCone.style.height = canvasHeight + "px";
        elCanvasResult.width = canvasWidth;
        elCanvasResult.height = canvasHeight;
        elCanvasResult.style.width = canvasWidth + "px";
        elCanvasResult.style.height = canvasHeight + "px";
        ctxCone.strokeStyle = color.stroke;
        ctxCone.fillStyle = "transparent";
        //   ctx.fillStyle = color.fill;
        ctxCone.fillRect(0, 0, elCanvasCone.width, elCanvasCone.width);

        let arrow = new Arrow(ctxCone);
        const max = Math.max(d1, d2, h),
            lineWidthOffset = 6,
            maxWidth = elCanvasCone.width - lineWidthOffset - (max == h ? lineWidthOffset : 0) - arrow.headWidth * 2 - lineWidth * (max == h ? 0.5 : 1),
            n2p = new N2P(max, maxWidth),
            _h = n2p(h),
            offsetY = (canvasHeight - _h) / 2,
            _r1 = n2p(d1 / 2),
            _r2 = n2p(d2 / 2),
            t = Math.min(_h / 1.7, 18) - _h / 33,
            _r1Tilt = n2p(d1 / t),
            _r2Tilt = n2p(d2 / t),
            _x = n2p(Math.max(d1, d2)) / 2 + lineWidth,
            arrowTopY = offsetY - lineWidthOffset,
            arrowTopLeft = _x - _r1,
            arrowTopRight = _x + _r1,
            arrowBottomY = _h + offsetY + lineWidthOffset,
            arrowBottomLeft = _x - _r2,
            arrowBottomRight = _x + _r2,
            arrowRightX = _x + Math.max(_r1, _r2) + lineWidthOffset,
            arrowRightTop = offsetY + _r1Tilt,
            arrowRightBottom = _h + offsetY - _r2Tilt;

        //top arrow
        arrow([arrowTopLeft, arrowTopY, arrowTopRight, arrowTopY], true, true, errD1);
        //bottom arrow
        arrow([arrowBottomLeft, arrowBottomY, arrowBottomRight, arrowBottomY], true, true, errD2);
        //vertical arrow
        arrow([arrowRightX, arrowRightTop, arrowRightX, arrowRightBottom], true, true, errH);

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
        const highlight = (el, color) =>
        {
            ctxCone.beginPath();
            ctxCone.fillStyle = color;
            if (el === elD1)
                ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2);
            //top ellipse close side
            else if (el === elD2)
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
            else if (el === elH)
            {
                ctxCone.ellipse(
                    _x,
                    _r1Tilt + offsetY,
                    _r1,
                    _r1Tilt,
                    Math.PI,
                    0,
                    Math.PI,
                    true
                ); //top ellipse
                ctxCone.ellipse(
                    _x,
                    _h - _r2Tilt + offsetY,
                    _r2,
                    _r2Tilt,
                    0,
                    0,
                    Math.PI
                ); //bottom outside ellipse
            }
            ctxCone.fill();
        };
        if (highlighted) highlight(highlighted, color.fill);

        if (highlightHover == 1 && highlighted != elD1)
            highlight(elD1, color.fillHover);
        else if (highlightHover == 2 && highlighted != elD2)
            highlight(elD2, color.fillHover);
        else if (highlightHover == 3 && highlighted != elH)
            highlight(elH, color.fillHover);

        ctxCone.beginPath();
        ctxCone.setLineDash([_r2Tilt / 4, _r2Tilt / 3]);
        ctxCone.lineWidth /= 2;
        ctxCone.strokeStyle =
            errD2 && showErrorSides ?
            color.error :
            highlightHover == 2 ?
            color.stroke :
            color.stroke;
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
            highlightHover == 3 ?
            color.stroke :
            color.stroke;
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
            highlightHover == 1 || highlightHover == 3 ?
            color.stroke :
            color.stroke;
        ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI); //top ellipse close side
        ctxCone.stroke();

        ctxCone.lineWidth = lineWidth * 2;
        ctxCone.beginPath();
        ctxCone.strokeStyle =
            errD1 && showErrorSides ?
            color.error :
            highlightHover == 1 || highlightHover == 3 ?
            color.stroke :
            color.stroke;
        ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true); //top ellipse far side
        ctxCone.stroke();

        ctxCone.beginPath();
        ctxCone.strokeStyle =
            errD2 && showErrorSides ?
            color.error :
            highlightHover == 2 || highlightHover == 3 ?
            color.stroke :
            color.stroke;
        ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI); //bottom ellipse close side
        ctxCone.stroke();

        /* generate preview */
        const data = drawImage(elCanvasResult, d1, d2, h, lineWidth);
        /* generate DXF */
        const DXF = require("Drawing"),
            dxf = new DXF(),
            toRadians = ang => (ang * Math.PI) / 180,
            toDegree = ang => (ang * 180) / Math.PI,
            arcStartAngle = toRadians(270 - data.angleDeg / 2),
            arcEndAngle = toRadians(270 + data.angleDeg / 2),
            dxfArcEnd = radius => [
                Math.cos(arcStartAngle) * radius,
                Math.sin(arcStartAngle) * radius,
                Math.cos(arcEndAngle) * radius,
                Math.sin(arcEndAngle) * radius,
            ],
            r1e = dxfArcEnd(data.r1),
            r2e = dxfArcEnd(data.r2);
        dxf.generateAutocadExtras();
        dxf.header("ACADVER", [
            [1, "AC1500"]
        ]);
        const //vY = -(data.r2 - r2e[1] + r1e[1])/2,
            vY = -(
                4 *
                Math.sin(data.angleRad / 2) *
                (Math.pow(data.r2, 3) - Math.pow(data.r1, 3))
            ) /
            (3 * data.angleRad * (data.r2 * data.r2 - data.r1 * data.r1)),
            vW =
            r2e[1] > 0 ?
            data.r2 * 2 :
            Math.max(
                data.lineLength(...r2e),
                data.r2 - (data.r2 - Math.abs(r1e[1]))
            );

        dxf.viewport(d1 == d2 ? data.circumference1 / 2 : 0, d1 == d2 ? h / 2 : vY, d1 == d2 ? data.circumference1 / 1.5 : vW);
        dxf.setUnits("Inches");
        if (d1 == d2)
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

        const link = document.getElementById("dxf");
        link.setAttribute(
            "download",
            `cone_${data.$diameter1}x${data.$diameter2}x${data.$h}.dxf`
        );
        link.href = URL.createObjectURL(
            new Blob([dxf.toDxfString()],
            {
                type: "application/dxf",
            })
        );
        clearTimeout(link.timer);
        //  link.timer = setTimeout( link.click.bind(link), 2000);
        const f = t => ("" + t).replace(/^(NaN|Infinity)$/, "n/a"),
            textR1 = f(fractionFormat(fractionLimit(data.r1))),
            textR2 = f(fractionFormat(fractionLimit(data.r2))),
            textL1 = f(fractionFormat(fractionLimit(data.l1))),
            textL2 = f(fractionFormat(fractionLimit(data.l2))),
            textL3 = f(fractionFormat(fractionLimit(data.l3))),
            textAngle = round(toDegree(data.angleRad));

        showValue(elR1, textR1, "(" + f(data.$r1) + ")");
        showValue(elR2, textR2, "(" + f(data.$r2) + ")");
        showValue(elL1, textL1, "(" + f(data.$l1) + ")");
        showValue(elL2, textL2, "(" + f(data.$l2) + ")");
        showValue(elL3, textL3, "(" + f(data.$l3) + ")");
        showValue(elAngle, textAngle + "°", "(" + round(data.angleRad) + " radians)");

        /* mock-up */
        const ctxR2 = elCanvasResult2.getContext("2d"),
            resStyle = window.getComputedStyle(elCanvasResult2);

        elCanvasResult2.width = parseFloat(resStyle.getPropertyValue("--width"));
        elCanvasResult2.height = parseFloat(resStyle.getPropertyValue("--height"));
        elCanvasResult2.style.width = elCanvasResult2.width + "px";
        elCanvasResult2.style.height = elCanvasResult2.height + "px";
        arrow = new Arrow(ctxR2);

        ctxR2.translate(7, 0);
        ctxR2.font = resStyle.font;
        ctxR2.textAlign = "center";
        const d = drawImage(
            elCanvasResult2,
            1,
            2,
            4,
            2,
            color.stroke,
            "transparent"
        );
        ctxR2.lineWidth = 0.25;
        ctxR2.strokeStyle = color.stroke;
        ctxR2.fillStyle = color.stroke;

        /* R1 */
        let x1 = d.x - 30,
            x2 = d.topArcEnds[2] - 30,
            y1 = d.y,
            y2 = d.topArcEnds[1] - 10;

        /** arrow R1 */
        arrow([x1, y1, x2, y2], true, true, false, [elR1, [x1, y1, x2, y2], d.topArcEnds[1] / 2]);

        /* R2 */
        ctxR2.globalAlpha = 1;
        x1 = d.x - 14;
        x2 = d.bottomArcEnds[2] - 14;
        y2 = d.bottomArcEnds[1] - 10;

        /** arrow R2 */
        arrow([x1, y1, x2, y2], true, true, false, [elR2, [x1, y1, x2, y2], d.bottomArcEnds[1] - d._rH / 2]);

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
        arrow([x1, y1, x2, y2], true, false, false, [elAngle, [x2, y2 + fontSize, x1, y1 + fontSize], -5, true]);
        ctxR2.restore();

        /* L1 */
        x1 = d.topArcEnds[0] - 8;
        y1 = d.topArcEnds[1] - 8;
        x2 = d.topArcEnds[2] + 8;
        y2 = d.topArcEnds[3] - 8;

        /** arrow L1 */
        arrow([x1, y1, x2, y2], true, true, false, [elL1, [x1, y1, x2, y2], (x1 - x2) / 2]);

        /* L2 */
        x1 = d.bottomArcEnds[0] - 8;
        y1 = d.bottomArcEnds[1] - 5;
        x2 = d.bottomArcEnds[2] + 8;
        y2 = d.bottomArcEnds[3] - 5;

        /** arrow L2 */
        arrow([x1, y1, x2, y2], true, true, false, [elL2, [x1, y1, x2, y2], (x1 - x2) / 2]);

        /* L3 */
        x1 = d.topArcEnds[0] - 5;
        y1 = d.topArcEnds[1] + 8;
        x2 = d.bottomArcEnds[2] + 8;
        y2 = d.bottomArcEnds[3] - 8;

        /** arrow L3 */
        arrow([x1, y1, x2, y2], true, true, false, [elL3, [x1, y1, x2, y2], d.lineLength(x1, y1, x2, y2) / 2.2]);

        /* move input fields */
        let r = elD1.getBoundingClientRect(),
            x = _x - r.width / 2 > 0 ? _x : r.width / 2,
            y = arrowTopY - lineWidth * 2;

        elD1.style.left = x - r.width / 2 + "px";
        elD1.style.top = y - r.height + "px";

        r = elD2.getBoundingClientRect();
        x = _x - r.width / 2 > 0 ? _x : r.width / 2;
        y = arrowBottomY + r.height + lineWidth * 2;
        elD2.style.left = x - r.width / 2 + "px";
        elD2.style.top = y - r.height + "px";

        r = elH.getBoundingClientRect();
        x = arrowRightX + lineWidth * 2;
        y = arrowRightTop + (arrowRightBottom - arrowRightTop) / 2;
        elH.style.left = x + "px";
        elH.style.top = y - r.height / 2 + "px";

        if (!errD1) settings.t = d1Value;
        if (!errD2) settings.b = d2Value;
        if (!errH) settings.h = hValue;

    }

    function Arrow(ctx, settings)
    {
        const style = getComputedStyle(ctx.canvas),
            getValue = (name, fallback) =>
            {
                let val = style.getPropertyValue("--" + name);
                if (val === "" || val === '""')
                    val = fallback || "";
                else
                    val = val;
                switch (typeof fallback)
                {
                case "number":
                    val = parseFloat(val);
                    break;
                case "boolean":
                    val = val.toLowerCase() == "true" || val == "1";
                    break;
                }
                return val;
            };
        settings = Object.assign(
        {
            _headWidth: getValue("arrowHeadWidth"),
            headSize: getValue("arrowHeadSize", 8),
            get headWidth()
            {
                return this._headWidth || this.headSize / 4;
            },
            set headWidth(val)
            {
                this._headWidth = val;
            },
            fill: getValue("arrowFill", true),
            headClosed: getValue("arrowHeadClosed", true),
            showError: true,
            lineWidth: getValue("arrowLineWidth", 0.35),
            alpha: 1,
            color: getValue("arrowColor", color.stroke),
            colorError: getValue("arrowColorError", color.error)
        }, settings ||
        {});

        const fillText = (el, p, dist, nopos) =>
            {
                ctx.save();
                const ca = ctx.globalAlpha,
                    resStyle = window.getComputedStyle(elCanvasResult2);
                let text = el.querySelector("span").textContent,
                    text2 = el.querySelector("label > label").textContent;

                ctx.globalAlpha = 1;
                let [x1, y1, x2, y2] = p,
                [px, py] = getPerpendicular(x1, y1, x2, y2, 5),
                    xp1 = x1 + px,
                    xp2 = x2 + px,
                    yp1 = y1 - py,
                    yp2 = y2 - py;
                text2 = "" + text2 + "";
                ctx.translate(...getPointOnLine(xp1, yp1, xp2, yp2, dist));
                ctx.rotate(Math.atan2(yp2 - yp1, xp2 - xp1) - Math.PI);

                const fontSize = parseFloat(resStyle.fontSize) / 1.7 + "px";
                elHidden.style.padding = 0;
                elHidden.style.border = 0;
                elHidden.textContent = text;
                elHidden.style.font = resStyle.font;
                elHidden.innerHTML = `${text}<span style="font-size:${fontSize};">${text2}</span>`;
                if (!nopos)
                    ctx.textAlign = "start";

                ctx.fillText(text, nopos ? -2 : -elHidden.getBoundingClientRect().width / 1.9, 0);
                ctx.fillStyle = color.label;
                ctx.font = fontSize + " " + resStyle.fontFamily;
                ctx.textAlign = "end";
                if (!nopos)
                    ctx.textBaseline = "bottom";

                ctx.fillText(text2, elHidden.getBoundingClientRect().width / (nopos ? 1 : 2) + 2, 0);
                ctx.globalAlpha = ca;
                ctx.restore();
            },

            arrowDraw = (e, a) =>
            {
                ctx.lineWidth = settings.lineWidth;
                ctx.globalAlpha = settings.alpha * (settings.fill && a ? a : 1);
                ctx.strokeStyle = e && settings.showError ? settings.colorError : settings.color;
                ctx.fillStyle = e && settings.showError ? settings.colorError : settings.color;
                if (settings.fill)
                    ctx.fill();

                ctx.stroke();

            },

            drawArrow = (x1, y1, x2, y2, start, end, err) =>
            {
                const rad = angle(x1, y1, x2, y2);
                ctx.save();
                /** line */
                ctx.beginPath();
                ctx.moveTo(...getPointOnLine(x1, y1, x2, y2, settings.headClosed && start ? settings.headSize : 0));
                ctx.lineTo(...getPointOnLine(x2, y2, x1, y1, settings.headClosed && end ? settings.headSize : 0));
                arrowDraw(err);
                ctx.restore();
                /** arrows */
                if (start)
                {
                    ctx.save();
                    ctx.beginPath();
                    ctx.translate(x1, y1);
                    ctx.rotate(rad);
                    ctx.moveTo(settings.headSize, -settings.headWidth);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(settings.headSize, settings.headWidth);
                    if (settings.headClosed)
                        ctx.lineTo(settings.headSize, -settings.headWidth);

                    arrowDraw(err, settings.lineWidth);
                    ctx.restore();
                }
                if (end)
                {
                    ctx.save();
                    ctx.beginPath();
                    ctx.translate(x2, y2);
                    ctx.rotate(rad);
                    ctx.moveTo(-settings.headSize, -settings.headWidth);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(-settings.headSize, settings.headWidth);
                    if (settings.headClosed)
                        ctx.lineTo(-settings.headSize, -settings.headWidth);

                    arrowDraw(err, settings.lineWidth);
                    ctx.restore();
                }
            },

            draw = (p, start, end, err, text) =>
            {
                if (start || end)
                    drawArrow(...p, start, end, err);

                if (text)
                    fillText(...text);
            };
        return Object.assign(draw, settings);
    }

    function lineLength(x1, y1, x2, y2)
    {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

    function getPointOnLine(x1, y1, x2, y2, dist)
    {
        let len = lineLength(x1, y1, x2, y2),
            t = dist / len;
        return [((1 - t) * x1) + (t * x2), ((1 - t) * y1) + (t * y2)];
    }

    function getPerpendicular(x1, y1, x2, y2, len)
    {
        let px = y1 - y2,
            py = x1 - x2,
            dist = len / Math.hypot(px, py);

        px *= dist;
        py *= dist;
        return [px, py];
    }

    function angle(cx, cy, ex, ey)
    {
        return Math.atan2(ey - cy, ex - cx);
    }

    function showValue(el, ...args)
    {
        const children = el.querySelectorAll("span");
        for (let i = 0; i < args.length; i++)
        {
            if (children[i])
                children[i].innerHTML = args[i];
        }
    }

    function inputWidth(el)
    {
        for (let i = 0, style = getComputedStyle(el); i < style.length; i++)
            elHidden.style[style[i]] = style[i].match(/color/i) ? "transparent" : style[style[i]];

        elHidden.style.padding = "0.5em";
        elHidden.textContent = el.value;
        el.style.width = elHidden.getBoundingClientRect().width + "px";
    }

    function filter(t)
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

    function N2P(max, size)
    {
        return n => ((n * size) / max) || 0;
    }

    function round(n)
    {
        return Math.round(n * 100) / 100;
    }

    function fractionLimit(num, denominator)
    {
        if (denominator === undefined) denominator = 16;

        return new Fraction(
            Math.round(new Fraction(num) * denominator),
            denominator
        ).toFraction(true);
    }

    function fractionFormat(f)
    {
        return f.replace(
            /^([0-9]+)\/([0-9]+)|([0-9]+)(\s+([0-9]+)\/([0-9]+))|([0-9]+)/,
            (...args) =>
            {
                let r = args[3] || args[7] || "";
                if (args[1] || args[5])
                    r +=
                    (r !== "" ? " " : "") +
                    `${args[1] || args[5]}⁄${args[2] || args[6]}`;
                // r += (r !== "" ? " " : "") + `<sup>${args[1] || args[5]}</sup>&frasl;<sub>${args[2] || args[6]}</sub>`;
                return r;
            }
        );
        // return f.replace(/^([0-9]+)\/([0-9]+)|([0-9]+)(\s+([0-9]+)\/([0-9]+))|([0-9]+)/, '$3$7 $1$5⁄$2$6');
    }

    function setTheme(theme)
    {
        if (theme === undefined) theme = settings.d;

        if (theme == 2) document.documentElement.removeAttribute("theme");
        else
            document.documentElement.setAttribute(
                "theme",
                settings.d ? "dark" : "light"
            );

        settings.d = theme;
    }

    function onTextInput(e)
    {
        if (e.timeStamp - onTextInput.timeStamp < 10) return;

        onTextInput.timeStamp = e.timeStamp;

        const char = e.key || e.data;
        if (char == "Enter")
            return e.target[
                (e.shiftKey ? "previous" : "next") + "ElementSibling"
            ].focus();

        if (
            (char == "-" &&
                filter(e.target.value.substr(0, e.target.selectionStart) + char)) ||
            (char && !char.match(new RegExp("[^\\d\\/., " + fractionGlyphs + "]")))
        )
        {
            return true;
        }

        if (e.type == "keydown")
        {
            if (e.ctrlKey || (char.length > 1 && char != "Processing")) return true;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }

    function onBlur(e)
    {
        setTimeout(() =>
        {
            if (document.activeElement.tagName != "INPUT")
            {
                highlightHover = 0;
                highlighted = null;
                prevFocus = false;
                draw();
            }
        });
    }

    function onFocus(e)
    {
        highlighted = e.target;
        highlighted.selectionStart = highlighted.value.length;
        draw();
        prevFocus = highlighted;
        setTimeout(highlighted.select.bind(highlighted));
    }

    function onInput(e)
    {
        draw();
        onMouseMove(
        {
            x: curX,
            y: curY,
            target: elCanvasCone,
        });
    }

    function onMouseMove(e)
    {
        curX = e.offsetX;
        curY = e.offsetY;

        const highlightHoverNew =
            ctxD1 && ctxCone.isPointInPath(ctxD1, curX, curY) ?
            1 :
            ctxD2 && ctxCone.isPointInPath(ctxD2, curX, curY) ?
            2 :
            ctxH && ctxCone.isPointInPath(ctxH, curX, curY) ?
            3 :
            0;
        if (highlightHoverNew != highlightHover) highlightHover = highlightHoverNew;

        draw();
    }

    function onClick(e)
    {
        e.preventDefault();
        (curX = e.offsetX), (curY = e.offsetY);

        if (ctxCone.isPointInPath(ctxD1, curX, curY)) highlighted = elD1;

        if (ctxCone.isPointInPath(ctxD2, curX, curY)) highlighted = elD2;

        if (ctxCone.isPointInPath(ctxH, curX, curY)) highlighted = elH;

        highlightHover = 0;
        highlighted.focus();
        if (e.type == "dblclick")
            // && highlightedPrev === highlighted)
            highlighted.select();
    }

    elCanvasCone.addEventListener("mousemove", onMouseMove);
    elCanvasCone.addEventListener("mousedown", onClick);
    elCanvasCone.addEventListener("dblclick", onClick);
    document.querySelectorAll(".input > input").forEach(e =>
    {
        e.addEventListener("blur", onBlur);
        e.addEventListener("focus", onFocus);
        e.addEventListener("input", onInput);
        e.addEventListener("keydown", onTextInput);
        e.addEventListener("beforeinput", onTextInput); //mobile
        e.addEventListener("textInput", onTextInput); //mobile
    });
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", e =>
        {
            if (settings.d != 2) return;

            color.darkMode = e.matches;
            draw(true);
        });
    document.getElementById("reset").addEventListener("click", e =>
    {
        localStorage.removeItem("tconeData");
        init();
    });
    // setTimeout(prevFocus.focus.bind(prevFocus));
    onFocus(
    {
        target: prevFocus,
    });
    document.documentElement.classList.add("inited");
}
