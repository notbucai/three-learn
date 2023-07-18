import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

const createPoint = (r, color) => {
  const geometry = new THREE.SphereGeometry(r, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
};
// 生成弧线信息
const genArcInfo = (p1, p2) => {
  // 具体逻辑
  const startPosition = p1.clone();
  const endPosition = p2.clone();

  const xyo = new THREE.Vector3(0, 0, 1);
  const xoy = new THREE.Vector3(0, 1, 0);
  const origin = new THREE.Vector3(0, 0, 0);
  const length = startPosition.distanceTo(origin);
  const startSub = startPosition.clone().sub(origin);
  const endSub = endPosition.clone().sub(origin);

  const originCross = startSub
    .clone()
    .cross(endSub.clone().sub(origin))
    .normalize();

  const qxyo = new THREE.Quaternion().setFromUnitVectors(originCross, xyo);

  startPosition.applyQuaternion(qxyo);
  endPosition.applyQuaternion(qxyo);

  // 计算两点中点
  const centerPosition = startPosition
    .clone()
    .add(endPosition.clone())
    .divideScalar(2);
  // 法线
  const centerSub = centerPosition.sub(origin).normalize();
  const qxoy = new THREE.Quaternion().setFromUnitVectors(centerSub, xoy);

  startPosition.applyQuaternion(qxoy);
  endPosition.applyQuaternion(qxoy);

  // 计算角度
  const angle = startPosition.angleTo(endPosition);
  const centerRadiusPositionY = length + angle / 0.6;
  const centerRadiusPosition = new THREE.Vector3(0, centerRadiusPositionY, 0);

  // 计算圆心
  const circleCenterPositionInfo = calculateCircleCenterAndRadius(
    startPosition,
    endPosition,
    centerRadiusPosition
  );
  const circleRadius = circleCenterPositionInfo.r;
  const circleCenterPosition = new THREE.Vector3(
    circleCenterPositionInfo.x,
    circleCenterPositionInfo.y,
    circleCenterPositionInfo.z
  );

  // 计算点之间的角度 圆心circleCenterPosition, startPointPosition 与 rPointPosition 夹角
  const rPointPositionSub = circleCenterPosition
    .clone()
    .sub(centerRadiusPosition.clone())
    .normalize();
  const startPointPositionSub = circleCenterPosition
    .clone()
    .sub(startPosition.clone())
    .normalize();

  const rAngle = startPointPositionSub.angleTo(rPointPositionSub);

  const startAngle = Math.PI / 2 - rAngle;
  const endAngle = Math.PI - startAngle;

  const invertQuaternion = qxyo
    .clone()
    .invert()
    .multiply(qxoy.clone().invert());

  return {
    center: circleCenterPosition,
    radius: circleRadius,
    startAngle,
    endAngle,
    quaternion: invertQuaternion,
  };
};

// 获取弧线
const getArcMesh = (arcInfo) => {
  // 绘制弧线
  const curve = new THREE.ArcCurve(
    0,
    0, // ax, aY
    arcInfo.radius, // radius
    arcInfo.startAngle,
    arcInfo.endAngle, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );
  const points = curve.getPoints(30);
  const _geometry = new THREE.BufferGeometry().setFromPoints(points);
  const _material = new THREE.LineBasicMaterial({
    color: 0xffffff,
  });
  const ellipse = new THREE.Line(_geometry, _material);

  ellipse.position.copy(arcInfo.center);

  // 旋转
  ellipse.quaternion.multiply(arcInfo.quaternion);
  // 位置
  ellipse.position.applyQuaternion(arcInfo.quaternion);

  return ellipse;
};

// 获取非线
const getFlyLineMesh = (arcInfo) => {
  const lengthAngle = (Math.PI / 180) * 8;

  const flyCurve = new THREE.ArcCurve(
    0,
    0, // ax, aY
    arcInfo.radius, // radius
    arcInfo.startAngle - lengthAngle,
    arcInfo.startAngle, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );
  const flyPoints = flyCurve.getPoints(16);
  const flyGeometry = new THREE.BufferGeometry().setFromPoints(flyPoints);
  const flyMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const flyEllipse = new THREE.Points(flyGeometry, flyMaterial);
  flyEllipse.position.copy(arcInfo.center);
  flyEllipse.position.applyQuaternion(arcInfo.quaternion);
  flyEllipse.quaternion.multiply(arcInfo.quaternion);
  // 颜色 渐变
  const flyColors = [];
  const flyPercents = [];
  for (let i = 0; i < flyPoints.length; i++) {
    flyPercents.push(i / flyPoints.length);
    // 0 - 1 : 0 - 255
    flyColors.push(1, 1, 0, i / flyPoints.length);
  }
  flyGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(flyColors), 4)
  );
  flyGeometry.setAttribute(
    "percent",
    new THREE.BufferAttribute(new Float32Array(flyPercents), 1)
  );

  flyMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      "attribute float percent;\nvoid main() {"
    );

    shader.vertexShader = shader.vertexShader.replace(
      "gl_PointSize = size;",
      "gl_PointSize = size * percent;"
    );
  };

  return flyEllipse;
};

