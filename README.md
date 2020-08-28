# Affine Transformations with WebGL

This project consists of a simple 3D modeling software. Each click creates a vertex and whenever you have a new set of 3 vertices, a triangle face is created.

<br />You can translate, scale, and rotate each of the models and add new ones. You can model, then make any transformation, and continue modeling afterwards as much as you want.

<br />All these transformations are done using the mathematical concept of Affine Transformations, where all the changes are computed using transformation matrices (and their inverse matrix). I had tons of fun while doing this project.

## Usage

Download this folder and store it in your computer.<br />
Double click on the file `Example01.html` in order to open the software in your default browser.<br />
Inside the file `Example01.html`, on line 99, you can change the source code between `app4.js`, `app3.js`, `app2.js` or `app.js`.<br />
The main and final alternative code is `app3.js`, but the other three codes do the same thing in a much more explicit and interesting way. `app4.js` is a program that can undo the previous transformations in order to continue modeling after changes by using the built-in inverse function for javascript, while the other codes do this explicitly. 

## Example
The program looks something like this:<br />

![alt text](https://github.com/the-other-mariana/affine-transformations-webgl/blob/master/screenshots/screen01.png?raw=true) <br />

A demo of how the software works is shown below. I learned so much during this project, it made me so happy. <br />

![alt text](https://github.com/the-other-mariana/affine-transformations-webgl/blob/master/screenshots/demo-gif.gif) <br />