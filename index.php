<!DOCTYPE html>
<html lang="en-US" notInited>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Truncated cone (frustum) calculator">
  <meta name="color-scheme" content="light dark">
  <title>Truncated Cone Calculator</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon-apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="manifest" href="/favicon-site.webmanifest">
  <link rel="mask-icon" href="/favicon-safari-pinned-tab.svg" color="#000000">
  <link rel="stylesheet" media="screen" href="<?= getfile("css/tcone.css") ?>">
  <script src="<?= getfile("js/fraction.js"); ?>"></script>
  <script src="<?= getfile("js/dxf.js"); ?>"></script>
  <script src="<?= getfile("js/dpi.js"); ?>"></script>
  <script src="<?= getfile("js/tcone.js"); ?>"></script>
</head>

<body>
  <div class="content">
    <div class="input">
      <div class="container">
        <canvas id="cone"></canvas>
        <span tabindex="0" onfocus="height.focus();"></span>
        <input id="diamTop" title="Top Diameter" type="tel">
        <input id="diamBot" title="Bottom Diameter" type="tel">
        <input id="height" title="Height" type="tel">
        <span tabindex="0" onfocus="diamTop.focus();"></span>
      </div>
      <div class="result">
        <div id="result" class="table">
          <div id="radTop"><label><span>Radius</span><label>Top</label>:</label><span></span><span></span></div>
          <div id="radBot"><label><span>Radius</span><label>Bot</label>:</label><span></span><span></span></div>
          <div id="lenTop"><label><span>Length</span><label>Top</label>:</label><span></span><span></span></div>
          <div id="lenBot"><label><span>Length</span><label>Bot</label>:</label><span></span><span></span></div>
          <div id="lenDia"><label><span>Length</span><label>Diag</label>:</label><span></span><span></span></div>
          <div id="lenSide"><label><span>Length</span><label>Side</label>:</label><span></span><span></span></div>
          <div id="angle"><label><label>Angle</label>:</label><span></span><span></span></div>
        </div>
        <div class="download">Download:
          <a id="dxf" title="DXF"></a>
          <a id="png" title="PNG"></a>
          <a id="pdf" title="PDF"></a>
        </div>
      </div>
    </div>
    <div>
      <canvas id="coneTemplateInfo" download="test.png"></canvas>
    </div>
    <div>
      <div>Final shape:</div>
      <div class="container">
        <canvas id="coneTemplate"></canvas>
      </div>
    </div>
  </div>
  <canvas id="canvas" width="300" height="300"></canvas>
  <header>
    <nav id="navbar">
      <input id="mainMenu" type="checkbox" data-popup="mainMenu">
      <label for="mainMenu" class="close-overlay" title=""></label>
      <div class="menu popup">
        <header>Options</header>
        <div data-setting="precision" data-type="dropdown" title="Precision">Precision:</div>
        <div data-setting="dpi" data-type="dropdown" title="Image (print) DPI">Image DPI:</div>
        <label data-type="fraction" class="value toggle" title="Show as fractions">Show as fractions: <span class="options"><span>off</span><span>on</span></span></label>
        <div data-setting="theme" data-type="dropdown" title="Theme">Theme:</div>
        <label data-type="reset" class="value right font08" title="Reset all">Reset all</label>
      </div>
      <label for="mainMenu" class="menu-icon" title="Menu">
        <span class="nav-icon" aria-label="Hamburger menu 'icon'"></span>
      </label>
    </nav>
  </header>
  <div class="hidden">
    <div id="hidden"></div>
    <select value="test"></select>
  </div>
</body>