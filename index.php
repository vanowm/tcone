<!DOCTYPE html>
<html lang="en-US" notinited>

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
        <span tabindex="0" onfocus="h.focus();"></span>
        <input id="d1" title="Top Diameter" type="tel">
        <input id="d2" title="Bottom Diameter" type="tel">
        <input id="h" title="Height" type="tel">
        <span tabindex="0" onfocus="d1.focus();"></span>
      </div>
      <div class="result">
        <div id="result" class="table">
          <div id="r1"><label>Radius <label>R1</label>:</label><span></span><span></span></div>
          <div id="r2"><label>Radius <label>R2</label>:</label><span></span><span></span></div>
          <div id="l1"><label>Length <label>L1</label>:</label><span></span><span></span></div>
          <div id="l2"><label>Length <label>L2</label>:</label><span></span><span></span></div>
          <div id="l3"><label>Length <label>L3</label>:</label><span></span><span></span></div>
          <div id="height"><label>Length <label>L4</label>:</label><span></span><span></span></div>
          <div id="angle"><label><label>Angle</label>:</label><span></span><span></span></div>
        </div>
        <div class="download">Download:
          <a id="dxf" title="DXF"></a>
          <a id="pdf" title="PDF"></a>
          <a id="png" title="PNG"></a>
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
      <input id="main-menu" type="checkbox" data-popup="mainMenu">
      <label for="main-menu" class="close-overlay" title=""></label>
      <div class="menu popup">
        <header>Options</header>
        <div data-setting="p" data-type="dropdown" title="Precision">Precision:</div>
        <div data-setting="dpi" data-type="dropdown" title="Image (print) DPI">Image DPI:</div>
        <label data-type="fraction" class="value toggle" title="Show as fractions">Show as fractions: <span class="options"><span>off</span><span>on</span></span></label>
        <div data-setting="d" data-type="dropdown" title="Theme">Theme:</div>
        <label data-type="reset" class="value right font08" title="Reset all">Reset all</label>
      </div>
      <label for="main-menu" class="menu-icon" title="Menu">
        <span class="navicon" aria-label="Hamburger menu 'icon'"></span>
      </label>
    </nav>
  </header>
  <div class="hidden">
    <div id="hidden"></div>
    <select value="test"></select>
  </div>
</body>