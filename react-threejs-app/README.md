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

---

## react-three-fiber组件化开发3D项目

我们学了下 react-three-fiber，它是用组件的方式来写 3D 场景。

核心 api 在 @react-three/fiber 这个包，扩展的 api 比如 OrbitControls 在 @react-three/drei 这个包。

最外层根组件是 Canvas，其余的 light、mesh 等都用组件的方式写。

我们用了 useLoader、useThree、useFrame 这几个 hook：

useFrame：在每帧的渲染循环里执行一些逻辑，可以通过第一个参数 state 拿到上下文
useLoader： 加载 gltf 模型，结合 react 的 Suspense 组件实现异步加载
useThree：拿到 state 上下文，比如 size、camera 等。
而且 mesh 绑定点击事件等直接写 onClick 就行，内部都给封装好了。

用组件的方式来写 3D 场景，确实更符合 react 的开发习惯，有 three.js 和 react 基础，上手还是很快的。

> Three-fiber 是一个 React 渲染器，它必须与 React 的主版本配对，就像 react-dom、react-native 等一样。`@react-three/fiber@8 与 react@18 配对`，`@react-three/fiber@9 与 react@19 配对`。

### 搭建项目
```bash
npx create-vite hello-r3f

pnpm install
pnpm install --save three
pnpm install --save-dev @types/three
# @react-three/fiber@8 与 react@18 配对
pnpm install --save @react-three/fiber
pnpm install --save @react-three/drei
npm run dev
pnpm install --save gsap
```

### 搭建项目 app.jsx
- `useFrame`：在每帧的渲染循环里执行一些逻辑，可以通过第一个参数 state 拿到上下文
- `useLoader`： 加载 gltf 模型，结合 react 的 Suspense 组件实现异步加载
- `useThree`：拿到 state 上下文，比如 size、camera 等。

```jsx
import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useRef, Suspense } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

function Mesh() {
  const meshRef = useRef();
  // three 帧数渲染器hook 可以执行动画
  useFrame((state, delta) => {
    // mesh物体旋转
    meshRef.current.rotation.y += 0.01;
  });
  // mesh物体点击事件
  function clickHandler() {
    meshRef.current.material.color.set('blue');
    // meshRef.current.material.color.set(Math.random() * 0xffffff);
  }

  return <mesh ref={meshRef} onClick={clickHandler}>
    <boxGeometry args={[100, 100, 100]} />
    <meshPhongMaterial color="orange" />
  </mesh>
}

function Naruto() {

  useFrame((state, delta) => {
    // state.camera.position.x = Math.sin(state.clock.elapsedTime) * 500;
  });
  // 加载 gltf 模型，结合 react 的 Suspense 组件实现异步加载
  const gltf = useLoader(GLTFLoader, 'naruto.glb');
  console.log(gltf);
  // gltf模型放大200倍
  gltf.scene.scale.setScalar(200);
  // 拿到 state 上下文，比如 size、camera 等。
  const size = useThree(state => state.size);
  console.log('size', size);
  // 拿到camera对象 执行动画移动
  const camera = useThree(state => state.camera);
  // 使用gsap执行动画移动
  gsap.to(camera.position, {
    x: 0,
    y: 500,
    z: 200,
    duration: 1
  })

  return <primitive object={gltf.scene} />
}

function App1() {

  return <Canvas camera={{
    position: [0, 500, 500]
  }} style={{
      width: window.innerWidth,
      height: window.innerHeight
  }}>
    <ambientLight/>
    <axesHelper args={[1000]}/>
    <directionalLight position={[500, 400, 300]}/>
    <OrbitControls/>
    {/* <Mesh /> */}
    <Suspense fallback={null}>
      <Naruto />
    </Suspense>
  </Canvas>
}

export default App1
```