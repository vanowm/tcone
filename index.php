<!DOCTYPE html>
<html>

<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Truncated Cone Calculator</title>
  <link rel="stylesheet" media="screen" href="tcone.css">
</head>

<body>
  <span class="container">
    <div>Length A: <input id="d1" value="1"></div>
    <div>Length B: <input id="d2" value="2"></div>
    <div>Length C: <input id="height" value="3"></div>
    <button onclick="doCalculation()">Calculate</button>
  </span>
  <canvas id="cone"></canvas>
  <canvas id="coneResult"></canvas>
  <div><img src="https://craig-russell.co.uk/demos/cone_calculator/input_shape.png"></div>
  <span class="container">
    <div class="result">
      <div><span>Radius R1: </span><span id="r1"></span></div>
      <div><span>Radius R2: </span><span id="r2"></span></div>
      <div><span>Arc Angle: </span><span id="angle"></span></div>
    </div>
  </span>

  <img src="https://craig-russell.co.uk/demos/cone_calculator/output_shape.png">
  <script src="fraction.js"></script>
  <script src="tcone.js"></script>
</body>