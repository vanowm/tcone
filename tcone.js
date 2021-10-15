(()=>
{
const elD1 = document.getElementById('d1'),
      elD2 = document.getElementById('d2'),
      elR1 = document.getElementById('r1'),
      elR2 = document.getElementById('r2'),
      elHeight = document.getElementById('height'),
      elAngle = document.getElementById('tilt'),
      canvas = document.getElementById("cone"),
      canvasR = document.getElementById("coneResult"),
      ctx = canvas.getContext("2d"),
      ctxR = canvas.getContext("2d");

// Form submit handler
function doCalculation(e) {

  // Inputs
  const d1 = Number(elD1.value),
        d2 = Number(elD2.value),
        height = elHeight.value;

  if (e && (d1 == "" || d2 == "" || height == ""))
  	return;

  console.log('Length A: ' + d1);
  console.log('Length B: ' + d2);
  console.log('Length C: ' + height);

  // Scale ratio between circles
  var scale_ratio = (0.5 * d1) / (0.5 * (d2 - d1));
  console.log('Scale Ratio: ' + scale_ratio);

  // Small tritilt sides
  const o = 0.5 * (d2 - d1),
        h = Math.sqrt(height * height + o * o);
  console.log('Side O: ' + o + ' Side A: ' + height + ' Side H: ' + h);

  // Circle Radii
  var rad1 = h * scale_ratio,
      rad2 = h + (h * scale_ratio);
  elR1.innerHTML = round(rad1);
  elR2.innerHTML = round(rad2);

  // Arc Ratio is arc length / circumference
  var arc_ratio = (Math.PI * d1) / (Math.PI * rad1 * 2);
  console.log('Arc Ratio: ' + arc_ratio);

  // Arc Angle in degrees
  elAngle.innerHTML = round(arc_ratio * 360);

  draw(d1,d2,height, rad1);
  const a = round(rad1),
        b = round(rad2),
        cos = Math.cos(round(arc_ratio * 360) * (Math.PI / 180));

  console.log(Math.sqrt(a*a + a*a - 2*a*a * cos));
  console.log(Math.sqrt(b*b + b*b - 2*b*b * cos));
}

function draw(d1, d2, h)
{
  const noValues = !(d1+d2+h);
  d1 = d1 || 2;
  d2 = d2 || 4;
  h = h || 3;
  // if (d1 > d2)
  //   [d1, d2] = [d2, d1];

  const width = 300,
        height = 300,
        lineWidth = 2;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.fillStyle = "transparent";
  ctx.fillStyle = "lightgreen";
  ctx.fillRect(0,0,canvas.width,canvas.width);

  ctx.textAlign ="start";
  ctx.font = "1em sans-serif";
  let text = "H" + (noValues ? "" : "=" + h);
  textSize = ctx.measureText(text);
  fontHeight = textSize.actualBoundingBoxAscent + textSize.actualBoundingBoxDescent;
console.log(canvas.width, textSize.width);
  const max = Math.max(d1, d2, h),
        n2p = new N2P(max, canvas.width - lineWidth * 4),
        tilt = 10,
        n2pH = n2p(h),
        offsetY = (height - n2pH)/2,
        n2pR1 = n2p(d1/2),
        n2pR2 = n2p(d2/2),
        n2pR1tilt = n2p(d1/tilt),
        n2pR2tilt = n2p(d2/tilt),
        x = n2p(Math.max(d1, d2))/2 + lineWidth,
        arrowBottomY = n2pH + offsetY + lineWidth * 4,
        arrowTopY = offsetY - lineWidth * 4,
        arrowTopLeft = x - n2pR1,
        arrowTopRight = x + n2pR1,
        arrowBottomLeft = x - n2pR2,
        arrowBottomRight = x + n2pR2,
        arrowRightX =  x + n2pR2 + lineWidth * 4,
        arrowRightTop = offsetY + n2pR1tilt,
        arrowRightBottom = n2pH + offsetY - n2pR2tilt,
        arrowSize = 8,
        arrowWidth = arrowSize / 3,
        arrowFill = 0,
        arrowClosed = 0,
        arrowLineOffset = arrowClosed ? arrowSize : 0;

  ctx.lineWidth = lineWidth;
  ctx.ellipse(x, n2pR1tilt + offsetY, n2pR1, n2pR1tilt, 0, 0, Math.PI * 2);           //top ellipse
  ctx.lineTo(arrowBottomRight, n2pH - n2pR2tilt + offsetY);                            //right side
  ctx.ellipse(x, n2pH - n2pR2tilt + offsetY, n2pR2, n2pR2tilt, 0, 0, Math.PI);        //bottom outside ellipse
  ctx.lineTo(arrowTopLeft, n2pR1tilt + offsetY);                                       //left side
  ctx.stroke();
  ctx.beginPath();
  ctx.setLineDash([2,4]);
  ctx.ellipse(x, n2pH - n2pR2tilt + offsetY, n2pR2 , n2pR2tilt, 0, 0, Math.PI, true); //bottom inside ellipse
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = lineWidth/2;

  var arrowFinish = e => ctx[arrowFill ? "fill" : "stroke"]();
  ctx.fillStyle = "black";
  ctx.beginPath();
  //top arrow
  //left
  ctx.moveTo(arrowTopLeft + arrowSize, arrowTopY - arrowWidth);
  ctx.lineTo(arrowTopLeft, arrowTopY);
  ctx.lineTo(arrowTopLeft + arrowSize, arrowTopY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowTopLeft + arrowSize, arrowTopY - arrowWidth);

  arrowFinish();

  //line
  ctx.moveTo(arrowTopLeft + arrowLineOffset, arrowTopY);
  ctx.lineTo(arrowTopRight - arrowLineOffset, arrowTopY);

  //right
  ctx.moveTo(arrowTopRight - arrowSize, arrowTopY - arrowWidth);
  ctx.lineTo(arrowTopRight, arrowTopY);
  ctx.lineTo(arrowTopRight - arrowSize, arrowTopY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowTopRight - arrowSize, arrowTopY - arrowWidth);

  arrowFinish();

  //bottom arrow
  //left
  ctx.moveTo(arrowBottomLeft + arrowSize, arrowBottomY - arrowWidth);
  ctx.lineTo(arrowBottomLeft, arrowBottomY);
  ctx.lineTo(arrowBottomLeft + arrowSize, arrowBottomY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowBottomLeft + arrowSize, arrowBottomY - arrowWidth);

  arrowFinish();

  //line
  ctx.moveTo(arrowBottomLeft + arrowLineOffset, arrowBottomY);
  ctx.lineTo(arrowBottomRight - arrowLineOffset, arrowBottomY);

  //right
  ctx.moveTo(arrowBottomRight - arrowSize, arrowBottomY - arrowWidth);
  ctx.lineTo(arrowBottomRight, arrowBottomY);
  ctx.lineTo(arrowBottomRight - arrowSize, arrowBottomY + arrowWidth);
  if (arrowClosed)
    ctx.lineTo(arrowBottomRight - arrowSize, arrowBottomY - arrowWidth);

  arrowFinish();
 
  //vertical arrow
  //top
  ctx.moveTo(arrowRightX + arrowWidth, arrowRightTop + arrowSize);
  ctx.lineTo(arrowRightX, arrowRightTop);
  ctx.lineTo(arrowRightX - arrowWidth, arrowRightTop + arrowSize);
  if (arrowClosed)
    ctx.lineTo(arrowRightX + arrowWidth, arrowRightTop + arrowSize);

  arrowFinish();

  //line
  ctx.moveTo(arrowRightX, arrowRightTop + arrowLineOffset);
  ctx.lineTo(arrowRightX, arrowRightBottom - arrowLineOffset);

  //bottom
  ctx.moveTo(arrowRightX + arrowWidth, arrowRightBottom - arrowSize);
  ctx.lineTo(arrowRightX, arrowRightBottom);
  ctx.lineTo(arrowRightX - arrowWidth, arrowRightBottom - arrowSize);
  if (arrowClosed)
    ctx.lineTo(arrowRightX + arrowWidth, arrowRightBottom - arrowSize);

  arrowFinish();
  ctx.fillStyle = "black";
  ctx.fillText(text, arrowRightX + lineWidth * 2,  arrowRightTop + (arrowRightBottom - arrowRightTop)/2 + fontHeight/2);

  ctx.textAlign ="center";
  text = "D1" + (noValues ? "" : "=" + d1),
  textSize = ctx.measureText(text),
  fontHeight = textSize.actualBoundingBoxAscent + textSize.actualBoundingBoxDescent;

  ctx.fillText(text, x, arrowTopY - lineWidth * 2);

  text = "D2" + (noValues ? "" : "=" + d2);
  textSize = ctx.measureText(text);
  fontHeight = textSize.actualBoundingBoxAscent + textSize.actualBoundingBoxDescent;
  ctx.fillText(text, x, arrowBottomY + fontHeight + lineWidth * 2);


  ctx.stroke();
}
function N2P(max, size)
{
  return n => n * size / max;
}
function round(n) {
  return Math.round(n * 100) / 100;
}

draw();
document.querySelectorAll("input").forEach(e => e.addEventListener("input", doCalculation));
})();