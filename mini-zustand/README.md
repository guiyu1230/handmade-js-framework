## 手写zustand源码
- zustand是最简单的react状态管理库. 
- 其简单易用优秀的设计模式值得参考.


```js
import { useEffect } from 'react';
//import { create } from 'zustand';
import { create } from './zustand.js';  // 手写

const useStore = create((set) => ({
  aaa: '',
  bbb: '',
  updateAaa: (value) => set({ aaa: value}),
  updateBbb: (value) => set({ bbb: value}),
}));

export default function App() {
  const updateAaa = useStore(state => state.updateAaa);
  const aaa = useStore(state => state.aaa);

  useEffect(() => {
    // 监听回调
    useStore.subscribe(state => {
      console.log(useStore.getState());
    });
  }, []);

  return (
    <div>
      <input value={aaa} onChange={e => updateAaa(e.target.value)} />
      <Bbb />
    </div>
  )
}
```

#### zustand手写源码简化版
- 初始化时用户执行`create`函数入参会传入一个`createState`方法.
- 同时会初始化一系列可供`state`状态怎删改查监听的方法:
- `listeners`: 监听订阅的方法集合
- `setState`: 修改`state`的方法. 同时会执行订阅方法
- `getState`: 获取`state`的方法
- `subscribe` 订阅回调. 当`state`变化会执行此函数
- `destroy`: 清空订阅回调
- 执行`createState`会初始化一个自定义的`state`数据状态
- 并返回一个函数. 函数做了以下能力:
- 1. 该函数绑定了以上api属性
- 2. 函数内部会监听`state`变化.且会引发react render行为
- 3. 函数最终返回指定条件的`state`数据 


```js
// ./zustand.js
import { useSyncExternalStore } from "react";

export const create = (createState) => {
  // 1. store创库的state数据
  let state;
  // 2. store的listeners监听回调
  const listeners = new Set();
  // 3. store的setState方法
  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial

    if (!Object.is(nextState, state)) {
      const previousState = state;

      if(!replace) {
          state = (typeof nextState !== 'object' || nextState === null)
              ? nextState
              : Object.assign({}, state, nextState);
      } else {
          state = nextState;
      }
      listeners.forEach((listener) => listener(state, previousState));
    }
  }
  // 4. store的getState方法
  const getState = () => state;
  // 5. store的subscribe订阅方法方法
  const subscribe= (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  // 6. store的destroy销毁方法
  const destroy= () => {
    listeners.clear()
  }

  const api = { setState, getState, subscribe, destroy }
  // 7. store的初始化state回调
  state = createState(setState, getState, api);
  // 8. 返回给外部使用的方法(useStore)
  const useBoundStore = (selector) => {
    function getState() {
      return selector(api.getState());
    }
    
    return useSyncExternalStore(api.subscribe, getState)
  }
  // 9. 将api的方法拷贝到useBoundStore上
  Object.assign(useBoundStore, api);
  // 10. 返回useBoundStore
  return useBoundStore
}
```