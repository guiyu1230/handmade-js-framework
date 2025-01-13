import React, { createElement, ReactNode, useEffect, useState } from 'react';

const cacheMap = new Map();

const RemoteComp = ({ node }) => node;

// 1. 加载远程组件
const loadFile = (url: string, name?: string, options?: {externals?: any}) => {
  return new Promise((resolve, reject) => {
    const realUrl = url.split('?')[0].trim();
    /* 1. fetch加载js的方法 */
    /**
    if(realUrl.endsWith('.js')) {
      let text: string = '';
      if(cacheMap.has(url)) {
        text = cacheMap.get(url).text;
      } else {
        text = await fetch(url).then(res => res.text())
          .catch(reject) || '';
        cacheMap.set(url, { ...cacheMap.get(url), text });
      }
      if(text) {
        const { externals = {} } = options || {};
        // 将外部模块变量注入到全局
        Object.keys(externals).forEach((key) => {
          window[externals[key].export] = externals[key].import;
        });
        //const newText = text
        // .replaceAll('e.React', 'window.React')
        // .replaceAll('e.dayjs', 'window.dayjs')
        // .replaceAll('e.antd', 'window.antd');

        import(
          URL.createObjectURL(new Blob([text], 
            { type: 'application/javascript' })
          )).then(() => {
          resolve(name ? new Function(`return ${name}`)() : undefined);
        }).catch(reject);
      }
      return;
    }
    */
    /* 2. script标签加载js的方法 */
    if(realUrl.endsWith('.js')) {
      if(cacheMap.has(url)) {
        return resolve(name ? new Function(`return ${name}`)() : undefined);
      }
      const script = document.createElement('script');
      script.src = url;
      const { externals = {} } = options || {};
      // 将外部模块变量注入到全局
      Object.keys(externals).forEach((key) => {
        window[externals[key].export] = externals[key].import;
      });
      script.onload = function() {
        cacheMap.set(url, {Module: new Function(`return ${name}`)()});
        resolve(name ? new Function(`return ${name}`)() : undefined);
      }
      script.onerror = reject;
      document.body.appendChild(script);
      return;
    }

    if(realUrl.endsWith('.css')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
      return;
    }

    return reject(new Error('Unsupported file type'));
  });
}

/** 对外到处模块 */
export function loadModule(
  url: string, 
  name?: string,
  options?: {externals: any}
) {
  return new Promise((resolve, reject) => {
    if(!url) return reject(new Error('url is required'));

    const cachedItem = cacheMap.get(url);
    if(cachedItem?.Module) {
      resolve(cachedItem.Module);
    } else {
      loadFile(url, name, options).then((Module) => {
        cacheMap.set(url, { Module });
        resolve(Module);
      }).catch(reject);
    }
  })
}

export function loadComponent(
  urls: string[],
  name?: string,
  options?: {
    props?: Record<string, any>,
    externals?: Record<string, { import: any, export: string }>
  },
  children?: ReactNode
) {
  return new Promise(async (resolve, reject) => {
    if (!urls.length) return reject(new Error('请传入 url！'));

    const url = urls.find(v => v.split('?')[0].trim().endsWith('js'));
    
    if (cacheMap.get(url)?.Comp) {
      const Comp = cacheMap.get(url).Comp;
      resolve(createElement(Comp, options?.props, children || null));
    } else {
      const pList = urls.map(v => loadFile(v, name, options));
      Promise.all(pList).then((arr) => {
        const Comp = arr.find(Boolean) as any;
        cacheMap.set(url, { ...cacheMap.get(url), Comp });

        resolve(createElement(Comp, options?.props, children || null));
      }).catch(reject)
    }
  })
}

export default function LoadRemoteComponent(props) {
  const { urls, name, options, children } = props;
  const [Comp, setComp] = useState<ReactNode>(null);

  useEffect(() => {
    (async () => {
      try {
        const Comp = await loadComponent(urls, name, options, children) as ReactNode;
        setComp(Comp);
      } catch (error) {
        console.error(error);
      }
    })()
  }, [options])

  return React.createElement(RemoteComp, { node: Comp });
}