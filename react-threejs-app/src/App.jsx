import { useEffect, useRef } from 'react'
import { init } from './3d-init';
import './App.css'

function App() {

  const changeHorseColorRef = useRef(() => {});

  useEffect(() => {
    const dom = document.getElementById('content');
    const { changeHorseColor } = init(dom);

    changeHorseColorRef.current = changeHorseColor;

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