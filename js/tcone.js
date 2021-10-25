//jshint -W018,-W014
(()=>
{
 localStorage.removeItem("data");
const elD1 = document.getElementById('d1'),
      elD2 = document.getElementById('d2'),
      elR1 = document.getElementById('r1'),
      elR2 = document.getElementById('r2'),
      elH = document.getElementById('h'),
      elL1 = document.getElementById('l1'),
      elL2 = document.getElementById('l2'),
      elL3 = document.getElementById('l3'),
      elAngle = document.getElementById('angle'),
      elHidden = document.getElementById('hidden'),
      elCanvasCone = document.getElementById("cone"),
      elCanvasResult = document.getElementById("coneResult"),
      ctxCone = elCanvasCone.getContext("2d"),
      ctxResult = elCanvasResult.getContext("2d"),
      settings = new Proxy(JSON.parse(localStorage.getItem("settings")) || {},
      {
        get: function(target, name)
        {
          return name in target ? target[name] : this.default[name];
        },
        set: function(target, name, value)
        {
          if (!(name in this.default))
            return;

          if (typeof(value) !== typeof(this.default[name]))
          {
            switch(typeof(this.default[name]))
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
          if (typeof(value) !== typeof(this.default[name]))
            return;

          target[name] = value;
          for(let i in target)
            if (!(i in this.default))
              delete target[i];

          localStorage.setItem("settings", JSON.stringify(target));
          if (name == "d")
          {
            color.darkMode = value == 2 ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches : value;
          }
        },
        default: {
          t:6,
          b:8,
          h:10,
          d:2
        }
      }),
      color = new Proxy({},
      {
        darkMode: settings.d == 2 ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches : settings.d,
        colors: {
          get stroke()
          {
            const c = getComputedStyle(elCanvasCone).color;
            return [c,c];
          },
          error: ["red", "red"],
          highlight: ["lightgreen", "lightgreen"],
          fill: ["#008000", "#376E37"],
          fillHover: ["#E0FFE0", "#87B987"]
        },
        set: function(target, name, value)
        {
          if (name == "darkMode")
            this.darkMode = ~~value;
        },
        get: function(target, name)
        {
          return this.colors[name][~~this.darkMode];
        }

      }),
      fractions = (()=>
      {
        const o = { "½": "1/2", "¼": "1/4", "¾": "3/4",
          "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
          "⅐": "1/7", "⅑": "1/9", "⅒": "1/10",
          "⅓": "1/3", "⅔": "2/3",
          "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5",
          "⅙": "1/6", "⅚": "5/6",
        };
        return Object.keys(o).reduce((o, a) =>
        {
          o[o[a]] = a;
          return o;
        }, o);
      })(),
      fractionGlyphs = Object.keys(fractions).filter(a=>a.length < 2).join(""),
      fractionFilter = new RegExp("[" + fractionGlyphs + "]", "g"),
      canvasWidth = 300,
      canvasHeight = 300,
      lineWidth = 3,
      arrowSize = 8,
      arrowWidth = arrowSize / 4,
      arrowFill = 1,
      arrowClosed = 0,
      showErrorArrow = 1,
      showErrorSides = 1;

for(let i = 0, s = getComputedStyle(elD1); i < s.length; i++)
  elHidden.style[s[i]] = s[i].match(/color/i) ? "transparent" : s[s[i]];

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
    ctxD1, ctxD2, ctxH, curX, curY;

elD1.value = settings.t;
elD2.value = settings.b;
elH.value = settings.h;

function draw(e)
{
  // Inputs
  const d1Value = filter(elD1.value),
        d2Value = filter(elD2.value),//.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
        hValue = filter(elH.value),//.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
        prevD1Frac = new Fraction(settings.t),
        prevD2Frac = new Fraction(settings.b),
        prevHFrac = new Fraction(settings.h),
        D1 = new Fraction(d1Value||0),
        D2 = new Fraction(d2Value||0),
        H = new Fraction(hValue||0),
        errD1 = !D1.valueOf(),
        errD2 = !D2.valueOf(),
        errH = !H.valueOf(),
        d1 = errD1 ? prevD1Frac.valueOf() : D1.valueOf(),
        d2 = errD2 ? prevD2Frac.valueOf() : D2.valueOf(),
        h = errH ? prevHFrac.valueOf() : H.valueOf();

  if (e !== true && (!(settings.t != d1 || settings.b != d2 || settings.h != h || prevFocus !== highlighted
    || prevErrD1 != errD1 || prevErrD2 != errD2 || prevErrH != errH
    || prevHighlightHover != highlightHover))
  )
  return;

  prevErrD1 = errD1;
  prevErrD2 = errD2;
  prevErrH = errH;
  prevHighlightHover = highlightHover;
//  if (e)
 //   lastFocus = e.target;

  elHidden.textContent = elD1.value;
  elD1.style.width = elHidden.getBoundingClientRect().width + "px" ;
  elD1.classList.toggle("error", errD1);
  elHidden.textContent = elD2.value;
  elD2.style.width = elHidden.getBoundingClientRect().width + "px" ;
  elD2.classList.toggle("error", errD2);
  elHidden.textContent = elH.value;
  elH.style.width = elHidden.getBoundingClientRect().width + "px" ;
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
   ctxCone.fillRect(0,0,elCanvasCone.width,elCanvasCone.width);

  const max = Math.max(d1, d2, h),
        arrowLineOffset = arrowClosed ? arrowSize : 0,
        lineWidthOffset = 6,
        maxWidth = elCanvasCone.width - lineWidthOffset - (max == h ? lineWidthOffset : 0) - arrowWidth*2 - lineWidth * (max == h ? 0.5 : 1),
        n2p = new N2P(max, maxWidth),
        _h = n2p(h),
        offsetY = (canvasHeight - _h)/2,
        _r1 = n2p(d1/2),
        _r2 = n2p(d2/2),
        t =  Math.min(_h/1.7, 18) - _h / 33,
        _r1Tilt = n2p(d1 / t),
        _r2Tilt = n2p(d2 / t),
        _x = n2p(Math.max(d1, d2))/2 + lineWidth,
        arrowTopY = offsetY - lineWidthOffset,
        arrowTopLeft = _x - _r1,
        arrowTopRight = _x + _r1,
        arrowBottomY = _h + offsetY + lineWidthOffset,
        arrowBottomLeft = _x - _r2,
        arrowBottomRight = _x + _r2,
        arrowRightX =  _x + Math.max(_r1, _r2) + lineWidthOffset,
        arrowRightTop = offsetY + _r1Tilt,
        arrowRightBottom = _h + offsetY - _r2Tilt;

  ctxCone.lineWidth = lineWidth/4;
  let arrowDraw = e => 
  {
    ctxCone.strokeStyle = e && showErrorArrow? color.error : color.stroke;
    ctxCone.fillStyle = e && showErrorArrow ? color.error : color.stroke;
    ctxCone.stroke();
    if (arrowFill)
      ctxCone.fill();
  };
  //top arrow
  //left
  ctxCone.beginPath();
  ctxCone.moveTo(arrowTopLeft + arrowSize, arrowTopY - arrowWidth);
  ctxCone.lineTo(arrowTopLeft, arrowTopY);
  ctxCone.lineTo(arrowTopLeft + arrowSize, arrowTopY + arrowWidth);
  if (arrowClosed)
    ctxCone.lineTo(arrowTopLeft + arrowSize, arrowTopY - arrowWidth);

  //line
  ctxCone.moveTo(arrowTopLeft + arrowLineOffset, arrowTopY);
  ctxCone.lineTo(arrowTopRight - arrowLineOffset, arrowTopY);

  //right
  ctxCone.moveTo(arrowTopRight - arrowSize, arrowTopY - arrowWidth);
  ctxCone.lineTo(arrowTopRight, arrowTopY);
  ctxCone.lineTo(arrowTopRight - arrowSize, arrowTopY + arrowWidth);
  if (arrowClosed)
    ctxCone.lineTo(arrowTopRight - arrowSize, arrowTopY - arrowWidth);

  arrowDraw(errD1);

  //bottom arrow
  //left
  ctxCone.beginPath();
  ctxCone.moveTo(arrowBottomLeft + arrowSize, arrowBottomY - arrowWidth);
  ctxCone.lineTo(arrowBottomLeft, arrowBottomY);
  ctxCone.lineTo(arrowBottomLeft + arrowSize, arrowBottomY + arrowWidth);
  if (arrowClosed)
    ctxCone.lineTo(arrowBottomLeft + arrowSize, arrowBottomY - arrowWidth);

  //line
  ctxCone.moveTo(arrowBottomLeft + arrowLineOffset, arrowBottomY);
  ctxCone.lineTo(arrowBottomRight - arrowLineOffset, arrowBottomY);

  //right
  ctxCone.moveTo(arrowBottomRight - arrowSize, arrowBottomY - arrowWidth);
  ctxCone.lineTo(arrowBottomRight, arrowBottomY);
  ctxCone.lineTo(arrowBottomRight - arrowSize, arrowBottomY + arrowWidth);
  if (arrowClosed)
    ctxCone.lineTo(arrowBottomRight - arrowSize, arrowBottomY - arrowWidth);

  arrowDraw(errD2);

  //vertical arrow
  //top
  ctxCone.beginPath();
  ctxCone.moveTo(arrowRightX + arrowWidth, arrowRightTop + arrowSize);
  ctxCone.lineTo(arrowRightX, arrowRightTop);
  ctxCone.lineTo(arrowRightX - arrowWidth, arrowRightTop + arrowSize);
  if (arrowClosed)
    ctxCone.lineTo(arrowRightX + arrowWidth, arrowRightTop + arrowSize);

  //line
  ctxCone.moveTo(arrowRightX, arrowRightTop + arrowLineOffset);
  ctxCone.lineTo(arrowRightX, arrowRightBottom - arrowLineOffset);

  //bottom
  ctxCone.moveTo(arrowRightX + arrowWidth, arrowRightBottom - arrowSize);
  ctxCone.lineTo(arrowRightX, arrowRightBottom);
  ctxCone.lineTo(arrowRightX - arrowWidth, arrowRightBottom - arrowSize);
  if (arrowClosed)
    ctxCone.lineTo(arrowRightX + arrowWidth, arrowRightBottom - arrowSize);

  arrowDraw(errH);

  ctxD1 = new Path2D();
  ctxD1.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2);        //top ellipse
  ctxD2 = new Path2D();
  ctxD2.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI * 2);        //top ellipse

  //height path
  ctxH = new Path2D();
  ctxH.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI);        //top ellipse
  ctxH.lineTo(arrowBottomLeft, _h - _r2Tilt + offsetY);                         //left side
  ctxH.moveTo(_x + _r1, _r1Tilt + offsetY);
  ctxH.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI,true);        //bottom outside ellipse

  //mask
  ctxCone.save();
  ctxCone.beginPath();
  ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI,true);        //top ellipse
  ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, Math.PI, 0, Math.PI, true);        //bottom outside ellipse
  ctxCone.restore();
  ctxCone.clip();
  //end mask

  ctxCone.lineWidth = lineWidth;
  const highlight = (el, color) =>
  {
    ctxCone.beginPath();
    ctxCone.fillStyle = color;
    if (el === elD1)
      ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2);         //top ellipse close side
    else if (el === elD2)
      ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI * 2);    //bottom outside ellipse
    else if (el === elH)
    {
      ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, Math.PI, 0, Math.PI, true); //top ellipse
      ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI);        //bottom outside ellipse
    }
    ctxCone.fill();
  };
  if (highlighted)
    highlight(highlighted, color.fill);

  if (highlightHover == 1 && highlighted != elD1)
    highlight(elD1, color.fillHover);

  else if (highlightHover == 2 && highlighted != elD2)
    highlight(elD2, color.fillHover);

  else if (highlightHover == 3 && highlighted != elH)
    highlight(elH, color.fillHover);

  ctxCone.beginPath();
  ctxCone.setLineDash([_r2Tilt/4, _r2Tilt/3]);
  ctxCone.lineWidth = lineWidth/4;
  ctxCone.strokeStyle = errD2 && showErrorSides ? color.error : highlightHover == 2 ? color.fill: color.stroke;
  ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2 , _r2Tilt, 0, 0, Math.PI, true); //bottom ellipse far side
  ctxCone.stroke();
  ctxCone.setLineDash([]);

  ctxCone.lineWidth = lineWidth * 2;
  ctxCone.beginPath();
  ctxCone.strokeStyle = errH && showErrorSides ? color.error : highlightHover == 3 ? color.fill: color.stroke;
  ctxCone.moveTo(_x + _r1, _r1Tilt + offsetY);
  ctxCone.lineTo(arrowBottomRight, _h - _r2Tilt + offsetY);                        //right side
  ctxCone.moveTo(_x - _r1, _r1Tilt + offsetY);
  ctxCone.lineTo(arrowBottomLeft, _h - _r2Tilt + offsetY);                         //left side
  ctxCone.stroke();

  ctxCone.lineWidth = lineWidth;
  ctxCone.beginPath();
  ctxCone.strokeStyle = errD1 && showErrorSides ? color.error : highlightHover == 1 || highlightHover == 3 ? color.fill: color.stroke;
  ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI);             //top ellipse close side
  ctxCone.stroke();

  ctxCone.lineWidth = lineWidth * 2;
  ctxCone.beginPath();
  ctxCone.strokeStyle = errD1 && showErrorSides ? color.error : highlightHover == 1 || highlightHover == 3 ? color.fill: color.stroke;
  ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true);       //top ellipse far side
  ctxCone.stroke();

  ctxCone.beginPath();
  ctxCone.strokeStyle = errD2 && showErrorSides ? color.error : highlightHover == 2 || highlightHover == 3 ? color.fill: color.stroke;
  ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI);        //bottom ellipse close side
  ctxCone.stroke();


