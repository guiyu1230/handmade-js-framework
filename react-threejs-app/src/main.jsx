import React from 'react'
import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
import App1 from './App1.jsx';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    // App文件是 three指令式3D渲染
    // <App />
    // App1是使用react-three-fiber的组件式3D渲染
    <App1 />
  // </React.StrictMode>,
)
