//jshint -W018,-W014
(()=>
{

const elD1 = document.getElementById('d1'),
      elD2 = document.getElementById('d2'),
      elR1 = document.getElementById('r1'),
      elR2 = document.getElementById('r2'),
      elH = document.getElementById('h'),
      elAngle = document.getElementById('angle'),
      elHidden = document.getElementById('hidden'),
      elCanvas = document.getElementById("cone"),
      elCanvasR = document.getElementById("coneResult"),
      ctx = elCanvas.getContext("2d"),
      ctxR = elCanvasR.getContext("2d"),
      color = getComputedStyle(elCanvas).color,
      colorErr = "red",
      colorHighlight = "green",
      colorHighlightFill = "lightgreen",
      colorHighligthFillHover = "#E0FFE0",
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
      width = 300,
      height = 300,
      lineWidth = 3,
      arrowSize = 8,
      arrowWidth = arrowSize / 3,
      arrowFill = 1,
      arrowClosed = 0,
      tilt = 10,
      showErrorArrow = 1,
      showErrorSides = 0;

// document.body.addEventListener("click", e =>
// {
//   console.log(e.target);
//   if (e.target.tagName != "INPUT")
//     lastFocus.focus();
//   else
//     lastFocus = e.target;
// });
for(let i = 0, s = getComputedStyle(elD1); i < s.length; i++)
  elHidden.style[s[i]] = s[i].match(/color/i) ? "transparent" : s[s[i]];

elHidden.style.width = "fit-content";
elHidden.style.position = "absolute";
elHidden.style.padding = "0.5em";
elHidden.style.whiteSpace = "pre";
elHidden.style.top = "-999999";

//setTimeout(elD1.select.bind(elD1), 0);
/*default*/
let prevD1 = 2,
    prevD2 = 3,
    prevH = 3,
    lastFocus = elD1;

elD1.value = prevD1;
elD2.value = prevD2;
elH.value = prevH;

let highlightHover = 0,
    highlighted = lastFocus,
    ctxD1, ctxD2, ctxH;

function draw(e)
{
  // Inputs
  const d1Value = filter(elD1.value),
        d2Value = filter(elD2.value),//.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
        hValue = filter(elH.value),//.replace(/([^\s]+\s+[^\s]+).*/g, "$1"),
        prevD1Frac = new Fraction(prevD1),
        prevD2Frac = new Fraction(prevD2),
        prevHFrac = new Fraction(prevH),
        D1 = new Fraction(d1Value||0),
        D2 = new Fraction(d2Value||0),
        H = new Fraction(hValue||0),
        errD1 = !D1.valueOf(),
        errD2 = !D2.valueOf(),
        errH = !H.valueOf(),
        d1 = errD1 ? prevD1Frac.valueOf() : D1.valueOf(),
        d2 = errD2 ? prevD2Frac.valueOf() : D2.valueOf(),
        h = errH ? prevHFrac.valueOf() : H.valueOf();

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

  // console.log('D1: ', d1, D1);
  // console.log('D2: ', d2, D2);
  // console.log('H: ', h, H);


  // Small tritilt sides
  const o = 0.5 * (d1 < d2 ? d2 - d1 : d1 - d2),
        _height = Math.sqrt(h * h + o * o);

        // Scale ratio between circles
  var scale_ratio = Math.abs((0.5 * d1 < d2 ? d1 : d2) / o);
  // console.log('Scale Ratio: ' + scale_ratio);

  // console.log('Side O: ' + o + ' Side A: ' + h + ' Side H: ' + _height);

  // Circle Radii
  const rad1 = _height * scale_ratio,
        rad2 = _height + (_height* scale_ratio);
  elR1.innerHTML = round(rad1) + " (" + limitFraction(rad1) + ")";
  elR2.innerHTML = round(rad2) + " (" + limitFraction(rad2) + ")";

  // Arc Ratio is arc length / circumference
  var arc_ratio = (Math.PI * d1) / (Math.PI * rad1 * 2);
  // console.log('Arc Ratio: ' + arc_ratio);
  // console.log("r1 length", arc_ratio * rad1 * Math.PI);

  // Arc Angle in degrees
  elAngle.innerHTML = round(arc_ratio * 360);

  const a = round(rad1),
        b = round(rad2),
        cos = Math.cos(round(arc_ratio * 360) * (Math.PI / 180)),
        d1Ab = Math.sqrt(rad1*rad1 + rad1*rad1 - 2*rad1*rad1 * Math.cos(arc_ratio * 360) * (Math.PI / 180)),
        d2Ab = Math.sqrt(rad2*rad2 + rad2*rad2 - 2*rad2*rad2 * Math.cos(arc_ratio * 360) * (Math.PI / 180)),
        d1L = arc_ratio * rad1 * Math.PI,
        d2L = arc_ratio * rad2 * Math.PI;

  // console.log("top", Math.sqrt(a*a + a*a - 2*a*a * cos)); //top
  // console.log("bottom", Math.sqrt(b*b + b*b - 2*b*b * cos));
  // console.log(Math.sqrt(rad1*rad1 + rad1*rad1 - 2*rad1*rad1 * Math.cos(arc_ratio * 360) * (Math.PI / 180))); //top

  elCanvas.width = width;
  elCanvas.height = height;
  elCanvas.style.width = width + "px";
  elCanvas.style.height = height + "px";
  elCanvasR.width = width;
  elCanvasR.height = height;
  elCanvasR.style.width = width + "px";
  elCanvasR.style.height = height + "px";
  ctx.fillStyle = "transparent";
//   ctx.fillStyle = "lightgreen";
   ctx.fillRect(0,0,elCanvas.width,elCanvas.width);

  let max = Math.max(d1, d2, h),
        arrowLineOffset = arrowClosed ? arrowSize : 0,
        lineWidthOffset = 6,
        maxWidth = elCanvas.width - lineWidthOffset - (max == h ? lineWidthOffset : 0) - arrowWidth*2 - lineWidth * (max == h ? 0.5 : 1),
        n2p = new N2P(max, maxWidth),
        _h = n2p(h),
        offsetY = (height - _h)/2,
        _r1 = n2p(d1/2),
        _r2 = n2p(d2/2),
        _r1Tilt = n2p(d1/tilt),
        _r2Tilt = n2p(d2/tilt),
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

  ctx.lineWidth = lineWidth/4;
  let arrowDraw = e => 
  {
    ctx.strokeStyle = e && showErrorArrow? colorErr : color;
    ctx.fillStyle = e && showErrorArrow ? colorErr : color;
    ctx.stroke();
    if (arrowFill)
      ctx.fill();
  };
  //top arrow
  //left
  ctx.beginPath();
  ctx.moveTo(arrowTopLeft + arrowSize, arrowTopY - arrowWidth);
  ctx.lineTo(arrowTopLeft, arrowTopY);
  ctx.lineTo(arrowTopLeft + arrowSize, arrowTopY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowTopLeft + arrowSize, arrowTopY - arrowWidth);

  //line
  ctx.moveTo(arrowTopLeft + arrowLineOffset, arrowTopY);
  ctx.lineTo(arrowTopRight - arrowLineOffset, arrowTopY);

  //right
  ctx.moveTo(arrowTopRight - arrowSize, arrowTopY - arrowWidth);
  ctx.lineTo(arrowTopRight, arrowTopY);
  ctx.lineTo(arrowTopRight - arrowSize, arrowTopY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowTopRight - arrowSize, arrowTopY - arrowWidth);

  arrowDraw(errD1);

  //bottom arrow
  //left
  ctx.beginPath();
  ctx.moveTo(arrowBottomLeft + arrowSize, arrowBottomY - arrowWidth);
  ctx.lineTo(arrowBottomLeft, arrowBottomY);
  ctx.lineTo(arrowBottomLeft + arrowSize, arrowBottomY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowBottomLeft + arrowSize, arrowBottomY - arrowWidth);

  //line
  ctx.moveTo(arrowBottomLeft + arrowLineOffset, arrowBottomY);
  ctx.lineTo(arrowBottomRight - arrowLineOffset, arrowBottomY);

  //right
  ctx.moveTo(arrowBottomRight - arrowSize, arrowBottomY - arrowWidth);
  ctx.lineTo(arrowBottomRight, arrowBottomY);
  ctx.lineTo(arrowBottomRight - arrowSize, arrowBottomY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowBottomRight - arrowSize, arrowBottomY - arrowWidth);

  arrowDraw(errD2);

  //vertical arrow
  //top
  ctx.beginPath();
  ctx.moveTo(arrowRightX + arrowWidth, arrowRightTop + arrowSize);
  ctx.lineTo(arrowRightX, arrowRightTop);
  ctx.lineTo(arrowRightX - arrowWidth, arrowRightTop + arrowSize);
  if (arrowClosed)
    ctx.lineTo(arrowRightX + arrowWidth, arrowRightTop + arrowSize);

  //line
  ctx.moveTo(arrowRightX, arrowRightTop + arrowLineOffset);
  ctx.lineTo(arrowRightX, arrowRightBottom - arrowLineOffset);

  //bottom
  ctx.moveTo(arrowRightX + arrowWidth, arrowRightBottom - arrowSize);
  ctx.lineTo(arrowRightX, arrowRightBottom);
  ctx.lineTo(arrowRightX - arrowWidth, arrowRightBottom - arrowSize);
  if (arrowClosed)
    ctx.lineTo(arrowRightX + arrowWidth, arrowRightBottom - arrowSize);

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
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI,true);        //top ellipse
  ctx.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, Math.PI, 0, Math.PI, true);        //bottom outside ellipse
  ctx.restore();
  ctx.clip();
  //end mask

  ctx.lineWidth = lineWidth;
  if (highlighted || highlightHover)
  {
    ctx.beginPath();
    ctx.fillStyle = colorHighlightFill;
//    ctx.strokeStyle = colorHighlightFill;
  }
  const _highlight = highlighted;
  if (highlightHover == 1 && highlighted != elD1)
  {
    highlighted = elD1;
    ctx.fillStyle = colorHighligthFillHover;
  }
  else if (highlightHover == 2 && highlighted != elD2)
  {
    highlighted = elD2;
    ctx.fillStyle = colorHighligthFillHover;
  }
  else if (highlightHover == 3 && highlighted != elH)
  {
    highlighted = elH;
    ctx.fillStyle = colorHighligthFillHover;
  }

  if (highlighted === elD1)
  {
    ctx.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI * 2);             //top ellipse close side
  }
  else if (highlighted === elD2)
  {
    ctx.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI * 2);        //bottom outside ellipse
  }
  else if (highlighted === elH)
  {
    ctx.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, Math.PI, 0, Math.PI, true);        //top ellipse
    ctx.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI);        //bottom outside ellipse
  }
  if (highlighted || highlightHover)
  {
    ctx.fill();
//    ctx.stroke();
  }
  highlighted = _highlight;
  ctx.beginPath();
  ctx.setLineDash([_r2Tilt/4, _r2Tilt/3]);
  ctx.lineWidth = lineWidth/4;
  ctx.strokeStyle = errD2 && showErrorSides ? colorErr : highlightHover == 2 ? colorHighlight: color;
  ctx.ellipse(_x, _h - _r2Tilt + offsetY, _r2 , _r2Tilt, 0, 0, Math.PI, true); //bottom ellipse far side
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = lineWidth * 2;
  ctx.beginPath();
  ctx.strokeStyle = errH && showErrorSides ? colorErr : highlightHover == 3 ? colorHighlight: color;
  ctx.moveTo(_x + _r1, _r1Tilt + offsetY);
  ctx.lineTo(arrowBottomRight, _h - _r2Tilt + offsetY);                        //right side
  ctx.moveTo(_x - _r1, _r1Tilt + offsetY);
  ctx.lineTo(arrowBottomLeft, _h - _r2Tilt + offsetY);                         //left side
  ctx.stroke();

  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.strokeStyle = errD1 && showErrorSides ? colorErr : highlightHover == 1 || highlightHover == 3 ? colorHighlight: color;
  ctx.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI);             //top ellipse close side
  ctx.stroke();

  ctx.lineWidth = lineWidth*2;
  ctx.beginPath();
  ctx.strokeStyle = errD1 && showErrorSides ? colorErr : highlightHover == 1 ? colorHighlight: color;
  ctx.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, 0, 0, Math.PI, true);       //top ellipse far side
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = errD2 && showErrorSides ? colorErr : highlightHover == 2 || highlightHover == 3 ? colorHighlight: color;
  ctx.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI);        //bottom ellipse close side
  ctx.stroke();


  console.log("rad1:" + rad1, "rad2:"+rad2, "rad1Length:"+ d1L, "rad2Lenth:"+ d2L, "rad1Across:" + d1Ab, "rad2Across:" +d2Ab);
  ctxR.fillStyle = "lightgreen";
  ctxR.fillRect(0, 0, elCanvasR.width, elCanvasR.height);
  max = Math.max(rad1*2, rad2*2, d1Ab, d2Ab);
  n2p = new N2P(max,elCanvasR.width-lineWidth);
  ctxR.lineWidth = lineWidth;
  ctxR.fillStyle = "green";
  const data = new Proxy({
    x: elCanvasR.width/2,
    y: elCanvasR.height/2,
    rad1: Math.min(rad1, rad2),
    rad2: Math.max(rad1, rad2),
    r1l: Math.min(d1L, d2L),
    r2l: Math.max(d1L, d2L),
    d1: Math.min(d1, d2),
    d2: Math.max(d1, d2),
  }, {
    get: function(target, prop, receiver)
    {
      if (!(prop in target))
      {
        const key = prop.replace(/^_/, '');
        if (key in target)
          target[prop] = n2p(target[key]);
      }

      return target[prop];
    }
  });