/* generate preview */

  // ctxResult.fillStyle = color.fill;
  ctxResult.fillStyle = "transparent";
  ctxResult.strokeStyle = color.stroke;
  ctxResult.fillRect(0, 0, elCanvasResult.width, elCanvasResult.height);
  ctxResult.lineWidth = lineWidth;
  ctxResult.fillStyle = color.fill;

  const data = new Proxy(...(() => 
  {
    const diameter1 = Math.min(d1, d2),
          diameter2 = Math.max(d1, d2),
          radius1 = diameter1 / 2, /* top radius */
          radius2 = diameter2 / 2, /* bottom radius */
          dif = diameter2 - diameter1,
          hT = h * diameter2 / (dif ? dif : 0), /* triangle height (center of radius to bottom of the cone) */
          b = radius2 - radius1 ? radius2 - radius1 : 0, /* difference between top and bottom */
          rH = Math.sqrt(h * h + b * b), /* radius for cone height (cone slope length) */
          r2 = Math.sqrt(hT * hT + radius2 * radius2), /* pattern outer radius */
          r1 = r2 - rH, /* pattern inner radius */
          c = Math.PI * diameter2, /* cone circumference */
          cT = Math.PI * 2 * r2, /* total pattern circumference */
          angleRad = c / r2, /* angle in radians */
          angleDeg = 360 * c / cT, /* angle in degres */
          r1Length = angleRad * r1, /* length of top arc */
          r2Length = angleRad * r2, /* length of bottom arc */

          arcEnd = (c1, c2, radius) => [ /* coordinates of an arc */
            c1 + Math.cos(Math.PI/2 - angleRad/2) * radius, /* x1 */
            c2 + Math.sin(Math.PI/2 - angleRad/2) * radius, /* y1 */
            c1 + Math.cos(Math.PI/2 + angleRad/2) * radius, /* x2 */
            c2 + Math.sin(Math.PI/2 + angleRad/2) * radius /* y2 */
          ],
          coord2length = (x1,y1,x2,y2) => Math.sqrt((x2-x1) * (x2-x1) + (y2-y1) * (y2-y1)), /* distance between arc ends */
          r1Ends = arcEnd(0,0,r1,angleRad),
          r2Ends = arcEnd(0,0,r2,angleRad),
          l1 = coord2length(...r1Ends),
          l2 = coord2length(...r2Ends),
          l3 = coord2length(r1Ends[0], r1Ends[1], r2Ends[0], r2Ends[3]),

          data = {
            x: elCanvasResult.width/2,
            y: 0,
            radius1,
            radius2,
            diameter1,
            diameter2,
            r1,
            r2,
            angleRad,
            angleDeg,
            hT,
            b,
            h,
            rH,
            r1l: r1Length,
            r2l: r2Length,
            l1,
            l2,
            l3,
            arcEnd,
            coord2length
          },
          handler = {
            /** using proxy object to convert any variables that start with _ to percentatge value 
                and $ = round to 2 decimal places
            */
            get: function(target, prop)
            {
              if (!(prop in target))
              {
                const func = {
                    "_": this.n2p, 
                    "$": round,
                  },
                  F = Object.keys(func).join("").replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&"),
                  match = (prop.match(new RegExp("^([" + F + "]*)" ,""))||["",""])[1].split("");

                if (match.length)
                {
                  const key = prop.replace(new RegExp("^[" + F + "]+",""), "");
                  let val = target[key];
                  for(let i = 0; i < match.length; i++)
                  {
                    if (key in target)
                      target[prop] = val = func[match[i]](val);
                  }
                }
              }
              return target[prop];
            },
            n2p: new N2P(Math.max(r2, r2Ends[1] < 0 ? r2 * 2 : coord2length(...r2Ends), r2 - r2Ends[1]), elCanvasResult.width - lineWidth*2),
          };
    return [data, handler];
  })());

  data.y = Math.min(data.arcEnd(0,0,data._r1,data.angleRad)[1], data.arcEnd(0,0,data._r2,data.angleRad)[1]);
  if (data.y < 0)
    data.y = Math.abs(data.y) + lineWidth;
  else
    data.y = lineWidth;

  const topArcEnds = data.arcEnd(data.x, data.y, data._r1, data.angleRad),
  bottomArcEnds = data.arcEnd(data.x, data.y, data._r2, data.angleRad);

  ctxResult.beginPath();
  ctxResult.arc(data.x ,data.y, data._r1, Math.PI/2 - data.angleRad /2, Math.PI/2 + data.angleRad/2);
  ctxResult.stroke();

  ctxResult.arc(data.x ,data.y, data._r2, Math.PI/2 + data.angleRad /2, Math.PI/2 - data.angleRad/2, true);
  ctxResult.fill();

  ctxResult.stroke();
  ctxResult.beginPath();
  ctxResult.setLineDash([_r2Tilt/10, _r2Tilt/5]);
  ctxResult.lineWidth = lineWidth/2;
  ctxResult.moveTo(topArcEnds[2], topArcEnds[1]);
  ctxResult.lineTo(data.x, data.y);
  ctxResult.lineTo(topArcEnds[0], topArcEnds[1]);
  ctxResult.stroke();
  ctxResult.setLineDash([]);
  ctxResult.beginPath();
  ctxResult.lineWidth = lineWidth;
  ctxResult.moveTo(topArcEnds[0], topArcEnds[1]);
  ctxResult.lineTo(...bottomArcEnds);
  ctxResult.moveTo(topArcEnds[2], topArcEnds[1]);
  ctxResult.lineTo(bottomArcEnds[2], bottomArcEnds[1]);
  ctxResult.stroke();
  ctxResult.lineWidth = lineWidth/4;
  ctxResult.beginPath();
  ctxResult.lineTo(bottomArcEnds[0], bottomArcEnds[1]);
  ctxResult.stroke();
  ctxResult.beginPath();
  ctxResult.arc(data.x,  data.y, 2, 0, Math.PI*2);
  ctxResult.fillStyle = "red"
  ctxResult.fill();
  // ctxResult.beginPath();
  // ctxResult.arc(data.x,  data.y + (4 * Math.sin(data.angleRad/2) * (Math.pow(data._r2, 3) - Math.pow(data._r1, 3)))/ (3*data.angleRad*(data._r2*data._r2 - data._r1*data._r1)) , 3, 0, Math.PI*2);
  // ctxResult.fillStyle = "red"
  // ctxResult.fill();
