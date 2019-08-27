var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_TranslateMatrix;\n' +
  'uniform mat4 u_ScaleMatrix;\n' +

  'uniform mat4 u_RotateAux;\n' +
  'uniform mat4 u_RotateXMatrix;\n' +
  'uniform mat4 u_RotateYMatrix;\n' +
  'uniform mat4 u_RotateZMatrix;\n' +
  'uniform mat4 u_RotateAux2;\n' +

  'attribute vec4 a_Color;\n' +
  'varying vec4 v_FragColor;\n' +
  'void main() {\n' +
  ' gl_Position = u_TranslateMatrix * u_RotateAux2 * u_ScaleMatrix * u_RotateZMatrix * u_RotateYMatrix * u_RotateXMatrix * u_RotateAux * a_Position;\n'+
  ' v_FragColor = a_Color;\n'+
  ' gl_PointSize = 10.0;\n'+
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_FragColor;\n' +
  'void main(){\n'+
  //' gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n'+
  ' gl_FragColor = v_FragColor;\n'+
  '}\n';

var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas);

function main(){
  if(!gl){
    console.log('Failed to get the WebGL context');
    return;
  }

  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
    console.log('Failed to initialize shaders');
    return;
  }
  initTransforms();
  canvas.onclick = function(ev){ click(ev, gl, canvas); };
  //canvas.oncontextmenu  = function(ev){ rightClick(ev, gl, canvas);  return false;};
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
}

var g_points = [[]];
var g_colors = [[]];
var clicks = {Value: 0};
var index = 0;
var currObject = 0;
var currObjectColor = [0, 0, 0];
var zPos = 0.0;

var angleX = 0.0;
var angleY = 0.0;
var angleZ = 0.0;
var mode = "normal";

function selectObject(event){
  //mode = "modify";
  mode = "normal";
  console.log(parseInt(event.target.value));
  currObject = parseInt(event.target.value);
  $("#current-object-field").text("Current object: Object " + (currObject + 1));
  $("#object-title").text("Object " + (currObject + 1));

  // inserting current object's last info
  $("#x-translate").val(g_transforms[currObject][0][12]);
  $("#y-translate").val(g_transforms[currObject][0][13]);
  $("#z-translate").val(g_transforms[currObject][0][14]);

  $("#x-scale").val(g_transforms[currObject][1][0]);
  $("#y-scale").val(g_transforms[currObject][1][5]);
  $("#z-scale").val(g_transforms[currObject][1][10]);

  $("#x-rotate").val(g_transforms[currObject][7][0]);
  $("#y-rotate").val(g_transforms[currObject][7][1]);
  $("#z-rotate").val(g_transforms[currObject][7][2]);
}

var g_transforms = [[]]

function getNewTransformMatrix(){
  var transformMatrix = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  ]);
  return transformMatrix;
}

function newObject(event){
  mode = "normal";
  index += 1;
  g_points.push([]);
  g_colors.push([]);

  g_transforms.push([])
  for(var i = 0; i < 7; i++){
    g_transforms[index].push(getNewTransformMatrix());
  }
  g_transforms[index].push([0, 0, 0]);
  g_transforms[index].push(["active"]);
  currObject = index;
  $("#current-object-field").text("Current object: Object " + (currObject + 1));
  $("#object-title").text("Object " + (currObject + 1));
  $("#sidebar").append('<button class = "object-button" onclick = "selectObject(event); " value = ' + (index) + ' id = "' + (index) +'">Object ' + (index + 1) + '</button>');

  //range bars in zero here
  console.log("objects: " + g_colors.length);
}

function updateTextInput(val) {
  zPos = parseFloat(val);
  document.getElementById('textInput').value = val;
}

function centroid(obj){
  var sum = {x: 0.0, y: 0.0, z: 0.0};

  for(var i = 0; i < g_points[obj].length; i += 3){
    sum.x += g_points[obj][i];
    sum.y += g_points[obj][i + 1];
    sum.z += g_points[obj][i + 2];
  }
  sum.x = sum.x / (g_points[obj].length/3.0);
  sum.y = sum.y / (g_points[obj].length/3.0);
  sum.z = sum.z / (g_points[obj].length/3.0);
  return sum;
}

