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
  const centerRadiusPositionY = length + angle / 0.2;
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
    color: 0x00ffff,
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
  const flyPoints = flyCurve.getPoints(24);
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
    flyPercents.push(i / flyPoints.length + 0.6);
    // 0 - 1 : 0 - 255
    flyColors.push(0x00, 0xff, 0xff, i / flyPoints.length);
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

function calculateCircleCenterAndRadius(p1, p2, p3) {
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
    map: texture,
    // color: 0x005959,
  });
  const sphere = new THREE.Mesh(geometry, material);

  // 表面线条
  new THREE.FileLoader().load('./assets/world.json', (data) => {
    const json = JSON.parse(data);

    // console.log('json.features', );
    const featurePoints = json.features.reduce((pv, feature) => {
      const geometry = feature.geometry;
      let coordinates = [];
      if (geometry.type === 'Polygon') {
        // - 
        coordinates = [geometry.coordinates];
      } else if (geometry.type === 'MultiPolygon') {
        // -
        coordinates = geometry.coordinates;
      }
      const rootPoints = coordinates.reduce((rootPv, polygons) => {
        const points = polygons.reduce((pv, polygon) => {
          const points = polygon.reduce((pv, point) => {
            // // 经纬度转2d坐标
            const [x, y] = point;
            const v3 = latLonToVector3(x, y, coreRadius);
            const list = [pv[pv.length - 1], v3];
            if (pv.length <= 1) {
              list.shift();
            }
            return pv.concat(list);
          }, []);
          // points.push(points[0]);
          return pv.concat(points);
        }, []);

        return rootPv.concat(points);
      }, []);
      return pv.concat(rootPoints);
    }, []);


    const lineGeometry = new THREE.BufferGeometry().setFromPoints(featurePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x81f2e1, linewidth: 1 });
    const line = new THREE.LineSegments(lineGeometry, lineMaterial);

    sphere.add(line);
  });

  // 球体光晕
  const glowGeometry = new THREE.SphereGeometry(coreRadius + 1, 64, 64);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x81f2e1,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.2,
  });
  const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
  sphere.add(glowSphere);


  return sphere;
}

// 经纬度转换为3D坐标
function latLonToVector3(longitude, latitude, R) {
  // 将经纬度转换为弧度
  let lon = (longitude * Math.PI) / 180; //转弧度值
  let lat = (latitude * Math.PI) / 180; //转弧度值
  lon = -lon; // three.js坐标系z坐标轴对应经度-90度，而不是90度

  // 经纬度坐标转球面坐标计算公式
  const x = R * Math.cos(lat) * Math.cos(lon);
  const y = R * Math.sin(lat);
  const z = R * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

const getBackground = (redis) => {
  // 加载材质
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(
    './assets/bg.png'
  );
  // 创建精灵
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(redis * 3, redis * 3, 0);

  return sprite;

}

const getShowPoint = (position, size = 0.5) => {
  const gapSize = size * 0.2;

  const group = new THREE.Group();
  group.position.copy(position);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize());

  // 创建外环
  const outRingGeometry = new THREE.RingGeometry(size - gapSize, size, 20);
  const outRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x81f2e1,
    side: THREE.DoubleSide,
  });
  const outRing = new THREE.Mesh(outRingGeometry, outRingMaterial);
  // 旋转角度
  outRing.rotation.x = Math.PI / 2;
  group.add(outRing);
  // 内圆面
  const innerCircleGeometry = new THREE.CircleGeometry(size - gapSize * 2, 20);
  const innerCircleMaterial = new THREE.MeshBasicMaterial({
    color: 0x81f2e1,
    side: THREE.DoubleSide,
  });
  const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
  innerCircle.rotation.x = Math.PI / 2;
  group.add(innerCircle);

  const rippleRingList = [];
  for (let i = 0; i < 3; i++) {
    // 涟漪
    const rippleRingGeometry = new THREE.RingGeometry(size + (gapSize * i) , size + gapSize * i * 1.4, 20);
    const rippleRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x81f2e1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const rippleRing = new THREE.Mesh(rippleRingGeometry, rippleRingMaterial);
    rippleRing.rotation.x = Math.PI / 2;

    rippleRingList.push(rippleRing);
  }

  // 旋转角度
  group.add(...rippleRingList);

  new TWEEN.Tween({
    scale: 1,
    opacity: 0.8,
  }).to({
    scale: 2,
    opacity: 0,
  })
    .onUpdate((obj) => {
      rippleRingList.forEach((rippleRing, index) => {
        rippleRing.scale.setScalar(obj.scale - index * 0.1);
        rippleRing.material.opacity = obj.opacity - index * 0.1;
      });
    })
    .delay(100)
    .duration(1000)
    .repeat(Infinity)
    .start();

  return group;
}

const getShowPointByLonLat = (lon, lat, r, size = 0.5) => {
  const position = latLonToVector3(lon, lat, r);
  return getShowPoint(position, size);
}

/**
 * @param {THREE.Scene} scene
 */
export default (scene) => {

  const earthSize = 100;

  // 背景
  const bg = getBackground(earthSize);
  scene.add(bg);

  const earth = getEarth(earthSize);
  // earth.rotation.y = Math.PI / 180 * 165;
  // earth.rotation.x = Math.PI / 180 * 25;

  scene.add(earth);
  // 当前经纬度
  const currentLon = 119;
  const currentLat = 29;

  const cPoint = getShowPointByLonLat(currentLon, currentLat, earthSize, 1);
  scene.add(cPoint);

  for (let i = 0; i < 20; i++) {
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

    const p1 = getShowPoint(randomPoint1);
    const p2 = getShowPoint(randomPoint2);


    scene.add(p1);
    scene.add(p2);

    // 两点长度
    const distance = p1.position.distanceTo(p2.position);
    // 核心
    const arcInfo = genArcInfo(p1.position, p2.position);
    const arcMesh = getArcMesh(arcInfo);
    const flyEllipse = getFlyLineMesh(arcInfo);

    scene.add(flyEllipse);
    scene.add(arcMesh);


    // -
    // console.log('distance', );

    // TWEEN start=originQuaternion end=qqq  loop
    const tween = new TWEEN.Tween(flyEllipse.rotation)
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

};