/* generate DXF */
  const DXF = require('Drawing'),
        dxf = new DXF(),
        toRadians = ang => ang * Math.PI / 180,
        toDegree = ang => ang * 180 / Math.PI,
        arcStartAngle = toRadians(270-data.angleDeg/2),
        arcEndAngle = toRadians(270+data.angleDeg/2),
        dxfArcEnd = (radius) => [
          Math.cos(arcStartAngle) * radius,
          Math.sin(arcStartAngle) * radius,
          Math.cos(arcEndAngle) * radius,
          Math.sin(arcEndAngle) * radius
        ],
        r1e = dxfArcEnd(data.r1),
        r2e = dxfArcEnd(data.r2);
  dxf.generateAutocadExtras();
  dxf.header("ACADVER", [[1, "AC1500"]]);
  const //vY = -(data.r2 - r2e[1] + r1e[1])/2,
        vY = -(4 * Math.sin(data.angleRad/2) * (Math.pow(data.r2, 3) - Math.pow(data.r1, 3)))/ (3*data.angleRad*(data.r2*data.r2 - data.r1*data.r1)),
        vW = r2e[1] > 0 ? data.r2 * 2 : Math.max(data.coord2length(...r2e), (data.r2 - (data.r2 - Math.abs(r1e[1]))));

  dxf.viewport(0, vY, vW);
  dxf.setUnits('Inches');
  dxf.drawPolyline([[r2e[0],r2e[1], Math.tan(data.angleRad/4)], [r2e[2],r2e[3]], [r1e[2], r1e[3], -Math.tan(data.angleRad/4)], [r1e[0],r1e[1]]], true);

  const link = document.getElementById('dxf');
  link.setAttribute("download", `cone_${data.$diameter1}x${data.$diameter2}x${data.$h}.dxf`);
  link.href = URL.createObjectURL(new Blob([dxf.toDxfString()], {type: 'application/dxf'}));
  clearTimeout(link.timer);
