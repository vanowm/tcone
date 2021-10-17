<!DOCTYPE html>
<html>

<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Truncated Cone Calculator</title>
  <link rel="stylesheet" media="screen" href="tcone.css">
</head>

<body>
  <div class="container">
    <canvas id="cone"></canvas>
    <span tabindex="1" onfocus="h.focus();"></span>
    <input id="d1" tabindex="2">
    <input id="d2" tabindex="3">
    <input id="h" tabindex="4">
    <span tabindex="5" onfocus="d1.focus();"></span>
  </div>
  <div class="container">
    <canvas id="coneResult"></canvas>
  </div>
  <span>
    <div class="result">
      <div><span>Radius R1: </span><span id="r1"></span></div>
      <div><span>Radius R2: </span><span id="r2"></span></div>
      <div><span>Arc Angle: </span><span id="angle"></span></div>
    </div>
  </span>

  <img src="https://craig-russell.co.uk/demos/cone_calculator/output_shape.png">
<div id="hidden">elD1.value</div>  
  <script src="fraction.js"></script>
  <script src="tcone.js"></script>
</body>