function calculateCircleCenterAndRadius (p1, p2, p3) {
  const L1 = p1.lengthSq(); //p1到坐标原点距离的平方
  const L2 = p2.lengthSq();
  const L3 = p3.lengthSq();
  const x1 = p1.x,
    y1 = p1.y,
    x2 = p2.x,
    y2 = p2.y,
    x3 = p3.x,
    y3 = p3.y;
  const S = x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2;
  const x = (L2 * y3 + L1 * y2 + L3 * y1 - L2 * y1 - L3 * y2 - L1 * y3) / S / 2;
  const y = (L3 * x2 + L2 * x1 + L1 * x3 - L1 * x2 - L2 * x3 - L3 * x1) / S / 2;
  // 三点外接圆圆心坐标
  const center = new THREE.Vector3(x, y, 0);
  const r = center.distanceTo(p2);

  return {
    x: center.x,
    y: center.y,
    z: center.z,
    r: r,
  };
}

const getEarth = (earthSize) => {
  const coreRadius = earthSize;

  // 地球贴图
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(
    './assets/world.png'
    // './assets/earth.jpg'
  );
  // 球
  const geometry = new THREE.SphereGeometry(coreRadius, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x888888,
    map: texture,
  });
  const sphere = new THREE.Mesh(geometry, material);

  return sphere;
}

// 经纬度转换为3D坐标
function latLonToVector3 (lat, lon, radius) {
  // 将经纬度转换为弧度
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;

  // 计算球面上的点的坐标
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * @param {THREE.Scene} scene
 */
export default (scene) => {

  const earthSize = 100;

  const earth = getEarth(earthSize);

  // earth.rotation.y = Math.PI / 180 * 165;
  // earth.rotation.x = Math.PI / 180 * 25;

  scene.add(earth);
  // 当前经纬度
  const currentLat = 30;
  const currentLon = 120;

  const locationPosition = latLonToVector3(currentLat, currentLon, earthSize)


  // 创建点
  const locationMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff0000,
    })
  );
  locationMesh.position.copy(locationPosition);

  scene.add(locationMesh);

  // 创建平面
  const sG = new THREE.CircleGeometry(1, 32);
  const sM = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
  });
  const s = new THREE.Mesh(sG, sM);
  s.position.copy(locationPosition);
  // s.position.z = 0;
  s.lookAt(0, 0, 0);
  scene.add(s);

  // 圆锥体
  const coneGeometry = new THREE.ConeGeometry(0.5, 5, 32);
  const coneMaterial = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
  });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.position.copy(locationPosition);
  // cone.lookAt(0, 0, 0);
  scene.add(cone);

  cone.add(new THREE.AxesHelper(5));

  // 
  // const sceneQ = new THREE.Quaternion().setFromUnitVectors( new THREE.Vector3(0, 0, 1), locationPosition.clone().normalize());
  // cone.applyQuaternion(sceneQ);
  // cone.position.applyQuaternion(sceneQ);
  cone.quaternion.setFromUnitVectors( new THREE.Vector3(0, 1, 0), locationPosition.clone().normalize());

  for (let i = 0; i < 100; i++) {
    const p1 = createPoint(0.3, 0x0000ff);
    const p2 = createPoint(0.3, 0xffff00);

    // 随机放在球面上 xyz
    // 随机一个向量
    const randomPoint1 = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    // 乘以半径
    randomPoint1.normalize().multiplyScalar(earthSize);
    p1.position.copy(randomPoint1);

    const randomPoint2 = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    // 乘以半径
    randomPoint2.normalize().multiplyScalar(earthSize);
    p2.position.copy(randomPoint2);

    scene.add(p1);
    scene.add(p2);

    // 核心
    const arcInfo = genArcInfo(p1.position, p2.position);
    const arcMesh = getArcMesh(arcInfo);
    const flyEllipse = getFlyLineMesh(arcInfo);

    scene.add(flyEllipse);
    scene.add(arcMesh);


    // -
    

    // TWEEN start=originQuaternion end=qqq  loop
    const tween = new TWEEN.Tween(flyEllipse.rotation)
      .to(
        {
          z: arcInfo.endAngle - arcInfo.startAngle + flyEllipse.rotation.z,
        },
        2000
      )
      .easing(TWEEN.Easing.Linear.None)
      .delay(100)
      .repeat(Infinity)
      .start();
  }

};