import * as THREE from 'three';

export default (scene) => {

  // sphere
  const sphereGeometry = new THREE.SphereGeometry(20, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: .7
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(sphere);

  // cube1 size 2
  const cubeGeometry1 = new THREE.BoxGeometry(2, 2, 2);
  const cubeMaterial1 = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const cube1 = new THREE.Mesh(cubeGeometry1, cubeMaterial1);
  cube1.position.y = 20;
  // cube1.add(new THREE.AxesHelper(4));
  // group box 1
  const groupBox1 = new THREE.Group();
  groupBox1.add(cube1);
  // groupBox1.add(new THREE.AxesHelper(22))


  // cube2 size 2
  const cubeGeometry2 = new THREE.BoxGeometry(2, 2, 2);
  const cubeMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube2 = new THREE.Mesh(cubeGeometry2, cubeMaterial2);
  cube2.position.y = 20;
  // cube2.add(new THREE.AxesHelper(4));
  // group box 1
  const groupBox2 = new THREE.Group();
  groupBox2.add(cube2);
  // groupBox2.add(new THREE.AxesHelper(22));

  groupBox1.rotation.x = Math.PI / 180 * 30;
  groupBox1.rotation.y = Math.PI / 180 * 20;
  groupBox1.rotation.z = Math.PI / 180 * 90;
  // ArrowHelper
  // const dir = groupBox1.position.clone().normalize();
  // const origin = new THREE.Vector3(0, 0, 0);
  // const arrowHelper1 = new THREE.ArrowHelper(
  //   dir, origin,
  //   42,
  //   0x00ff00,
  // );
  // groupBox1.add(arrowHelper1);

  groupBox2.rotation.x = Math.PI / 180 * 11;
  groupBox2.rotation.y = Math.PI / 180 * 92;
  groupBox2.rotation.z = Math.PI / 180 * -80;
  // ArrowHelper
  // const dir2 = groupBox2.position.clone().normalize();
  // const origin2 = new THREE.Vector3(0, 0, 0);
  // const arrowHelper2 = new THREE.ArrowHelper(
  //   dir2, origin2,
  //   42,
  //   0x00ff00,
  // );
  // groupBox2.add(arrowHelper2);

  scene.add(groupBox1);
  scene.add(groupBox2);

  // 获取box世界坐标
  const worldPosition1 = new THREE.Vector3();
  const worldPosition2 = new THREE.Vector3();
  const worldDirection1 = new THREE.Vector3();
  const worldDirection2 = new THREE.Vector3();
  cube1.getWorldPosition(worldPosition1);
  cube2.getWorldPosition(worldPosition2);
  cube1.getWorldDirection(worldDirection1);
  cube2.getWorldDirection(worldDirection2);

  console.log('worldDirection1', worldDirection1)
  console.log('worldDirection2', worldDirection2)


  // 两点中点
  const center = new THREE.Vector3();
  center.addVectors(worldPosition1, worldPosition2);
  center.divideScalar(2);
  console.log('center', center)

  // dir 到 origin上取一个点
  const point = center.clone().crossVectors(worldPosition1, worldPosition2);
  console.log('point', point)

  const pointGeometry = new THREE.BufferGeometry().setFromPoints([
    // new THREE.Vector3(0, 0, 0)
    point,
    // center,
  ]);
  const pointMaterial = new THREE.PointsMaterial({
    color: 0x00ff00,
    size: 10
  });
  const pointMesh = new THREE.Points(pointGeometry, pointMaterial);
  scene.add(pointMesh);

  // 
  // console.log('worldPosition1', worldPosition1);
  // 计算center + worldPosition1
  const _point = worldPosition1.clone().sub(center.clone());

  const x = Math.acos(_point.clone().normalize().dot(worldPosition1.clone().normalize()));
  console.log('--------', THREE.MathUtils.radToDeg(x))

  // console.log('_point', _point);
  const _pointGeometry = new THREE.BufferGeometry().setFromPoints([
    _point
  ]);
  const _pointMaterial = new THREE.PointsMaterial({
    color: 0xff0000,
    size: 5,
  });
  const _pointMesh = new THREE.Points(_pointGeometry, _pointMaterial);
  scene.add(_pointMesh);

  const ca = worldDirection1.clone().sub(center.clone()).normalize().dot(new THREE.Vector3(0, -1, 0).sub(center.clone()).normalize())
  // console.log('THREE.MathUtils.radToDeg(Math.acos(ca))', THREE.MathUtils.radToDeg(Math.PI / 2 + Math.acos(ca))) 
  const startAngle = -Math.PI + x;
  const endAngle = startAngle + Math.PI;


  // 垂直于直线的点
  // const point = center.clone();
  // point.add(worldDirection2.clone());
  // point.add(worldDirection1.clone());
  // console.log('point', point)
  // // arrowHelper
  // const arrowHelperCenter2 = new THREE.ArrowHelper(
  //   point.clone().normalize(), new THREE.Vector3(0, 0, 0),
  //   42,
  //   0xff0000,
  // );
  // scene.add(arrowHelperCenter2); 


  // const arrowHelperCenter2 = new THREE.ArrowHelper(
  //   point.clone().normalize(), center.clone().normalize(),
  //   42,
  //   0xff0000,
  // );
  // scene.add(arrowHelperCenter2); 


  // 距离
  const distance = worldPosition1.distanceTo(worldPosition2);

  // 两点垂直线
  // const lineGeometry2 = new THREE.BufferGeometry().setFromPoints([
  //   worldPosition1,
  //   worldPosition1.clone().add(worldDirection2.clone().multiplyScalar(42)),
  // ]);
  // const lineMaterial2 = new THREE.LineBasicMaterial({
  //   color: 0x00ff00,
  //   linewidth: 4,
  // });
  // const line3 = new THREE.Line(lineGeometry2, lineMaterial2);
  // scene.add(line3);


  // 角度
  const angle = groupBox1.position.angleTo(groupBox2.position);


  console.log('distance', distance, center, angle * 180 / Math.PI)
  // 
  // 创建一个弧线，位置在两点中间，起点在box1 终点在box2

  // dir1、dir2：球面上两个点和球心构成的方向向量
  const dir1 = worldDirection1.clone().normalize();
  const dir2 = worldDirection2.clone().normalize();
  //点乘.dot()计算夹角余弦值
  const cosAngle = dir1.clone().dot(dir2);
  const a = Math.acos(cosAngle); //余弦值转夹角弧度值,通过余弦值可以计算夹角范围是0~180度
  console.log('a', a * 180 / Math.PI);

  const startDeg = Math.PI + cosAngle / 2; //飞线圆弧开始角度
  const endDeg = Math.PI - startDeg; //飞线圆弧结束角度

  console.log('startDeg', startDeg, endDeg);

  const curve = new THREE.ArcCurve(
    0, 0,
    distance / 2,
    startAngle, endAngle,
    false,
  );

  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xff0000
  });
  const curveLine = new THREE.Line(geometry, material);
  curveLine.add(new THREE.AxesHelper(32));

  curveLine.position.copy(center);
  // curveLine.lookAt(point);
  const cx1 = new THREE.Vector3().sub(curveLine.position.clone()).normalize();
  const originCx = new THREE.Vector3(0, 1, 0);

  const qxx = new THREE.Quaternion().setFromUnitVectors(originCx, cx1);

  const cx2 = center.clone().sub(worldPosition1.clone()).normalize();

  console.log('cx2',cx2);

  // qxx.setFromUnitVectors(qxx, cx2);

  curveLine.quaternion.copy(qxx);
  
  // 旋转
  scene.add(curveLine);

  // curveLine.rotation.z = -Math.PI / 2;

  // 按两点直线旋转90度
  // 用线条连接两点
  // const lineGeometry = new THREE.BufferGeometry().setFromPoints([
  //   worldPosition1,
  //   worldPosition2,
  // ]);
  // const lineMaterial = new THREE.LineBasicMaterial({
  //   color: 0xff00ff,
  //   linewidth: 4,
  // });
  // const line2 = new THREE.Line(lineGeometry, lineMaterial);
  // scene.add(line2);

  // line2.add(new THREE.AxesHelper(40));


  console.log('---->',
    worldPosition1.clone().sub(new THREE.Vector3(0, 0, 0)),
    worldPosition1
  );

  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3().crossVectors(worldDirection1, worldDirection2).normalize(),
    new THREE.Vector3(0, 0, 1)
  );
  console.log('q', q);

  const start_xoy = worldDirection1.clone().applyQuaternion(q);
  const end_xoy = worldDirection2.clone().applyQuaternion(q);
  const middle_xoy = new THREE.Vector3()
    .addVectors(start_xoy, end_xoy)
    .multiplyScalar(0.5)
    .normalize();
  const xoy_quaternion_middle = new THREE.Quaternion().setFromUnitVectors(
    middle_xoy,
    new THREE.Vector3(0, 1, 0)
  );
  const quaternionInverse = q
    .clone()
    .invert()
    .multiply(xoy_quaternion_middle.clone().invert());

  console.log('quaternionInverse', quaternionInverse);


  // curveLine.quaternion.multiply(quaternionInverse);




}