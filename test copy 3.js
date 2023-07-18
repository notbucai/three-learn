import * as THREE from "three";
import TWEEN from "three/addons/libs/tween.module.js";

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
  const startSub = startPosition
    .clone()
    .sub(origin);
  const endSub = endPosition
    .clone()
    .sub(origin);

  const originCross = startSub.clone()
    .cross(endSub.clone().sub(origin))
    .normalize();

  const qxyo = new THREE.Quaternion().setFromUnitVectors(originCross, xyo);

  startPosition.applyQuaternion(qxyo);
  endPosition.applyQuaternion(qxyo);

  // 计算两点中点
  const centerPosition = startPosition.clone().add(endPosition.clone()).divideScalar(2);
  // 法线
  const centerSub = centerPosition.sub(origin).normalize();
  const qxoy = new THREE.Quaternion().setFromUnitVectors(centerSub, xoy);

  startPosition.applyQuaternion(qxoy);
  endPosition.applyQuaternion(qxoy);

  // 计算角度
  const angle = startPosition.angleTo(endPosition);
  const centerRadiusPositionY = length + angle / 0.2;
  const centerRadiusPosition = new THREE.Vector3(0, centerRadiusPositionY, 0);

  // 计算圆心
  const circleCenterPositionInfo = calculateCircleCenterAndRadius(startPosition, endPosition, centerRadiusPosition);
  const circleRadius = circleCenterPositionInfo.r;
  const circleCenterPosition = new THREE.Vector3(circleCenterPositionInfo.x, circleCenterPositionInfo.y, circleCenterPositionInfo.z);

  // 计算点之间的角度 圆心circleCenterPosition, startPointPosition 与 rPointPosition 夹角
  const rPointPositionSub = circleCenterPosition.clone().sub(centerRadiusPosition.clone()).normalize();
  const startPointPositionSub = circleCenterPosition.clone().sub(startPosition.clone()).normalize();

  const rAngle = startPointPositionSub.angleTo(rPointPositionSub);

  const startAngle = Math.PI / 2 - rAngle;
  const endAngle = Math.PI - startAngle;

  const invertQuaternion = qxyo.clone().invert().multiply(qxoy.clone().invert());

  return {
    center: circleCenterPosition,
    radius: circleRadius,
    startAngle,
    endAngle,
    quaternion: invertQuaternion,
  }
}

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

/**
 * @param {THREE.Scene} scene
 */
export default (scene) => {
  const coreRadius = 30;
  // 球
  const geometry = new THREE.SphereGeometry(coreRadius, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
  });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  const length = coreRadius;

  const p1 = createPoint(1, 0xff0000);
  const p2 = createPoint(1, 0x00ff00);

  // 随机放在球面上 xyz
  // 随机一个向量
  const randomPoint1 = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );
  // 乘以半径
  randomPoint1.normalize().multiplyScalar(coreRadius);
  p1.position.copy(randomPoint1);

  const randomPoint2 = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );
  // 乘以半径
  randomPoint2.normalize().multiplyScalar(coreRadius);
  p2.position.copy(randomPoint2);


  const arcInfo = genArcInfo(p1.position, p2.position);

  // 绘制弧线
  const curve = new THREE.ArcCurve(
    0, 0, // ax, aY
    arcInfo.radius, // radius
    arcInfo.startAngle, arcInfo.endAngle, // aStartAngle, aEndAngle
    false, // aClockwise
    0, // aRotation
  );
  const points = curve.getPoints(50);
  const _geometry = new THREE.BufferGeometry().setFromPoints(points);
  const _material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const ellipse = new THREE.Line(_geometry, _material);

  ellipse.position.copy(arcInfo.center);

  ellipse.position.applyQuaternion(arcInfo.quaternion);
  // 旋转
  ellipse.quaternion.multiply(arcInfo.quaternion);

  scene.add(ellipse);
  scene.add(p1);
  scene.add(p2);
};
