<!DOCTYPE html>
<html lang="en-US">

<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Truncated cone calculator">
  <title>Truncated Cone Calculator</title>
  <link rel="stylesheet" media="screen" href="tcone.css">
</head>

<body>
  <div class="container input">
    <canvas id="cone"></canvas>
    <span tabindex="0" onfocus="h.focus();"></span>
    <input id="d1" title="Top Diameter">
    <input id="d2" title="Bottom Diameter">
    <input id="h" title="Height">
    <span tabindex="0" onfocus="d1.focus();"></span>
  </div>
  <div class="container">
    <canvas id="coneResult"></canvas>
  </div>
  <div class="result">
    <div><span>Radius R1: </span><span id="r1"></span></div>
    <div><span>Radius R2: </span><span id="r2"></span></div>
    <div><span>Arc Angle: </span><span id="angle"></span></div>
  </div>

  <img src="https://craig-russell.co.uk/demos/cone_calculator/output_shape.png" alt="result">
<div id="hidden">elD1.value</div>  
  <script src="fraction.js"></script>
  <script src="tcone.js"></script>
</body>