//jshint -W018,-W014, esversion:9
window.addEventListener("DOMContentLoaded", init);

function init(e)
{
  const drawImage = (options) => //canvas, d1, d2, h, _lineWidth, strokeColor, fillColor, patternOnly, fullSize) =>
  {
    const canvas = options.canvas,
          d1 = options.top,
          d2 = options.bottom,
          h = options.height,
          _lineWidth = options.lineWidth || lineWidth,
          backgroundColor = options.background || "transparent",
          strokeColor = options.stroke || color.stroke,
          fillColor = options.fill || color.fill,
          templateOnly = options.templateOnly,
          dpi = options.dpi;

    const data = new Proxy(...(() =>
    {
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
        angleDeg = (angleRad * 180) / Math.PI /*(360 * c) / cT*/ /* angle in degres */ ,
        r1Length = angleRad * r1 /* length of top arc */ ,
        r2Length = angleRad * r2 /* length of bottom arc */ ,
        arcEnd = (c1, c2, radius, angleRad, bot) => !isFinite(radius) || !radius ? [c1, c2 + (bot ? h : 0), circumference2, c2 + (bot ? h : 0)] : [
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
        bounds = [r2Ends[1] < 0 ? r2 * 2 : l2, isFinite(r2) ? r2 - Math.min(r2Ends[1], r1Ends[1]) : r2Ends[1]],
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
          bounds,
          dpi,
        },
        handler = {
          /** using proxy object to convert any variables that start with _ to percentatge value and $ = round to 2 decimal places */
          get: function (target, prop)
          {
            if (!(prop in target))
            {
              const func = {
                  _: this.n2p,
                  $: round,
                },
                F = Object.keys(func).join("").replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&"),
                match = (prop.match(new RegExp("^([" + F + "]*)", "")) || ["", "",])[1].split("");

              if (match.length)
              {
                const key = prop.replace(new RegExp("^[" + F + "]+", ""), "");
                let val = target[key];
                for (let i = 0; i < match.length; i++)
                {
                  if (key in target)
                    target[prop] = val = (val instanceof Array ? val.map(func[match[i]]) : func[match[i]](val));
                }
              }
            }
            return target[prop];
          },
          n2p: new N2P(
            d1 == d2 ?
            Math.max((d1 / 2) * Math.PI * 2, h) :
            templateOnly ? Math.max(...bounds) :
            Math.max(
              r2,
              r2Ends[1] < 0 ? r2 * 2 : lineLength(...r2Ends),
              r2 - r2Ends[1]
            ),
            (dpi? Math.max(...bounds.map(s => s * dpi - _lineWidth * 4)) : Math.max(canvas.width, canvas.height)) - _lineWidth * 2
          ),
        };
      return [data, handler];
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
      data.y = -Math.min(data._r1Ends[1], data._r2Ends[1])+_lineWidth;

// console.log(canvas.width);
    }
    else
    {
      data.y = Math.min(data._r1Ends[1], data._r2Ends[1]);
      if (data.y < 0)
        data.y = Math.abs(data.y) + _lineWidth;
      else
        data.y = _lineWidth;
    }
    const topArcEnds = data.arcEnd(data.x, data.y, data._r1, data.angleRad),
      bottomArcEnds = data.arcEnd(
        data.x,
        data.y,
        data._r2,
        data.angleRad,
        true
      );

    data.topArcEnds = topArcEnds;
    data.bottomArcEnds = bottomArcEnds;
    const ctx = canvas.getContext("2d");
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
      ctx.rect(
        data.topArcEnds[0] - data.x + 1,
        data.topArcEnds[1] - data.y + 1,
        data._circumference1,
        data._h
      );
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
    elL4 = document.getElementById("height"),
    elHidden = document.getElementById("hidden"),
    elCanvasCone = document.getElementById("cone"),
    elCanvasTemplate = document.getElementById("coneTemplate"),
    elCanvasTemplateInfo = document.getElementById("coneTemplateInfo"),
    elPrecision = document.getElementById("precision"),
    elNavbar = document.getElementById("navbar"),
    elMenuFraction = document.querySelector('[data-type="fraction"]'),
    elResult = document.getElementById("result"),
    menus = {
      precision: document.getElementById("precision-dropdown"),
      mainMenu: document.getElementById("main-menu"),
    },
    ctxCone = elCanvasCone.getContext("2d"),
    settings = new Proxy(JSON.parse(localStorage.getItem("tconeData")) ||
    {},
    {
      inited: false,
      init(target)
      {
        for (let i in this.default)
        {
          if (!this.default[i].valid) continue;

          if (
            Array.isArray(this.default[i].valid) &&
            this.default[i].valid.indexOf(target[i]) == -1
          )
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
        if (name == "reset")
        {
          for (let i in target)
            delete target[i];

          name = "default";
          this.save();
        }
        if (name == "default")
          return Object.keys(this.default)
            .reduce(
              (a, v) => (
              {
                ...a,
                [v]: this.default[v].value
              }),
              {}
            );

        return name in target ? target[name] : this.default[name] && this.default[name].value;
      },
      set: function (target, name, value)
      {
        if (!(name in this.default))
          return;

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
          return;

        target[name] = value;
        for (let i in target)
        {
          if (!(i in this.default) || (this.default[i].valid && this.default[i].valid.indexOf(target[i]) == -1))
          {
            delete target[i];
          }
        }
        this.save();
        if (name == "d")
        {
          color.theme = value == 2 ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
            .matches : value;
        }
      },
      save()
      {
        localStorage.setItem("tconeData", JSON.stringify(this.target));
      },
      default:
      {
        t:
        {
          /**top */
          value: "6",
        },

        b:
        {
          /**bottom */
          value: "8",
        },

        h:
        {
          /**height */
          value: "10",
        },

        d:
        {
          /**dark mode */
          value: 2,
          valid: [0, 1, 2],
        },

        p:
        {
          value: 16,
          valid: [1, 2, 4, 8, 16, 32, 64, 128],
        },

        dpi:
        {
          value: 300,
        },

        f: /* show as fractions */
        {
          value: 1,
          valid: [0, 1]
        }
        /**precision */
      },
    }),
    color = new Proxy(
    {},
    {
      theme: settings.d == 2 ?
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)")
        .matches : settings.d,
      colors:
      {
        get stroke()
        {
          const c = getComputedStyle(elCanvasCone)
            .color;
          return [c, c];
        },
        error: ["red", "red"],
        highlight: ["lightgreen", "lightgreen"],
        fill: ["#008000", "#376E37"],
        fillHover: ["#E0FFE0", "#87B987"],
        get label()
        {
          const c = getComputedStyle(document.documentElement)
            .getPropertyValue("--labelColor")
            .trim();
          return [c, c];
        },
      },
      set: function (target, name, value)
      {
        if (name == "theme") this.theme = ~~value;
      },
      get: function (target, name)
      {
        return name == "theme" ?
          this.theme :
          this.colors[name][~~this.theme];
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
      return Object.keys(o)
        .reduce((o, a) =>
        {
          o[o[a]] = a;
          return o;
        }, o);
    })(),
    fractionGlyphs = Object.keys(fractions)
    .filter(a => a.length < 2)
    .join(""),
    fractionFilter = new RegExp("[" + fractionGlyphs + "]", "g"),
    canvasWidth = parseFloat(
      getComputedStyle(document.documentElement)
      .getPropertyValue("--size")
    ),
    canvasHeight = canvasWidth,
    lineWidth = 1,
    /* main body line width */
    showErrorSides = 1;

  /** show as fraction */
  showAsFraction();

  /** precision dropdown */
  dropdown(elPrecision);

/*
default
*/
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
  closeMenu();
  setTheme();
  onFocus({target: prevFocus});
 
  if (this.inited)
    return;

/*
functions
*/

  function showAsFraction(f)
  {
    if (f !== undefined)
      settings.f = f;

    f = settings.f;
    elMenuFraction.value = f;
    elMenuFraction.setAttribute("value", f);
  }

  
  function dropdown(el)
  {
    const elDropdown = el.querySelector(".dropdown-list"),
      elUl = el.querySelector("ul"),
      elOption = document.createElement("li");

    let placeholder;
    for (let i = 1, val = 1, max = 0, o; i < 9; i++)
    {
      val = i > 1 ? val * 2 : i;
      o = elUl.children[i-1] || elOption.cloneNode(true);
      o.classList.toggle("default", val == settings.default.p);
      o.value = val;
      o.textContent = i == 1 ? "Round" : "1⁄" + val;
      o.classList.add("option");
      selected = settings.p == val;
      o.classList.toggle("selected", selected);
      if (!elUl.children[i-1])
        elUl.appendChild(o);

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
    el.value = settings.p;
    el.querySelector('input[type="checkbox"]').checked = false;
  }
  
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
    elCanvasTemplate.width = canvasWidth;
    elCanvasTemplate.height = canvasHeight;
    elCanvasTemplate.style.width = canvasWidth + "px";
    elCanvasTemplate.style.height = canvasHeight + "px";
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
      dMax = Math.max(d1, d2),
      ratio = Math.min(dMax, h) / Math.max(dMax, h),
      t = Math.abs(ratio* h % 18 - 18),//Math.min(1, Math.max(0.1, tt)),
      _r1Tilt = n2p(Math.max(0, d1 / (t || 1))),
      _r2Tilt = n2p(Math.max(0, d2 / (t || 1))),
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
        ctxCone.ellipse(_x, _r1Tilt + offsetY, _r1, _r1Tilt, Math.PI, 0, Math.PI, true); //top ellipse
        ctxCone.ellipse(_x, _h - _r2Tilt + offsetY, _r2, _r2Tilt, 0, 0, Math.PI); //bottom outside ellipse
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
    const data = drawImage({canvas: elCanvasTemplate, top: d1, bottom: d2, height: h, lineWidth: lineWidth, templateOnly: false});

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

    dxf.viewport(
      d1 == d2 ? data.circumference1 / 2 : 0,
      d1 == d2 ? h / 2 : vY,
      d1 == d2 ? data.circumference1 / 1.5 : vW
    );
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

    setTimeout(() =>
    {
      const link = document.getElementById("dxf");
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

    /* generate PNG */

    setTimeout(() =>
    {
      const canvas = document.createElement("canvas"),
            pngData = drawImage({canvas, top: d1, bottom: d2, height: h, lineWidth: lineWidth, stroke: "black", background: "white", fill: "transparent", templateOnly: true, dpi: settings.dpi}),
            link = document.getElementById("png");

      if (link._prev && link._prev.d1 == d1 && link._prev.d2 == d2 && link._prev.h == h)
        return;

      link._prev = {d1, d2, h};
      link.removeAttribute("download");
      link.removeAttribute("href");
      canvas.toBlob(blob =>
      {
        if (!blob)
          return;

        link.setAttribute("download", `cone_template_${data.$diameter1}x${data.$diameter2}x${data.$h}_(300dpi).png`);
        link.href = URL.createObjectURL(blob);
      });
    });
    const angle = round(toDegree(data.angleRad));

    showValue(elR1, data.r1, data.$r1);
    showValue(elR2, data.r2, data.$r2);
    showValue(elL1, data.l1, data.$l1);
    showValue(elL2, data.l2, data.$l2);
    showValue(elL3, data.l3, data.$l3);
    showValue(elL4, data.rH, data.$rH);
    showValue(elAngle, angle ? angle + "°" : NaN, angle ? round(data.angleRad) + " radians" : NaN, false);

    /* mock-up */
    const ctxR2 = elCanvasTemplateInfo.getContext("2d"),
      resStyle = window.getComputedStyle(elCanvasTemplateInfo);

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
    let x1 = d.x - 28,
      x2 = d.topArcEnds[2] - 28,
      y1 = d.y,
      y2 = d.topArcEnds[1] - 10;

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
    let r = elD1.getBoundingClientRect(),
      x = _x - r.width / 2 > 0 ? _x : r.width / 2,
      y = arrowTopY -  4;

    elD1.style.left = x - r.width / 2 + "px";
    elD1.style.top = y - r.height + "px";

    r = elD2.getBoundingClientRect();
    x = _x - r.width / 2 > 0 ? _x : r.width / 2;
    y = arrowBottomY + r.height + 4;
    elD2.style.left = x - r.width / 2 + "px";
    elD2.style.top = y - r.height + "px";

    r = elH.getBoundingClientRect();
    x = arrowRightX + 4;
    y = arrowRightTop + (arrowRightBottom - arrowRightTop) / 2;
    elH.style.left = x + "px";
    elH.style.top = y - r.height / 2 + "px";

    if (!errD1) settings.t = d1Value;
    if (!errD2) settings.b = d2Value;
    if (!errH) settings.h = hValue;
    elCanvasTemplateInfo.dataset.type = settings.f;
  }

  function Arrow(ctx, options)
  {
    const style = getComputedStyle(ctx.canvas),
      getValue = (name, fallback) =>
      {
        let val = style.getPropertyValue("--" + name)
          .trim();
        if (val === "" || val === '""') val = fallback || "";
        else val = val;
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
    options = Object.assign(
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
        colorError: getValue("arrowColorError", color.error),
      },
      options ||
      {}
    );

    const fillText = (el, p, dist, nopos) =>
      {
        ctx.save();
        const ca = ctx.globalAlpha,
              resStyle = window.getComputedStyle(elCanvasTemplateInfo);
        let text = el.querySelector("span" + (settings.f || el.id == "angle" ? "" : ":nth-of-type(2)")).textContent.replace(/[()]/g,''),
            text2 = el.querySelector("label > label").textContent;

        ctx.globalAlpha = 1;
        let [x1, y1, x2, y2] = p, [px, py] = getPerpendicular(x1, y1, x2, y2, 5),
          xp1 = x1 + px,
          xp2 = x2 + px,
          yp1 = y1 - py,
          yp2 = y2 - py;
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
          nopos ? -2 : -elHidden.getBoundingClientRect()
          .width / 1.9,
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
      },
      arrowDraw = (e, a) =>
      {
        ctx.lineWidth = options.lineWidth;
        ctx.globalAlpha = options.alpha * (options.fill && a ? a : 1);
        ctx.strokeStyle =
          e && options.showError ? options.colorError : options.color;
        ctx.fillStyle =
          e && options.showError ? options.colorError : options.color;
        if (options.fill) ctx.fill();

        ctx.stroke();
      },
      drawArrow = (x1, y1, x2, y2, start, end, err) =>
      {
        const rad = angle(x1, y1, x2, y2);
        ctx.save();
        /** line */
        ctx.beginPath();
        ctx.moveTo(
          ...getPointOnLine(
            x1,
            y1,
            x2,
            y2,
            options.headClosed && start ? options.headSize : 0
          )
        );
        ctx.lineTo(
          ...getPointOnLine(
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
      },
      draw = (p, start, end, err, text) =>
      {
        if (start || end) drawArrow(...p, start, end, err);

        if (text) fillText(...text);
      };
    return Object.assign(draw, options);
  }

  function lineLength(x1, y1, x2, y2)
  {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }

  function getParallelLine(x1, y1, x2, y2, dist)
  {
    const [px, py] = getPerpendicular(x2, y2, x1, y1, dist),
      xp1 = x1 + px,
      xp2 = x2 + px,
      yp1 = y1 - py,
      yp2 = y2 - py;
    return [
      ...getPointOnLine(xp2, yp2, xp1, yp1, 0),
      ...getPointOnLine(xp1, yp1, xp2, yp2, 0),
    ];
  }

  function getPointOnLine(x1, y1, x2, y2, dist)
  {
    let len = lineLength(x1, y1, x2, y2),
      t = dist / len;
    return [(1 - t) * x1 + t * x2, (1 - t) * y1 + t * y2];
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

  function isNan(t)
  {
    return ("" + t)
      .match(/^(NaN|Infinity|undefined|n\/a|N\/A)$/);
  }

  function showValue(el, ...args)
  {
    const children = el.querySelectorAll("span"),
      f = t => (isNan(t) ? "N/A" : t);

    el.classList.remove("na");

    const precision = ~~elPrecision.value;
    if (args[args.length - 1] !== false) el.value = args[0];

    for (let i = 0, na; i < args.length; i++)
    {
      if (!children[i]) continue;

      const val = i || args[args.length - 1] === false ? args[i] : fractionFormat(fractionLimit(args[i], precision), args[i]);
      na = isNan(val);
      if (na)
        el.classList.add("na");

      children[i].classList.toggle("na", na);
      children[i].innerHTML = i ? "(" + f(val) + ")" : f(val);
    }
  }

  function inputWidth(el)
  {
    for (let i = 0, style = getComputedStyle(el); i < style.length; i++)
      elHidden.style[style[i]] = style[i].match(/color/i) ? "transparent" : style[style[i]];

    elHidden.style.padding = "0.5em";
    elHidden.textContent = el.value;
    el.style.width = elHidden.getBoundingClientRect()
      .width + "px";
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
    return n => (n * size) / max || 0;
  }

  function round(n)
  {
    return Math.round(n * 100) / 100;
  }

  function fractionLimit(num, denominator)
  {
    if (denominator === undefined) denominator = settings.p;

    if (denominator > 0)
      return new Fraction(
          Math.round(new Fraction(num) * denominator),
          denominator
        )
        .toFraction(true);
    else return new Fraction(Math.floor(new Fraction(num)), 1)
      .toFraction(true);
  }

  function fractionFormat(f, n)
  {
    return f.replace(
      /^([0-9]+)\/([0-9]+)|([0-9]+)(\s+([0-9]+)\/([0-9]+))|([0-9]+)/,
      (...args) =>
      {
        let r = args[3] || args[7] || "";
        if (args[1] || args[5])
          r +=
          (r !== "" ? (round((args[1] || args[5]) / (args[2] || args[6])) == round(n % 1) ? " " : "~") : "") +
          `${args[1] || args[5]}⁄${args[2] || args[6]}`;
        // r += (r !== "" ? " " : "") + `<sup>${args[1] || args[5]}</sup>&frasl;<sub>${args[2] || args[6]}</sub>`;
        return r;
      }
    );
    // return f.replace(/^([0-9]+)\/([0-9]+)|([0-9]+)(\s+([0-9]+)\/([0-9]+))|([0-9]+)/, '$3$7 $1$5⁄$2$6');
  }

  function setTheme(theme)
  {
    if (theme === undefined)
      theme = settings.d;

    if (theme == 2)
      document.documentElement.removeAttribute("theme");
    else
      document.documentElement.setAttribute("theme", settings.d ? "dark" : "light");

    document.querySelector('[data-type="theme"]').setAttribute("value", theme);
    settings.d = theme;
    const style =
      document.getElementById("dropdownstyle") ||
      document.createElement("style"),
      s = getComputedStyle(document.querySelector("select")),
      css = `label.dropdown{
                ${Array.from(s)
                  .map(k => `${k}:${s[k]}`)
                  .join(";")}
              }`;
    style.innerHTML = css;
    style.id = "dropdownstyle";
    document.head.insertBefore(
      style,
      document.head.querySelector("[rel='stylesheet']")
    );
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
    curX = e.offsetX;
    curY = e.offsetY;

    let el;
    if (ctxCone.isPointInPath(ctxD1, curX, curY))
      el = elD1;

    if (ctxCone.isPointInPath(ctxD2, curX, curY))
      el = elD2;

    if (ctxCone.isPointInPath(ctxH, curX, curY))
      el = elH;

    if (el)
      highlighted = el;

    if (!highlighted)
      return;

    if (el)
      e.preventDefault();

    highlightHover = 0;
    highlighted.focus();
    if (e.type == "dblclick") // && highlightedPrev === highlighted)
      highlighted.select();

  }

  function closeMenu(menu)
  {
    let m = {};
    if (!menu)
      m = menus;
    else
      m[menu] = menus[menu];

    for(let i in m)
    {
      if (menus[i])
        menus[i].checked = false;
    }
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
  
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e =>
  {
    if (settings.d != 2) return;

    color.theme = e.matches;
    setTheme();
    draw(true);
  });

  elNavbar.addEventListener("click", e =>
  {
    let clicked = false,
        t;

    if (e.target.dataset.popup)
    {
      if (!document.body.popups)
        document.body.popups = [];

      const index = document.body.popups.indexOf(e.target.dataset.popup);
      if (e.target.checked)
      {
        if (index == -1)
          document.body.popups.push(e.target.dataset.popup);
      }
      else
        document.body.popups.splice(index, 1);

      if (document.body.popups.length)
        document.body.dataset.popup = document.body.popups[document.body.popups.length-1];
      else
        delete document.body.dataset.popup;
    }
    switch (e.target.dataset.type)
    {
      case "reset":
        settings.reset;
        init();
        clicked = true;
        break;

      case "theme":
        t = settings.d;
        if (++t > 2)
          t = 0;

        settings.d = t;
        e.target.setAttribute("value", t);
        setTheme();
        draw(true);
        clicked = true;
        break;

      case "fraction":
        t = settings.f;
        if (++t > 1)
          t = 0;

        showAsFraction(t);
        draw(true);
        clicked = true;
        break;
    }
    if (e.target.classList.contains("close-layer"))
    {
      setTimeout(e=>(closeMenu(e.target.dataset.type)), 100);
      clicked = true;
    }
    // if (clicked)
    //   e.preventDefault();
  }, true);

  elCanvasTemplateInfo.addEventListener("click", e =>
  {
    const f = settings.f;
    settings.f = ~~!~~elCanvasTemplateInfo.dataset.type;
    draw(true);
    settings.f = f;
    e.preventDefault();
  });

  elCanvasTemplateInfo.addEventListener("dblclick", e =>
  {
    e.preventDefault();
  });

  elPrecision.addEventListener("click", e =>
  {
    if (!e.target.classList.contains("option"))
      return;

    const precision = ~~e.target.value;
    settings.p = precision;
    for (let i = 0; i < elResult.children.length; i++)
    {
      const el = elResult.children[i];
      if (isNan(el.value)) continue;

      el.querySelector("span")
        .textContent = fractionFormat(
          fractionLimit(el.value, precision)
        );

      elPrecision.value = precision;
    }
    dropdown(elPrecision);
    closeMenu("precision");
    draw(true);
    e.preventDefault();
  });

  document.documentElement.classList.add("inited");
  this.inited = true;
}