function initTransforms(){
  g_transforms.push([]);
  for(var i = 0; i < 7; i++){
    g_transforms[0].push(getNewTransformMatrix());
  }
  g_transforms[0].push([0, 0, 0]);
  g_transforms[0].push(["active"]);
}
function updateTranslate(value, id){
  mode = "modify";
  if(id == "x-translate"){
    g_transforms[currObject][0][12] = value;
  }
  if(id == "y-translate"){
    g_transforms[currObject][0][13] = value;
  }
  if(id == "z-translate"){
    g_transforms[currObject][0][14] = value;
  }

  paint();
}

function initCentroid(){
  g_transforms[currObject][2][12] = -1*centroid(currObject).x;
  g_transforms[currObject][2][13] = -1*centroid(currObject).y;
  g_transforms[currObject][2][14] = -1*centroid(currObject).z;

  g_transforms[currObject][6][12] = centroid(currObject).x;
  g_transforms[currObject][6][13] = centroid(currObject).y;
  g_transforms[currObject][6][14] = centroid(currObject).z;
}

function updateScale(value, id){
  mode = "modify";
  initCentroid();

  if(id == "x-scale"){
    g_transforms[currObject][1][0] = value;
  }
  if(id == "y-scale"){
    g_transforms[currObject][1][5] = value;
  }
  if(id == "z-scale"){
    g_transforms[currObject][1][10] = value;
  }

  paint();
}
function updateRotate(value, id){
  mode = "modify";
  var cosB = Math.cos(value*(3.1416 / 180.0));
  var sinB = Math.sin(value*(3.1416 / 180.0));

  initCentroid();

  if(id == "x-rotate"){
    angleX = value;
    g_transforms[currObject][7][0] = value;

    g_transforms[currObject][3][5] = cosB;
    g_transforms[currObject][3][6] = sinB;
    g_transforms[currObject][3][9] = -1*sinB;
    g_transforms[currObject][3][10] = cosB;
  }
  if(id == "y-rotate"){
    angleY = value;
    g_transforms[currObject][7][1] = value;

    g_transforms[currObject][4][2] = -1*sinB;
    g_transforms[currObject][4][8] = sinB;
    g_transforms[currObject][4][0] = cosB;
    g_transforms[currObject][4][10] = cosB;
  }
  if(id == "z-rotate"){
    angleZ = value;
    g_transforms[currObject][7][2] = value;

    g_transforms[currObject][5][0] = cosB;
    g_transforms[currObject][5][1] = sinB;
    g_transforms[currObject][5][4] = -1*sinB;
    g_transforms[currObject][5][5] = cosB;
  }
  paint();
}
function eraseObject(){
  g_transforms[currObject][8][0] = "inactive";
  $("#" + currObject).remove();
  $("#current-object-field").text("Current object: No Object");
  $("#object-title").text("No Object");
  paint();
}

function paint(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  //gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    for(var i = 0; i < g_points.length; i++){

      if(g_transforms[i][8][0] == "inactive"){
        console.log("erase");
        continue;
      }
      var u_TranslateMatrix = gl.getUniformLocation(gl.program, 'u_TranslateMatrix');
      var u_ScaleMatrix = gl.getUniformLocation(gl.program, 'u_ScaleMatrix');

      var u_RotateAux = gl.getUniformLocation(gl.program, 'u_RotateAux');
      var u_RotateXMatrix = gl.getUniformLocation(gl.program, 'u_RotateXMatrix');
      var u_RotateYMatrix = gl.getUniformLocation(gl.program, 'u_RotateYMatrix');
      var u_RotateZMatrix = gl.getUniformLocation(gl.program, 'u_RotateZMatrix');
      var u_RotateAux2 = gl.getUniformLocation(gl.program, 'u_RotateAux2');

      gl.uniformMatrix4fv(u_TranslateMatrix, false, g_transforms[i][0]);
      gl.uniformMatrix4fv(u_ScaleMatrix, false, g_transforms[i][1]);

      gl.uniformMatrix4fv(u_RotateAux, false, g_transforms[i][2]);
      gl.uniformMatrix4fv(u_RotateXMatrix, false, g_transforms[i][3]);
      gl.uniformMatrix4fv(u_RotateYMatrix, false, g_transforms[i][4]);
      gl.uniformMatrix4fv(u_RotateZMatrix, false, g_transforms[i][5]);
      gl.uniformMatrix4fv(u_RotateAux2, false, g_transforms[i][6]);

      var vertices = new Float32Array(g_points[i]);
      var vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      var colors = new Float32Array(g_colors[i]);
      var colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

      var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Color);

      var n = g_points[i].length/3;

      gl.drawArrays(gl.POINTS, 0, n);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }
}

