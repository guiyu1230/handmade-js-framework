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