//  link.timer = setTimeout( link.click.bind(link), 2000);

  showValue(elR1, fractionFormat(fractionLimit(data.r1)), "(" + data.$r1 + ")");
  showValue(elR2, fractionFormat(fractionLimit(data.r2)), "(" + data.$r2 + ")");
  showValue(elL1, fractionFormat(fractionLimit(data.l1)), "(" + data.$l1 + ")");
  showValue(elL2, fractionFormat(fractionLimit(data.l2)), "(" + data.$l2 + ")");
  showValue(elL3, fractionFormat(fractionLimit(data.l3)), "(" + data.$l3 + ")");
  showValue(elAngle, round(toDegree(data.angleRad)) + "°", "(" + round(data.angleRad) + " radians)");

  let r = elD1.getBoundingClientRect(),
      x = _x - r.width/2 > 0 ? _x : r.width/2;
      y = arrowTopY - lineWidth * 2;

  elD1.style.left = x - r.width/2 + "px";
  elD1.style.top = y - r.height + "px";

  r = elD2.getBoundingClientRect();
  x = _x - r.width/2 > 0 ? _x : r.width/2;
  y = arrowBottomY + r.height + lineWidth * 2;
  elD2.style.left = x - r.width/2 + "px";
  elD2.style.top = y - r.height + "px";

  r = elH.getBoundingClientRect();
  x = arrowRightX + lineWidth * 2;
  y = arrowRightTop + (arrowRightBottom - arrowRightTop)/2;
  elH.style.left = x + "px";
  elH.style.top = y - r.height/2 + "px";

  if (!errD1)
    settings.t = d1Value;
  if (!errD2)
    settings.b = d2Value;
  if (!errH)
    settings.h = hValue;
}

