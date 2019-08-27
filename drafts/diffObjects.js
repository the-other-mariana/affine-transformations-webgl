var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_FragColor;\n' +
  'void main() {\n' +
  ' gl_Position = a_Position;\n'+
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

function main(){
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  if(!gl){
    console.log('Failed to get the WebGL context');
    return;
  }

  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
    console.log('Failed to initialize shaders');
    return;
  }

  canvas.onclick = function(ev){ click(ev, gl, canvas); };
  canvas.oncontextmenu  = function(ev){ rightClick(ev, gl, canvas);  return false;};
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_points = [[]];
var g_colors = [[]];
var clicks = {Value: 0};
var index = 0;

function rightClick(ev, gl, canvas) {
  index += 1;
  g_points.push([]);
  g_colors.push([]);
}

function click(ev, gl, canvas) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);


  if(g_points.length <= index){
    g_points.push([]);
    g_colors.push([]);
  }

  g_points[index].push(x);
  g_points[index].push(y);

  g_colors[index].push(Math.random());
  g_colors[index].push(Math.random());
  g_colors[index].push(Math.random());

  gl.clear(gl.COLOR_BUFFER_BIT);

    for(var i = 0; i < g_points.length; i++){

      var vertices = new Float32Array(g_points[i]);
      var vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      var colors = new Float32Array(g_colors[i]);
      var colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

      var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Color);

      var n = g_points[i].length/2;

      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }

}