console.log(data);
  // for(let i in data)
  // {
  //   data["n2p_"+i] = n2p(data[i]);
  //   console.log(data[i]);
  // }
//  ctxR.arc(_x, _x, n2p(rad1), 0, arc_ratio * Math.PI);

// ctxR.moveTo(_x, 0);
// ctxR.arc(_x , 0, n2p(rad1), Math.PI*2 - (Math.PI - rad1Across)/2, Math.PI + (Math.PI - rad1Across)/2);
// ctxR.moveTo(_x, 0);

ctxR.beginPath()
ctxR.arc(data.x ,data._rad1, data._rad1, Math.PI/2 - arc_ratio * data.rad1/2, Math.PI/2 + arc_ratio * data.rad1/2);
ctxR.stroke();

ctxR.beginPath()
ctxR.arc(data.x ,data._rad2, data._rad2, Math.PI/2 - arc_ratio * data.rad2/2, Math.PI/2 + arc_ratio * data.rad2/2);
console.log(arc_ratio * 360, data._d1 * Math.PI, (arc_ratio * 360) * (Math.PI/180) * data._rad1, (arc_ratio * 360 * (Math.PI/180)) * data.rad2, (arc_ratio * 360 * (Math.PI/180)));
// ctxR.lineTo(0,0);
// ctxR.moveTo(0, _x);
  // ctxR.arcTo(_x, n2p(rad2), _x*2, _x, n2p(rad2));
  
  ctxR.stroke();

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
    prevD1 = d1Value;
  if (!errD2)
    prevD2 = d2Value;
  if (!errH)
    prevH = hValue;
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

