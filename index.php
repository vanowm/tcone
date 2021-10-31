<?php
  if ($_SERVER['QUERY_STRING'])
  {
    function getColor($c)
    {
      preg_match("/^(?:([a-fA-F0-9]{3})|([a-fA-F0-9]{6})|([a-fA-F0-9]{8}))$/", $c, $m);
      if ($m)
        $c = "#" . $m[1] . $m[2] . $m[3];

      return $c;
    }
    $colors = array("unset" /* body */, "unset" /* accent3 */, "unset" /* accent2 */, "unset" /* accent1 */, "transparent" /* accent */);
    $data = @file_get_contents("css/images/" . preg_replace_callback("/^([a-zA-Z0-9]+)(?:[_-]([a-zA-Z0-9]+)(?:[_-]([a-zA-Z0-9]+)(?:[_-]([a-zA-Z0-9]+)(?:[_-]([a-zA-Z0-9]+))?)?)?)?$/", 
      function($m)
      {
        global $colors;
        $color = getColor($m[2]);
        if ($color)
          $colors[0] = $color;

        $color = getColor($m[3]);
        if ($color)
          $colors[1] = $color;

        $color = getColor($m[4]);
        if ($color)
          $colors[2] = $color;
    
        $color = getColor($m[5]);
        if ($color)
          $colors[3] = $color;

        $color = getColor($m[6]);
        if ($color)
          $colors[4] = $color;

        return $m[1];
      }, $_SERVER['QUERY_STRING']) . ".svg");

    
    $data = str_replace(array("BODY","ACCENT1", "ACCENT2", "ACCENT3", "ACCENT"), $colors, $data);
    header("Content-Type: image/svg+xml");
    exit($data);
  }
?>
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
  <link rel="stylesheet" media="screen" href="<?=getfile("css/tcone.css")?>">
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
        <div class="table">
          <div id="r1"><label>Radius <label>R1</label>:</label><span></span><span></span></div>
          <div id="r2"><label>Radius <label>R2</label>:</label><span></span><span></span></div>
          <div id="l1"><label>Length <label>L1</label>:</label><span></span><span></span></div>
          <div id="l2"><label>Length <label>L2</label>:</label><span></span><span></span></div>
          <div id="l3"><label>Length <label>L3</label>:</label><span></span><span></span></div>
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
      <canvas id="coneResult2"></canvas>
    </div>
    <div><div>Final shape:</div>
      <div class="container">
        <canvas id="coneResult"></canvas>
      </div>
    </div>
  </div>
  <div id="hidden">elD1.value</div>
  <div id="reset" title="Reset"></div>
  <script src="<?=getfile("js/fraction.js");?>"></script>
  <script src="<?=getfile("js/dxf.js");?>"></script>
  <script src="<?=getfile("js/tcone.js");?>"></script>
</body>