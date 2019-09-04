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
  // initializing transform map and onclick function
  initTransforms();
  canvas.onclick = function(ev){ click(ev, gl, canvas); };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // gl enables depth coordinates (x, y, z) representation
  gl.enable(gl.DEPTH_TEST);
}

// maps for positions, colors and transformations data
var g_points = [[]];
var g_colors = [[]];
var g_transforms = [[]];

// global variables
var index = 0;
var currObject = 0;
var zPos = 0.0;

var angleX = 0.0;
var angleY = 0.0;
var angleZ = 0.0;
var mode = "normal";

// a json object that contains indices: which index stores which matrix data inside transforms array
const map = {
  TRANSLATE: 0,
  SCALE: 1,
  CENTER: 2,
  DECENTER: 3,
  ANGLES: 4,
  STATE: 5,
  MODE: 6,
  MODELING_MODE: 7
}

// function that selects an object and shows its information on the right sidebar
function selectObject(event){
  currObject = parseInt(event.target.value);
  $("#current-object-field").text("Current object: Object " + (currObject + 1));
  $("#object-title").text("Object " + (currObject + 1));

  // inserting current object's last info when it is selected so that history is saved
  $("#x-translate").val(g_transforms[currObject][map.TRANSLATE][0]);
  $("#y-translate").val(g_transforms[currObject][map.TRANSLATE][1]);
  $("#z-translate").val(g_transforms[currObject][map.TRANSLATE][2]);

  $("#x-scale").val(g_transforms[currObject][map.SCALE][0]);
  $("#y-scale").val(g_transforms[currObject][map.SCALE][1]);
  $("#z-scale").val(g_transforms[currObject][map.SCALE][2]);

  $("#x-rotate").val(g_transforms[currObject][map.ANGLES][0]);
  $("#y-rotate").val(g_transforms[currObject][map.ANGLES][1]);
  $("#z-rotate").val(g_transforms[currObject][map.ANGLES][2]);
}

// function that creates a new object ready: initializes its transforms and sets its info to default
function newObject(event){
  index += 1;
  g_points.push([]);
  g_colors.push([]);

  // pushing empty arrays that will store matrix data
  g_transforms.push([]);
  for(var i = 0; i < 5; i++){
    g_transforms[index].push([0.0, 0.0, 0.0]);
  }

  // additional object info after its matrix data
  g_transforms[index].push(["active"]);
  g_transforms[index].push(["normal"]);
  g_transforms[index].push(["FAN"]);

  // setting scale separately because must be 1 instead of usual 0
  g_transforms[index][map.SCALE] = [1.0, 1.0, 1.0];
  currObject = index;

  // appends a button in sidebar so that object can be selected
  $("#current-object-field").text("Current object: Object " + (currObject + 1));
  $("#object-title").text("Object " + (currObject + 1));
  $("#sidebar").append('<button class = "object-button" onclick = "selectObject(event); " value = ' + (index) + ' id = "' + (index) +'">Object ' + (index + 1) + '</button>');

  // range bars in zero here because is a new object
  $("#x-translate").val(0.0);
  $("#y-translate").val(0.0);
  $("#z-translate").val(0.0);

  $("#x-scale").val(1.0);
  $("#y-scale").val(1.0);
  $("#z-scale").val(1.0);

  $("#x-rotate").val(0.0);
  $("#y-rotate").val(0.0);
  $("#z-rotate").val(0.0);

}

// updates z depth input textfield
function updateTextInput(val) {
  zPos = parseFloat(val);
  document.getElementById('textInput').value = val;
}