function limitFraction(num, denominator)
{
  if (denominator === undefined)
    denominator = 16;

  return new Fraction(Math.round(new Fraction(num) * denominator), denominator).toFraction(true);
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
      draw();
    }
  });
}

function onFocus(e)
{
  highlighted = e.target;
  highlighted.selectionStart = highlighted.value.length;
  draw();
}

elCanvas.addEventListener("mousemove", e =>
{
  const x = e.x - e.target.parentNode.offsetLeft,
        y = e.y - e.target.parentNode.offsetTop;

  const highlightHoverNew = ctxD1 && ctx.isPointInPath(ctxD1, x, y) ? 1 : ctxD2 && ctx.isPointInPath(ctxD2, x, y) ? 2 : ctxH && ctx.isPointInPath(ctxH, x, y) ? 3 : 0;
  if (highlightHoverNew != highlightHover)
  {
    highlightHover = highlightHoverNew;
    draw();
  }
});

elCanvas.addEventListener("mousedown", e =>
{
  e.preventDefault();
  const x = e.x - e.target.parentNode.offsetLeft,
        y = e.y - e.target.parentNode.offsetTop,
        highlightedPrev = highlighted;

  if (ctx.isPointInPath(ctxD1, x, y))
    highlighted = elD1;

  if (ctx.isPointInPath(ctxD2, x, y))
    highlighted = elD2;

  if (ctx.isPointInPath(ctxH, x, y))
    highlighted = elH;

  highlightHover = 0;
  highlighted.focus();
  if (highlightedPrev === highlighted)
    highlighted.select();
});

document.querySelectorAll(".input > input").forEach(e =>
{
  e.addEventListener("blur", onBlur);
  e.addEventListener("focus", onFocus);
  e.addEventListener("input", draw);
  e.addEventListener("keydown", onTextInput);
  e.addEventListener("beforeinput", onTextInput);//mobile
  e.addEventListener("textInput", onTextInput);//mobile
});
lastFocus.focus();
lastFocus.select();
})();