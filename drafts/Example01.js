var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'uniform mat4 u_TransformMatrix;\n' +
'void main() {\n' +
' gl_Position = u_TransformMatrix * a_Position;\n'+
'}\n';

var FSHADER_SOURCE =
'precision mediump float;\n' +
'uniform vec4 u_FragColor;\n' +
'void main(){\n'+
' gl_FragColor = u_FragColor;\n'+
'}\n';

var canvas = document.getElementById('webgl');
var gl = getWebGLContext(canvas);

function main(){

  if(!gl){ console.log('Failed to get the WebGL context'); return; }
  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){ console.log('Failed to initialize shaders'); return; }

  paint();
}

var g_points = [];
inputRotX = 0.0;

function setRotationX(){
  inputRotX += 15.0;
  console.log(inputRotX);
  paint();
}

function paint() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var tX = 0.0;
  var tY = 0.0;
  var tZ = 0.0;

  g_points = [0.0,0.0,0.0,  -0.8,0.0,0.0, -0.8,-0.8,0.0, 0.8, 0.8,0.0];

  var vertices = new Float32Array(g_points);
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0){ console.log('Failed to get location of a_Position'); return; }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  //var angle = 45.0;
  var angle = inputRotX;
  var radian = angle * Math.PI / 180.0;
  var cosB = Math.cos(radian);
  var sinB = Math.sin(radian);

  var transformMatrix = new Float32Array([
    cosB, -sinB, 0.0, 0.0,
    sinB, cosB, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  ]);

  var u_TransformMatrix = gl.getUniformLocation(gl.program, 'u_TransformMatrix');
  if(!u_TransformMatrix){ console.log('Failed to get location of u_TransformMatrix'); return;  }
  gl.uniformMatrix4fv(u_TransformMatrix, false, transformMatrix);

  /*var a_Translate = gl.getAttribLocation(gl.program, 'a_Translate');
  if(a_Translate < 0){ console.log('Failed to get location of a_Translate'); return; }
  gl.vertexAttrib3f(a_Translate, tX, tY, 0.0);*/

  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if(!u_FragColor){ console.log('Failed to get location of u_FragColor'); return;  }
  gl.uniform4f(u_FragColor, 0.2, 0.7, 0.4, 1.0);

  var n = g_points.length/3;
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}