function showValue(el, ...args)
{
  const children = el.querySelectorAll("span");
  for(let i = 0; i < args.length; i++)
  {
    if (children[i])
    {
      children[i].innerHTML = args[i];
    }
  }
}
function filter(t)
{
  return t
          .replace(fractionFilter, e => " " + fractions[e])
          .replace(/[^-\d .,\\/]/g, "")
          .replace(/-/g, ' ')
          .replace(/\\/g, "/")
          .replace(/([0-9]+),([0-9]+\.[0-9]+)/g, "$1$2")
          .replace(/,/g, ".")
          .replace(/([\s/.])\1+/g, "$1")
          .trim();
}
        
function N2P(max, size)
{
  return n => n * size / max;
}

function round(n)
{
  return Math.round(n * 100) / 100;
}

function fractionLimit(num, denominator)
{
  if (denominator === undefined)
    denominator = 16;

  return new Fraction(Math.round(new Fraction(num) * denominator), denominator).toFraction(true);
}

function fractionFormat(f)
{
  return f.replace(/^([0-9]+)\/([0-9]+)|([0-9]+)(\s+([0-9]+)\/([0-9]+))|([0-9]+)/, (...args) => 
  {
    let r = args[3] || args[7] || "0";
    if (args[1] || args[5])
      r += (r !== "" ? " " : "") + `<sup>${args[1] || args[5]}</sup>&frasl;<sub>${args[2] || args[6]}</sub>`;
    return r;
  });
  // return f.replace(/^([0-9]+)((\s)([0-9]+)(\/)([0-9]+))?/, '$1$3$4⁄$6');
}

