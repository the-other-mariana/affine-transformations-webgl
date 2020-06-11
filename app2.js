var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_FragColor;\n' +

  'void main() {\n' +
  ' gl_Position = u_ModelMatrix * a_Position;\n'+
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
var g_transforms = [[]]
var clicks = {Value: 0};
var index = 0;
var currObject = 0;
var currObjectColor = [0, 0, 0];
var zPos = 0.0;

var angleX = 0.0;
var angleY = 0.0;
var angleZ = 0.0;
var mode = "normal";

const map = {
  TRANSLATE: 0,
  SCALE: 1,
  CENTER: 2,
  ROTATEX: 3,
  ROTATEY: 4,
  ROTATEZ: 5,
  DECENTER: 6,
  ANGLES: 7,
  STATE: 8,
  MODE: 9,
  MODELING_MODE: 10
}

function selectObject(event){
  currObject = parseInt(event.target.value);
  $("#current-object-field").text("Current object: Object " + (currObject + 1));
  $("#object-title").text("Object " + (currObject + 1));

  // inserting current object's last info
  $("#x-translate").val(g_transforms[currObject][map.TRANSLATE][12]);
  $("#y-translate").val(g_transforms[currObject][map.TRANSLATE][13]);
  $("#z-translate").val(g_transforms[currObject][map.TRANSLATE][14]);

  $("#x-scale").val(g_transforms[currObject][map.SCALE][0]);
  $("#y-scale").val(g_transforms[currObject][map.SCALE][5]);
  $("#z-scale").val(g_transforms[currObject][map.SCALE][10]);

  $("#x-rotate").val(g_transforms[currObject][map.ANGLES][0]);
  $("#y-rotate").val(g_transforms[currObject][map.ANGLES][1]);
  $("#z-rotate").val(g_transforms[currObject][map.ANGLES][2]);
}


// function that returns identity matrix
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
  index += 1;
  g_points.push([]);
  g_colors.push([]);

  g_transforms.push([])
  for(var i = 0; i < 7; i++){
    g_transforms[index].push(getNewTransformMatrix());
  }
  g_transforms[index].push([0, 0, 0]); // angles
  g_transforms[index].push(["active"]); // state
  g_transforms[index].push(["normal"]); // mode
  g_transforms[index].push(["FAN"]); // modeling mode
  currObject = index;
  $("#current-object-field").text("Current object: Object " + (currObject + 1));
  $("#object-title").text("Object " + (currObject + 1));
  $("#sidebar").append('<button class = "object-button" onclick = "selectObject(event); " value = ' + (index) + ' id = "' + (index) +'">Object ' + (index + 1) + '</button>');

  //range bars in zero here
  $("#x-translate").val(0.0);
  $("#y-translate").val(0.0);
  $("#z-translate").val(0.0);

  $("#x-scale").val(1.0);
  $("#y-scale").val(1.0);
  $("#z-scale").val(1.0);

  $("#x-rotate").val(0.0);
  $("#y-rotate").val(0.0);
  $("#z-rotate").val(0.0);
  console.log(mode);
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
  g_transforms[0].push(["normal"]);
  g_transforms[0].push(["FAN"]);
}

function updateTranslate(value, id){
  //mode = "modify";
  if(id == "x-translate"){
    g_transforms[currObject][map.TRANSLATE][12] = value;
  }
  if(id == "y-translate"){
    g_transforms[currObject][map.TRANSLATE][13] = value;
  }
  if(id == "z-translate"){
    g_transforms[currObject][map.TRANSLATE][14] = value;
  }
  g_transforms[currObject][map.MODE][0] = "modify";
  $("#mode").text(g_transforms[currObject][map.MODE][0]);
  paint();
}

function initCentroid(){
  g_transforms[currObject][map.CENTER][12] = -1*centroid(currObject).x;
  g_transforms[currObject][map.CENTER][13] = -1*centroid(currObject).y;
  g_transforms[currObject][map.CENTER][14] = -1*centroid(currObject).z;

  g_transforms[currObject][map.DECENTER][12] = centroid(currObject).x;
  g_transforms[currObject][map.DECENTER][13] = centroid(currObject).y;
  g_transforms[currObject][map.DECENTER][14] = centroid(currObject).z;
}

function updateScale(value, id){
  initCentroid();

  if(id == "x-scale"){
    g_transforms[currObject][map.SCALE][0] = value;
  }
  if(id == "y-scale"){
    g_transforms[currObject][map.SCALE][5] = value;
  }
  if(id == "z-scale"){
    g_transforms[currObject][map.SCALE][10] = value;
  }
  g_transforms[currObject][map.MODE][0] = "modify";
  $("#mode").text(g_transforms[currObject][map.MODE][0]);
  paint();
}
function updateRotate(value, id){
  var cosB = Math.cos(value*(3.1416 / 180.0));
  var sinB = Math.sin(value*(3.1416 / 180.0));

  initCentroid();

  if(id == "x-rotate"){
    angleX = value;
    g_transforms[currObject][map.ANGLES][0] = value;

    g_transforms[currObject][map.ROTATEX][5] = cosB;
    g_transforms[currObject][map.ROTATEX][6] = sinB;
    g_transforms[currObject][map.ROTATEX][9] = -1*sinB;
    g_transforms[currObject][map.ROTATEX][10] = cosB;
  }
  if(id == "y-rotate"){
    angleY = value;
    g_transforms[currObject][map.ANGLES][1] = value;

    g_transforms[currObject][map.ROTATEY][2] = -1*sinB;
    g_transforms[currObject][map.ROTATEY][8] = sinB;
    g_transforms[currObject][map.ROTATEY][0] = cosB;
    g_transforms[currObject][map.ROTATEY][10] = cosB;
  }
  if(id == "z-rotate"){
    angleZ = value;
    g_transforms[currObject][map.ANGLES][2] = value;

    g_transforms[currObject][map.ROTATEZ][0] = cosB;
    g_transforms[currObject][map.ROTATEZ][1] = sinB;
    g_transforms[currObject][map.ROTATEZ][4] = -1*sinB;
    g_transforms[currObject][map.ROTATEZ][5] = cosB;
  }
  g_transforms[currObject][map.MODE][0] = "modify";
  $("#mode").text(g_transforms[currObject][map.MODE][0]);
  paint();
}
function eraseObject(){
  g_transforms[currObject][map.STATE][0] = "inactive";
  $("#" + currObject).remove();
  $("#current-object-field").text("Current object: No Object");
  $("#object-title").text("No Object");
  paint();
}

