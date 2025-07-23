import * as THREE from 'three';
import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import mesh from './mesh';

export function init(dom) {
  const scene = new THREE.Scene();
  scene.add(mesh);
  // 场景添加坐标系
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);
  // 添加白色的平行光 模拟太阳
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);
  // 添加白色的环境光，提供基础照明
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  const width = 1000;
  const height = window.innerHeight - 80;

  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
  camera.position.set(500, 500, 500);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  dom.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);

  function changeHorseColor(color) {
    const horseBody = scene.getObjectByName('Cylinder');
    if(horseBody) {
      horseBody.material.color.set(color);
    }
  }

  return {
    scene,
    camera,
    renderer,
    changeHorseColor
  }
}