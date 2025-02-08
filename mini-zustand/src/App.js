import { useEffect } from 'react';
// import { create } from 'zustand';
import { create } from './zastand.js';
import { persist } from 'zustand/middleware';

// function logMiddleware(func) {
//   return function (set, get, store) {

//     function newSet(...args) {
//       console.log('newSet', ...args);
//       set(...args);
//     }
//     console.log('set', set);
//     return func(newSet, get, store);
//   }
// }
const useStore = create(persist((set) => ({
  aaa: '',
  bbb: '',
  updateAaa: (value) => set({ aaa: value}),
  updateBbb: (value) => set({ bbb: value}),
}),{
  name: 'zustand-example',
}));

export default function App() {
  const updateAaa = useStore(state => state.updateAaa);
  const aaa = useStore(state => state.aaa);

  useEffect(() => {
    useStore.subscribe(state => {
      console.log(111, useStore.getState());
    });
  }, []);

  return (
    <div>
      <input value={aaa} onChange={e => updateAaa(e.target.value)} />
      <Bbb />
    </div>
  )
}

function Bbb() {
  return (
    <div>
      <Ccc />
    </div>
  )
}

function Ccc() {
  const aaa = useStore(state => state.aaa);
  return (
    <p>hello, {aaa}</p>
  )
}