function scalarMultip(k, array){
  var res = new Float32Array(array);
  for(var i = 0; i < array.length; i++){
    res[i] = k * array[i];
  }
  return res;
}

function getTotalModelMatrix(index){
  var modelMatrix = new Matrix4();
  var centerMtx = new Matrix4(); centerMtx.elements = g_transforms[index][map.CENTER];
  var rotXMtx = new Matrix4(); rotXMtx.elements = g_transforms[index][map.ROTATEX];
  var rotYMtx = new Matrix4(); rotYMtx.elements = g_transforms[index][map.ROTATEY];
  var rotZMtx = new Matrix4(); rotZMtx.elements = g_transforms[index][map.ROTATEZ];
  var scaleMtx = new Matrix4(); scaleMtx.elements = g_transforms[index][map.SCALE];
  var decenterMtx = new Matrix4(); decenterMtx.elements = g_transforms[index][map.DECENTER];
  var transMtx = new Matrix4(); transMtx.elements = g_transforms[index][map.TRANSLATE];

  modelMatrix = modelMatrix.multiply(transMtx).multiply(decenterMtx).multiply(scaleMtx).multiply(rotZMtx).multiply(rotYMtx).multiply(rotXMtx).multiply(centerMtx);

  return modelMatrix;
}

function paint(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  //gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    for(var i = 0; i < g_points.length; i++){

      if(g_transforms[i][map.STATE][0] == "inactive"){
        console.log("erase");
        continue;
      }
      var totalModelMatrix = getTotalModelMatrix(i);
      var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
      gl.uniformMatrix4fv(u_ModelMatrix, false, totalModelMatrix.elements);

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
      //gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
      if(g_transforms[i][map.MODELING_MODE][0] == "FAN"){
        gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
      }
      else {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
      }
    }
}

// updates the modeling mode to FAN or STRIP triangles
function updateModelingMode(value){
  g_transforms[currObject][map.MODELING_MODE][0] = value;
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

function undoTransforms(x, y, z){
  //var nv = {x: x, y: y, z: z};
  var nv = new Vector4();
  nv.elements = [x, y, z, 1.0];
  var test = new Matrix4();

  test.elements = scalarMultip(-1, g_transforms[currObject][0]);
  console.log(test);
  nv = test.multiplyVector4(nv);

  return nv;
}

function configureModifyModeTransforms(x, y, z){
  var newVertex = {x: x, y: y, z: z};

  newVertex.x -= g_transforms[currObject][map.TRANSLATE][12];
  newVertex.y -= g_transforms[currObject][map.TRANSLATE][13];
  newVertex.z -= g_transforms[currObject][map.TRANSLATE][14];

  newVertex.x += g_transforms[currObject][map.CENTER][12];
  newVertex.y += g_transforms[currObject][map.CENTER][13];
  newVertex.z += g_transforms[currObject][map.CENTER][14];

  newVertex.x *= 1.0/g_transforms[currObject][map.SCALE][0];
  newVertex.y *= 1.0/g_transforms[currObject][map.SCALE][5];
  newVertex.z *= 1.0/g_transforms[currObject][map.SCALE][10];

  var xProv = newVertex.x; var yProv = newVertex.y; var zProv = newVertex.z;
  newVertex.x = xProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0)) - yProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0));
  newVertex.y = xProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0)) + yProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0));

  xProv = newVertex.x; zProv = newVertex.z; yProv = newVertex.y;
  newVertex.x = xProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0)) + zProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0));
  newVertex.z = -xProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0)) + zProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0));

  xProv = newVertex.x; zProv = newVertex.z; yProv = newVertex.y;
  newVertex.y = yProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0)) - zProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0));
  newVertex.z = yProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0)) + zProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0));

  newVertex.x += g_transforms[currObject][map.DECENTER][12];
  newVertex.y += g_transforms[currObject][map.DECENTER][13];
  newVertex.z += g_transforms[currObject][map.DECENTER][14];
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


  if(g_transforms[currObject][map.MODE][0] == "modify"){

    var modVertex = configureModifyModeTransforms(x, y, z);
    x = modVertex.x;
    y = modVertex.y;
    z = modVertex.z;
    /*
    var nv = undoTransforms(x, y, z);
    x = nv.elements[0];
    y = nv.elements[1];
    z = nv.elements[2];*/
  }

  g_points[currObject].push(x);
  g_points[currObject].push(y);
  g_points[currObject].push(z);

  g_colors[currObject].push(Math.random());
  g_colors[currObject].push(Math.random());
  g_colors[currObject].push(Math.random());

  paint();
}
