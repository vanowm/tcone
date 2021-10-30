<!DOCTYPE html>
<html lang="en-US">

<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Truncated cone calculator">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon-apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="manifest" href="/favicon-site.webmanifest">
  <link rel="mask-icon" href="/favicon-safari-pinned-tab.svg" color="#000000">

  <title>Truncated Cone Calculator</title>
  <link rel="stylesheet" media="screen" href="<?=getfile("css/tcone.css");?>">
</head>

<body>
  <div class="content">
    <div>
      <div class="container input">
        <canvas id="cone"></canvas>
        <span tabindex="0" onfocus="h.focus();"></span>
        <input id="d1" title="Top Diameter" type="tel">
        <input id="d2" title="Bottom Diameter" type="tel">
        <input id="h" title="Height" type="tel">
        <span tabindex="0" onfocus="d1.focus();"></span>
      </div>
      <div class="result">
        <div id="r1">Radius <label class="label">R1</label>:<span></span><span></span></div>
        <div id="r2">Radius <label class="label">R2</label>:<span></span><span></span></div>
        <div id="l1">Length <label class="label">L1</label>:<span></span><span></span></div>
        <div id="l2">Length <label class="label">L2</label>:<span></span><span></span></div>
        <div id="l3">Length <label class="label">L3</label>:<span></span><span></span></div>
        <div id="angle"><label class="label">Angle</label>:<span></span><span></span></div>
        <a id="dxf">Download DXF</a>
      </div>
    </div>
    <div>
      <canvas id="coneResult2"></canvas>
    </div>
    <div class="container">
      <canvas id="coneResult"></canvas>
    </div>
  </div>
  <div id="hidden">elD1.value</div>
  <div id="reset" title="Reset"></div>
  <script src="<?=getfile("js/fraction.js");?>"></script>
  <script src="<?=getfile("js/dxf.js");?>"></script>
  <script src="<?=getfile("js/tcone.js");?>"></script>
</body>