// calculates an object's centroid: an average of all its vertices positions
// returns a json object
function centroid(obj){
  var sum = {
            x: 0.0,
            y: 0.0,
            z: 0.0 };

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

// initializes matrix data and additional object info in the map
function initTransforms(){

  g_transforms.push([]);
  for(var i = 0; i < 5; i++){
    g_transforms[0].push([0.0, 0.0, 0.0]);
  }
  g_transforms[0].push(["active"]);
  g_transforms[0].push(["normal"]);
  g_transforms[0].push(["FAN"]);
  g_transforms[0][map.SCALE] = [1.0, 1.0, 1.0];
}

// updates translate range bar and sends the value to the array
function updateTranslate(value, id){
  if(id == "x-translate"){
    g_transforms[currObject][map.TRANSLATE][0] = value;
  }
  if(id == "y-translate"){
    g_transforms[currObject][map.TRANSLATE][1] = value;
  }
  if(id == "z-translate"){
    g_transforms[currObject][map.TRANSLATE][2] = value;
  }
  g_transforms[currObject][map.MODE][0] = "modify";
  $("#mode").text(g_transforms[currObject][map.MODE][0]);
  paint();
}

// uses centroid information to build x, y, z coords for centering the object
function initCentroid(){
  // data corresponding to center translation matrix
  g_transforms[currObject][map.CENTER][0] = -1*centroid(currObject).x;
  g_transforms[currObject][map.CENTER][1] = -1*centroid(currObject).y;
  g_transforms[currObject][map.CENTER][2] = -1*centroid(currObject).z;

  // data corresponding to decenter translation matrix
  g_transforms[currObject][map.DECENTER][0] = centroid(currObject).x;
  g_transforms[currObject][map.DECENTER][1] = centroid(currObject).y;
  g_transforms[currObject][map.DECENTER][2] = centroid(currObject).z;
}

// updates scale range bar information
function updateScale(value, id){
  // before scaling, you need to center the object
  initCentroid();

  if(id == "x-scale"){
    g_transforms[currObject][map.SCALE][0] = value;
  }
  if(id == "y-scale"){
    g_transforms[currObject][map.SCALE][1] = value;
  }
  if(id == "z-scale"){
    g_transforms[currObject][map.SCALE][2] = value;
  }
  g_transforms[currObject][map.MODE][0] = "modify";
  $("#mode").text(g_transforms[currObject][map.MODE][0]);
  paint();
}

// updates rotate range bar information
function updateRotate(value, id){
  // before rotating, you need to center the object
  initCentroid();

  if(id == "x-rotate"){
    angleX = value;
    g_transforms[currObject][map.ANGLES][0] = value;
  }
  if(id == "y-rotate"){
    angleY = value;
    g_transforms[currObject][map.ANGLES][1] = value;

  }
  if(id == "z-rotate"){
    angleZ = value;
    g_transforms[currObject][map.ANGLES][2] = value;
  }
  g_transforms[currObject][map.MODE][0] = "modify";
  $("#mode").text(g_transforms[currObject][map.MODE][0]);
  paint();
}

// erases object: sets its state to inactive
function eraseObject(){
  g_transforms[currObject][map.STATE][0] = "inactive";
  $("#" + currObject).remove();
  $("#current-object-field").text("Current object: No Object");
  $("#object-title").text("No Object");
  paint();
}

// calculates the cross product of all the transformations in order
// returns the final Matrix4
function getTotalModelMatrix(index){
  var modelMatrix = new Matrix4();

  modelMatrix.translate(g_transforms[index][map.TRANSLATE][0], g_transforms[index][map.TRANSLATE][1], g_transforms[index][map.TRANSLATE][2]);
  modelMatrix.translate(g_transforms[index][map.DECENTER][0], g_transforms[index][map.DECENTER][1], g_transforms[index][map.DECENTER][2]);
  modelMatrix.scale(g_transforms[index][map.SCALE][0], g_transforms[index][map.SCALE][1], g_transforms[index][map.SCALE][2]);
  modelMatrix.rotate(g_transforms[index][map.ANGLES][2], 0, 0, 1);
  modelMatrix.rotate(g_transforms[index][map.ANGLES][1], 0, 1, 0);
  modelMatrix.rotate(g_transforms[index][map.ANGLES][0], 1, 0, 0);
  modelMatrix.translate(g_transforms[index][map.CENTER][0], g_transforms[index][map.CENTER][1], g_transforms[index][map.CENTER][2]);

  return modelMatrix;
}

// renders all objects: sends the transformations and points to the vertex shader
function paint(){
  gl.clear(gl.COLOR_BUFFER_BIT);

    for(var i = 0; i < g_points.length; i++){

      if(g_transforms[i][map.STATE][0] == "inactive"){
        continue;
      }

      // applies all transforms of indexed object
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

      // draw points so that they look like a model
      gl.drawArrays(gl.POINTS, 0, n);

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

// once you apply a transformation to an object, you need to neutralize previous transforms in order to keep modeling
// returns a json object
function reciprocalTransformsToAdd(x, y, z){
  var newVertex = {
                  x: x,
                  y: y,
                  z: z };

  // apply reciprocal transforms to previous data in reverse order
  // translate
  newVertex.x -= g_transforms[currObject][map.TRANSLATE][0];
  newVertex.y -= g_transforms[currObject][map.TRANSLATE][1];
  newVertex.z -= g_transforms[currObject][map.TRANSLATE][2];

  // center: still positive because this is an auxiliar translation
  newVertex.x += g_transforms[currObject][map.CENTER][0];
  newVertex.y += g_transforms[currObject][map.CENTER][1];
  newVertex.z += g_transforms[currObject][map.CENTER][2];

  // scale
  newVertex.x *= 1.0/g_transforms[currObject][map.SCALE][0];
  newVertex.y *= 1.0/g_transforms[currObject][map.SCALE][1];
  newVertex.z *= 1.0/g_transforms[currObject][map.SCALE][2];

  // rotate
  var xProv = newVertex.x;
  var yProv = newVertex.y;
  var zProv = newVertex.z;
  newVertex.x = xProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0)) - yProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0));
  newVertex.y = xProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0)) + yProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][2]*(3.1416/180.0));

  // apply the transforms with same value at the beginning, thats why the value is stored before operations
  xProv = newVertex.x;
  zProv = newVertex.z;
  yProv = newVertex.y;
  newVertex.x = xProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0)) + zProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0));
  newVertex.z = -xProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0)) + zProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][1]*(3.1416/180.0));

  xProv = newVertex.x;
  zProv = newVertex.z;
  yProv = newVertex.y;
  newVertex.y = yProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0)) - zProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0));
  newVertex.z = yProv*Math.sin(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0)) + zProv*Math.cos(-1*g_transforms[currObject][map.ANGLES][0]*(3.1416/180.0));

  // decenter
  newVertex.x += g_transforms[currObject][map.DECENTER][0];
  newVertex.y += g_transforms[currObject][map.DECENTER][1];
  newVertex.z += g_transforms[currObject][map.DECENTER][2];

  return newVertex;
}

// handles click to store vertex position
function click(ev, gl, canvas) {
  var x = ev.clientX;
  var y = ev.clientY;

  var z = parseFloat(zPos);
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // if you transform and want to keep adding vertices, apply reverse transforms to new position
  if(g_transforms[currObject][map.MODE][0] == "modify"){
    var modVertex = reciprocalTransformsToAdd(x, y, z);
    x = modVertex.x;
    y = modVertex.y;
    z = modVertex.z;
  }

  g_points[currObject].push(x);
  g_points[currObject].push(y);
  g_points[currObject].push(z);

  // push random rgb values for each vertex color
  g_colors[currObject].push(Math.random());
  g_colors[currObject].push(Math.random());
  g_colors[currObject].push(Math.random());

  paint();
}