function updateObjColor(value){
  console.log(value);
  var baseNumber = parseInt(value, 16);
  var r = (baseNumber >> 16) & 255;
  var g = (baseNumber >> 8) & 255;
  var b = baseNumber & 255;
  currObjectColor = [r, g, b];
  console.log(r + "," + g + "," + b);
}

function dotMatrix(A, B) {
  var result = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
		var dim = 2;
		for (var r = 0; r < dim + 1; r++) {
			for (var c = 0; c < dim + 1; c++) {
				for (var k = 0; k < dim + 1; k++) {
					result[r][c] += A[r][k] * B[k][c];
				}
			}
		}
  return result;
}

function configureModifyModeTransforms(x, y, z){
  var newVertex = {x: x, y: y, z: z};

  newVertex.x = newVertex.x - g_transforms[currObject][0][12];
  newVertex.y = newVertex.y - g_transforms[currObject][0][13];
  newVertex.z = newVertex.z - g_transforms[currObject][0][14];

  newVertex.x = newVertex.x + g_transforms[currObject][2][12];
  newVertex.y = newVertex.y + g_transforms[currObject][2][13];
  newVertex.z = newVertex.z + g_transforms[currObject][2][14];

  newVertex.x = newVertex.x * 1.0/g_transforms[currObject][1][0];
  newVertex.y = newVertex.y * 1.0/g_transforms[currObject][1][5];
  newVertex.z = newVertex.z * 1.0/g_transforms[currObject][1][10];

  var xProv = newVertex.x; var yProv = newVertex.y; var zProv = newVertex.z;
  newVertex.x = xProv*Math.cos(-1*angleZ*(3.1416/180.0)) - yProv*Math.sin(-1*angleZ*(3.1416/180.0));
  newVertex.y = xProv*Math.sin(-1*angleZ*(3.1416/180.0)) + yProv*Math.cos(-1*angleZ*(3.1416/180.0));

  xProv = newVertex.x; zProv = newVertex.z; yProv = newVertex.y;
  newVertex.x = xProv*Math.cos(-1*angleY*(3.1416/180.0)) + zProv*Math.sin(-1*angleY*(3.1416/180.0));
  newVertex.z = -xProv*Math.sin(-1*angleY*(3.1416/180.0)) + zProv*Math.cos(-1*angleY*(3.1416/180.0));

  xProv = newVertex.x; zProv = newVertex.z; yProv = newVertex.y;
  newVertex.y = yProv*Math.cos(-1*angleX*(3.1416/180.0)) - zProv*Math.sin(-1*angleX*(3.1416/180.0));
  newVertex.z = yProv*Math.sin(-1*angleX*(3.1416/180.0)) + zProv*Math.cos(-1*angleX*(3.1416/180.0));

  newVertex.x = newVertex.x + g_transforms[currObject][6][12];
  newVertex.y = newVertex.y + g_transforms[currObject][6][13];
  newVertex.z = newVertex.z + g_transforms[currObject][6][14];
  return newVertex;

}

function click(ev, gl, canvas) {
  var x = ev.clientX;
  var y = ev.clientY;
  console.log(zPos);
  var z = parseFloat(zPos);
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);


  if(mode == "modify"){
    var modVertex = configureModifyModeTransforms(x, y, z);
    x = modVertex.x;
    y = modVertex.y;
    z = modVertex.z;
  }

  g_points[currObject].push(x);
  g_points[currObject].push(y);
  g_points[currObject].push(z);

  g_colors[currObject].push(Math.random());
  g_colors[currObject].push(Math.random());
  g_colors[currObject].push(Math.random());

  paint();
}
