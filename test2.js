import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// 经纬度转换为3D坐标

export default (scene) => {

  new THREE.FileLoader().load('./assets/world.json', (data) => {

    const json = JSON.parse(data);

    // console.log('json.features', );
    json.features.forEach(feature => {
      const geometry = feature.geometry;
      let coordinates = [];
      if (geometry.type === 'Polygon') {
        // - 
        coordinates = [geometry.coordinates];
      } else if (geometry.type === 'MultiPolygon') {
        // -
        coordinates = geometry.coordinates;
      }
      coordinates.forEach(polygons => {
        polygons.forEach(polygon => {
          const points = polygon.map(point => {
            // // 经纬度转2d坐标
            // const [x, y] = point;
            const [x, y] = point;
            // const [x, y] = point;
            return new THREE.Vector2(x, y);
          });
          const shape = new THREE.Shape(points);
          const geometry = new THREE.ShapeGeometry(shape);
          const material = new THREE.MeshBasicMaterial({ color: 0x000502 });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          // // 边界线
          // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

          // const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0096b0, });
          // const line = new THREE.Line(lineGeometry, lineMaterial);

          // scene.add(line);
        });
      });
    });


  });

  // 绘制平面
  const geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
  const material = new THREE.MeshBasicMaterial({ color: 0x000af4, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);
  // scene.add(plane);

}