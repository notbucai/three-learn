import * as THREE from 'three';

export default (scene) => {

  // box
  const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: .7,
    wireframe: true,
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // 获取所有点
  const points = boxGeometry.attributes.position;
  const normal = boxGeometry.attributes.normal;
  const count = points.count;
  for (let i = 0; i < count; i++) {
    const point = [points.getX(i), points.getY(i), points.getZ(i)];
    const pointNormal = [normal.getX(i), normal.getY(i), normal.getZ(i)];

    // arrow
    const dir = new THREE.Vector3(...pointNormal);
    const origin = new THREE.Vector3(...point);
    const arrowHelper = new THREE.ArrowHelper(
      dir, origin,
      10,
      [0x00ff00, 0xff0000, 0xff00ff][i % 3],
    );
    scene.add(arrowHelper);
  }

}