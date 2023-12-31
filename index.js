
import * as THREE from 'three';
import TWEEN from "three/addons/libs/tween.module.js";

import Stats from './three.js-r154/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import test from './test.js';

console.log('THREE', THREE)

var container = document.getElementById('container');

var renderer, scene, camera, stats;
var mesh;
// var raycaster;
var line;

var intersection = {
  intersects: false,
  point: new THREE.Vector3(),
  normal: new THREE.Vector3()
};
var mouse = new THREE.Vector2();
var intersects = [];

// var textureLoader = new THREE.TextureLoader();
// var decalDiffuse = textureLoader.load('./threejs/examples/textures/decal/decal-diffuse.png');
// var decalNormal = textureLoader.load('./threejs/examples/textures/decal/decal-normal.jpg');

// var decalMaterial = new THREE.MeshPhongMaterial({
//   specular: 0x444444,
//   map: decalDiffuse,
//   normalMap: decalNormal,
//   normalScale: new THREE.Vector2(1, 1),
//   shininess: 30,
//   transparent: true,
//   depthTest: true,
//   depthWrite: false,
//   polygonOffset: true,
//   polygonOffsetFactor: - 4,
//   wireframe: false
// });

var decals = [];
var mouseHelper;
var position = new THREE.Vector3();
var orientation = new THREE.Euler();
var size = new THREE.Vector3(10, 10, 10);

var params = {
  download: function () {
    // -
    const canvas = renderer.domElement;
    const dataURL = canvas.toDataURL('image/png');

    const downloadLink = document.createElement('a');

    downloadLink.href = dataURL;
    downloadLink.download = 'world.png';

  }
};

window.addEventListener('load', init);

function init () {

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.z = -280;
  camera.position.x = -90;
  camera.position.y = 140;
  // 45度

  camera.target = new THREE.Vector3();

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 10000;

  scene.add(new THREE.AmbientLight(0x443333));


  var light = new THREE.DirectionalLight(0x88ffff, 0.5);
  light.position.set(-70, 140, -120);
  light.lookAt(new THREE.Vector3());
  light.add(new THREE.AxesHelper(10));
  // const helper = new THREE.DirectionalLightHelper( light, 5 );
  // scene.add( helper );
  scene.add(light);


  // var geometry = new THREE.BufferGeometry();
  // geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

  // line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
  // scene.add(line);

  // raycaster = new THREE.Raycaster();

  // mouseHelper = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
  // mouseHelper.visible = false;
  // scene.add(mouseHelper);


  var gui = new GUI();

  // gui.add( params, 'minScale', 1, 30 );
  // gui.add( params, 'maxScale', 1, 30 );
  // gui.add(params, 'rotate');
  gui.add(params, 'download');
  gui.open();

  // 位置
  // scene.add(new THREE.AxesHelper(200));

  // add 地面
  var groundGeometry = new THREE.PlaneGeometry(1000, 1000, 30, 30);
  var groundMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, wireframe: true });
  var ground = new THREE.Mesh(groundGeometry, groundMaterial);

  // ground.rotation.x = - Math.PI / 2;
  // scene.add(ground);

  test(scene);


  window.addEventListener('resize', onWindowResize, false);

  onWindowResize();
  animate();

}

function onWindowResize () {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate () {

  requestAnimationFrame(animate);

  renderer.render(scene, camera);

  stats.update();

  TWEEN.update();

}