function setTheme(theme)
{
  if (theme === undefined)
    theme = settings.d;

  if (theme == 2)
    document.documentElement.removeAttribute("theme");
  else
    document.documentElement.setAttribute("theme", settings.d ? "dark" : "light");

  settings.d = theme;
}

function onTextInput(e)
{
  if (e.timeStamp - onTextInput.timeStamp < 10)
    return;

  onTextInput.timeStamp = e.timeStamp;

  const char = e.key || e.data;
  if (char == "Enter")
    return e.target[(e.shiftKey ? "previous" : "next") + "ElementSibling"].focus();

  if ((char == "-" && filter(e.target.value.substr(0, e.target.selectionStart) + char))
      || (char && !char.match(new RegExp("[^\\d\\/\., " + fractionGlyphs + "]"))))
  {
    return true;
  }

  if (e.type == "keydown")
  {
    if (e.ctrlKey || char.length > 1 && char != "Processing")
      return true;
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
  onMouseMove({x: curX, y: curY, target: elCanvasCone});
}

function onMouseMove(e)
{
  curX = e.offsetX;
  curY = e.offsetY;

  const highlightHoverNew = ctxD1 && ctxCone.isPointInPath(ctxD1, curX, curY) ? 1 : ctxD2 && ctxCone.isPointInPath(ctxD2, curX, curY) ? 2 : ctxH && ctxCone.isPointInPath(ctxH, curX, curY) ? 3 : 0;
  if (highlightHoverNew != highlightHover)
    highlightHover = highlightHoverNew;

  draw();
}
function onClick(e)
{
  e.preventDefault();
  curX = e.offsetX,
  curY = e.offsetY;

  if (ctxCone.isPointInPath(ctxD1, curX, curY))
    highlighted = elD1;

  if (ctxCone.isPointInPath(ctxD2, curX, curY))
    highlighted = elD2;

  if (ctxCone.isPointInPath(ctxH, curX, curY))
    highlighted = elH;

  highlightHover = 0;
  highlighted.focus();
  if (e.type == "dblclick")// && highlightedPrev === highlighted)
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
  e.addEventListener("beforeinput", onTextInput);//mobile
  e.addEventListener("textInput", onTextInput);//mobile
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e =>
{
  if (settings.d != 2)
    return;

  color.darkMode = e.matches;
  draw(true);
});

setTimeout(prevFocus.focus.bind(prevFocus));
})();