## React结合Threejs开发3D项目

### 创建项目
```bash
npx create-vite react-threejs-app

pnpm install
pnpm install --save three
pnpm install --save-dev @types/three

npm run dev
```

### 创建three初始文件 src/3d-init.js
让 Three.js 的 canvas 挂在左边这个 #content 的 div 下

```js
import * as THREE from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import mesh from './mesh.js';
// three场景初始化方法。 入参是挂载dom
export function init(dom) {
    const scene = new THREE.Scene();
    // 场景添加网格模型
    scene.add(mesh);
    // 场景添加
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);
    // 添加一个白色平行光（模拟太阳），并设置其位置。
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(500, 400, 300);
    scene.add(directionalLight);
    // 添加一个白色环境光，提供基础照明
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    // 设置相机
    const width = 1000;
    const height = window.innerHeight - 80;

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera.position.set(500, 500, 500);
    camera.lookAt(0, 0, 0);
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height)
    // 渲染循环
    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
    // 挂载渲染结果到页面
    dom.append(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    // 改变马身体颜色回调
    function changeHorseColor(color) {
      // 查找horse的躯体(子网格模型). horse遍历下有两个子网格。 下面是遍历方法
      const horseBody = scene.getObjectByName('Cylinder');
      // 遍历模型的子网格模型
      // gltf.scene.traverse(obj => {
      //   if(obj.isMesh) {
      //     console.log('mesh', obj) // horse模型有两个子网格
      //     if(obj.name === "Cylinder") { // horse的躯体
      //       obj.material.color = new THREE.Color('white');
      //     } else if(obj.name === "Cylinder_1") { // horse的鬓毛和蹄子
      //       obj.material.color = new THREE.Color('pink');
      //     }
      //   }
      // })

      if(horseBody) {
        horseBody.material.color.set(color);
      }
    }
    // 返回场景相关对象
    return {
        scene,
        camera,
        renderer,
        changeHorseColor
    }
}
```

### 创建mesh文件加载模型
```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// GLTFLoader 创建模型加载器
const loader = new GLTFLoader();
// 创建网格模型
const mesh = new THREE.Group();
// 加载3d模型
loader.load("./Horse.gltf", function(gltf) {
  // 网格模型添加马儿模型
  mesh.add(gltf.scene);
  // 马儿模型体积放大50倍
  gltf.scene.scale.set(50, 50, 50);
})

export default mesh;
```

### react项目加载threejs模型
```js
import { useEffect, useRef } from 'react'
import { init } from './3d-init';
import './App.css'

function App() {

  const changeHorseColorRef = useRef(() => {});

  useEffect(() => {
    const dom = document.getElementById('content');
    // 加载three 3D模型
    const { changeHorseColor } = init(dom);
    // 保存改变马颜色回调
    changeHorseColorRef.current = changeHorseColor;
    // 离开页面销毁 three实例
    return () => {
      dom.innerHTML = '';
    }
  }, [])

  return <div>
    <div id="header">
    React 和 Three.js 
    </div>
    <div id="main">
      <div id="content">
      </div>
      <div id="operate">
        <button onClick={() => {changeHorseColorRef.current('pink')}}>粉色</button>
        <button onClick={() => {changeHorseColorRef.current('green')}}>绿色</button>
        <button onClick={() => {changeHorseColorRef.current('blue')}}>蓝色</button>
      </div>
    </div>
  </div>
}

export default App
```

