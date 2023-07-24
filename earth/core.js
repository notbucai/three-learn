import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { createEarth } from "./lib/earth.js";
import { calcArcInfo } from "./lib/utils.js";
import { getArcMesh, getFlyLineMesh } from "./lib/fly.js";
import { getShowPoint, getShowPointByLonLat } from "./lib/point.js";
// import { getBackground } from "./lib/decorate.js";

export default () => {
  const earthGroup = new THREE.Group();
  const earthSize = 100;

  const earth = createEarth(earthSize);
  // earth.rotation.y = Math.PI / 180 * 165;
  // earth.rotation.x = Math.PI / 180 * 25;

  earthGroup.add(earth);
  // 当前经纬度
  const currentLon = 119;
  const currentLat = 29;

  const cPoint = getShowPointByLonLat(currentLon, currentLat, earthSize, 10, 1);
  earthGroup.add(cPoint);

  for (let i = 0; i < 140; i++) {
    // 随机放在球面上 xyz
    // 随机一个向量
    const randomPoint1 = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    // 乘以半径
    randomPoint1.normalize().multiplyScalar(earthSize);

    const randomPoint2 = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    // 乘以半径
    randomPoint2.normalize().multiplyScalar(earthSize);

    const p1 = getShowPoint(randomPoint1, Math.random() * 100);
    const p2 = getShowPoint(cPoint.position.clone(), 0);

    earthGroup.add(p1);
    // earthGroup.add(p2);

    // 两点长度
    const distance = p1.position.distanceTo(p2.position);
    // 核心
    const arcInfo = calcArcInfo(p1.position, p2.position);
    const arcMesh = getArcMesh(arcInfo);
    const flyEllipse = getFlyLineMesh(arcInfo);

    earthGroup.add(flyEllipse);
    earthGroup.add(arcMesh);

    new TWEEN.Tween(flyEllipse.rotation)
      .to(
        {
          z: arcInfo.endAngle - arcInfo.startAngle + flyEllipse.rotation.z,
        },
        1000 * (distance / earthSize)
      )
      .easing(TWEEN.Easing.Linear.None)
      .delay(100)
      .repeat(Infinity)
      .start();
  }

  return earthGroup;
};
