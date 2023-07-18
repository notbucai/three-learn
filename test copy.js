import * as THREE from "three";
import TWEEN from 'three/addons/libs/tween.module.js';

const createPoint = (r, color) => {
  const geometry = new THREE.SphereGeometry(r, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
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
    r: r
  }
}

/**
 * @param {THREE.Scene} scene
 */
export default (scene) => {
  const coreRadius = 30;
  // 球
  const geometry = new THREE.SphereGeometry(coreRadius, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4 });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  const length = coreRadius;

  const groupList = [];

  const colors = [
    0xffff00,
    0xff00ff,
    0xf0ffa0,
    0x00fff0,
    0xff0000,
    0x0000ff,
  ];

  // 创建坐标
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * 15 * i;
    let x = length * Math.cos(angle);
    const y = length * Math.sin(angle);
    const group = [];
    for (let j = 0; j < 2; j++) {
      if (j == 1) {
        x = -x;
      }
      const p = createPoint(1, colors[i]);
      p.position.set(x, y, 0);
      scene.add(p);
      group.push(p);
    }
    groupList.push(group);
  }

  // 创建线
  for (let i = 0; i < groupList.length; i++) {
    const group = groupList[i];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(group.map(p => p.position)), new THREE.LineBasicMaterial({ color: 0xff0000 }));
    scene.add(line);
    // 获取两点的中心点
    const startPoint = group[0];
    const endPoint = group[1];
    const distance = startPoint.position.distanceTo(endPoint.position);
    const center = startPoint.position.clone().add(endPoint.position.clone()).divideScalar(2);
    const angle = startPoint.position.angleTo(endPoint.position);
    const centerPoint = createPoint(0.5, 0x0000f0);
    centerPoint.position.copy(center);
    scene.add(centerPoint);

    // console.log('angle', angle, THREE.MathUtils.radToDeg(angle));

    const yR = length + angle / 0.2;

    const color = colors[i];
    const rPoint = createPoint(0.5, 0xffffff);
    // rPoint
    rPoint.position.set(center.x, yR, center.z);
    scene.add(rPoint);

    // 3点确认一个圆心
    const startPointPosition = startPoint.position.clone();
    const endPointPosition = endPoint.position.clone();
    const rPointPosition = rPoint.position.clone();

    const circleCenter = new THREE.Vector3(0, 0, 0);
    // console.log('startPointPosition, endPointPosition, rPointPosition', startPointPosition, endPointPosition, rPointPosition);
    const centerPointInfo = calculateCircleCenterAndRadius(rPointPosition, endPointPosition, startPointPosition);

    circleCenter.set(centerPointInfo.x, centerPointInfo.y, centerPointInfo.z);
    const circleRadius = centerPointInfo.r;
    // 绘制点
    const circlePoint = createPoint(1, colors[i]);
    circlePoint.position.copy(circleCenter);

    scene.add(circlePoint);
    // 计算点之间的角度 圆心circleCenter, startPointPosition 与 rPointPosition 夹角
    // 计算
    const rPointPositionSub = circleCenter.clone().sub(rPointPosition.clone()).normalize();

    const startPointPositionSub = circleCenter.clone().sub(startPointPosition.clone()).normalize();
    const endPointPositionSub = circleCenter.clone().sub(endPointPosition.clone()).normalize();

    const angle1 = startPointPositionSub.angleTo(rPointPositionSub);

    const startAngle = Math.PI / 2 - angle1;
    const endAngle = Math.PI - startAngle;

    // 绘制弧线
    const curve = new THREE.ArcCurve(
      0, 0, // ax, aY
      circleRadius, // radius
      startAngle, endAngle, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: colors[i] });
    const ellipse = new THREE.Line(geometry, material);

    ellipse.position.copy(circleCenter);
    // ellipse.rotateX(Math.PI)
    scene.add(ellipse);


  }

}