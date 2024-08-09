## React Playground

### 需求分析
### babel浏览器代码编译

```sh
npm install
npm i --save @babel/standalone
npm i --save-dev @types/babel__standalone
npm i --save-dev @types/babel__core
npm install @monaco-editor/react
```
- 使用babel的 `transform` 转换代码
```ts
import { transform } from '@babel/standalone';

const code = `import { useEffect, useState } from "react";

function App() {
  const [num, setNum] = useState(() => {
    const num1 = 1 + 2;
    const num2 = 2 + 3;
    return num1 + num2
  });

  return (
    <div onClick={() => setNum((prevNum) => prevNum + 1)}>{num}</div>
  );
}

export default App;
`

const res = transform(code, {
  presets: ['react', 'typescript'],
  filename: 'guang.tsx'
});
console.log(res.code);
```

### 使用`blob url`自定义生成script链接
```js
URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))
```

### babel的 `transform` 转换代码和`blob url`组合使用
- 使用`transform`将jsx文件转变成js文件
- 将`import`引用转换成`blob url`
```ts
import { transform } from '@babel/standalone';
import type { PluginObj } from '@babel/core';

function App() {

    const code1 =`
    function add(a, b) {
        return a + b;
    }
    export { add };
    `;

    const url = URL.createObjectURL(new Blob([code1], { type: 'application/javascript' }));

    const transformImportSourcePlugin: PluginObj = {
        visitor: {
            ImportDeclaration(path) {
                path.node.source.value = url;
            }
        },
    }


  const code = `import { add } from './add.ts'; console.log(add(2, 3));`

  function onClick() {
    const res = transform(code, {
      presets: ['react', 'typescript'],
      filename: 'guang.ts',
      plugins: [transformImportSourcePlugin]
    });
    console.log(res.code);
  }

  return (
    <div>
      <button onClick={onClick}>编译</button>
    </div>
  )
}

export default App
```

### 使用`monaco-editor`编辑器
```ts
import Editor from '@monaco-editor/react';

function App() {

    const code =`import { useEffect, useState } from "react";

function App() {
    const [num, setNum] = useState(() => {
        const num1 = 1 + 2;
        const num2 = 2 + 3;
        return num1 + num2
    });

    return (
        <div onClick={() => setNum((prevNum) => prevNum + 1)}>{num}</div>
    );
}

export default App;
`;

    return <Editor height="500px" defaultLanguage="javascript" defaultValue={code} />;
}

export default App;
```

我们分析了下 react playground 的实现思路。

编辑器部分用 @monaco-editor/react 实现，然后用 @babel/standalone 在浏览器里编译。

编译过程中用自己写的 babel 插件实现 import 的 source 的修改，变为 URL.createObjectURL + Blob 生成的 blob url，把模块内容内联进去。

对于 react、react-dom 这种包，用 import maps 配合 esm.sh 网站来引入。

然后用 iframe 预览生成的内容，url 同样是把内容内联到 src 里，生成 blob url。

这样，react playground 整个流程的思路就理清了。

### 代码编辑器布局

#### 拖拽改变 editor 和 preview 部分的宽度
```sh
npm install --save allotment
```
```jsx
import { Allotment } from "allotment";
import 'allotment/dist/style.css';

export default function ReactPlayground() {
    return <div style={{height: '100vh'}}>
        <Allotment defaultSizes={[100, 100]}>
            <Allotment.Pane minSize={500}>
                <div>
                    111
                </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={0}>
                <div>
                    222
                </div>
            </Allotment.Pane>
        </Allotment>
    </div>
}
```

#### 配置`monaco editor`编辑器
```sh
npm install --save @monaco-editor/react
# automatic type acquisition 自动类型获取。
# 它可以传入源码，自动分析出需要的 ts 类型包，然后自动下载。
npm install --save @typescript/ata -f 
```

| `monaco-editor/react` API          | 描述                     | 备注      |
| ---------------------------------- | ---------------------- | ------- |
| `height`            | 编辑器高度              |    |
| `path`            | 文件路径或文件名              |    |
| `language`         | 语言如: `typescript`和`javascript`       |    |
| `value`            | 初始代码值              |    |
| `onMount`          | 编辑器加载完的回调里，设置 ts 的默认 compilerOptions。        |    |
| `options`          | 编辑器设置选项           |    |

- `onMount`: 加载完的回调里，设置 ts 的默认 compilerOptions
- 1. 加载完的回调里: 配置设置ctrl + s保存
- 2. 加载完的回调里: 设置 ts 的默认 compilerOptions。设置 jsx 为 preserve
- 3. 加载完的回调里: 设置引入第三方包
- `options`: 编辑器设置选项
- 1. `scrollBeyondLastLine: false` 最后一行不超过滚动一屏
- 2. `minimap: { enabled: false }` 缩略图不显示
- 3. `scrollbar` 设置横纵向滚动条宽度

```tsx
// ata.ts
import { setupTypeAcquisition } from "@typescript/ata";
import typescript from 'typescript';

export function createATA(onDownloadFile: (code: string, path: string) => void) {
  const ata = setupTypeAcquisition({
    projectName: 'my-ata',
    typescript: typescript,
    logger: console,
    delegate: {
      receivedFile: (code, path) => {
        console.log('自动下载的包', path);
        onDownloadFile(code, path);
      }
    }
  })

  return ata;
}

// index.tsx
import MonacoEditor, { EditorProps, OnMount } from '@monaco-editor/react';
import { createATA } from './ata';
import { editor } from 'monaco-editor';

export interface EditorFile {
  name: string;
  value: string;
  language: string;
}

interface Props {
  file: EditorFile;
  onChange?: EditorProps['onChange'],
  options?: editor.IStandaloneEditorConstructionOptions
}

export default function Editor(props: Props) {

  const {
    file,
    onChange,
    options
  } = props;

  //编辑器加载完的回调
  const handleEditorMount: OnMount = (editor, monaco) => {
    // 1. 设置ctrl + s保存
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument')?.run()
      // const actions = editor.getSupportedActions().map(a => a.id);
      // console.log(actions);
    });

    // 3. 设置引入第三方包提示
    const ata = createATA((code, path) => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(code, `file://${path}`);
    })

    editor.onDidChangeModelContent(() => {
      ata(editor.getValue())
    });

    ata(editor.getValue());

    // 2. 设置 ts 的默认 compilerOptions。设置 jsx 为 preserve
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.Preserve,
      esModuleInterop: true,
    })
  }

  return <MonacoEditor
    height='100%'
    path={file.name}
    language={file.language}
    onMount={handleEditorMount}
    onChange={onChange}
    value={file.value}
    options={
      {
        fontSize: 14,
        // 到了最后一行之后依然可以滚动一屏，关闭后就不会了。
        scrollBeyondLastLine: false,
        minimap: {  // 缩略图
          enabled: false
        },
        scrollbar: { // 设置横向纵向滚动条宽度
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6
        },
        ...options
      }
    }
  />
}
```

### 配置多文件切换和全局Context属性

#### 配置全局`Context`
- `files` 里是键值对方式保存的文件信息，键是文件名，值是文件的信息，包括 `name、value、language`。
- `selectedFileName` 选中的文件名
- `setSelectedFileName` 选中文件回调
- `setFiles`设置所有文件回调
- `addFile`添加文件回调
- `removeFile`删除文件回调
- `updateFileName`修改文件名回调

```tsx
import { createContext, PropsWithChildren, useState } from "react";
import { fileName2Language } from "./utils";
import { initFiles } from "./files";

export interface File {
  name: string;
  value: string;
  language: string;
}

export interface Files {
  [key: string]: File
}

export interface PlaygroundContext {
  files: Files
  selectedFileName: string
  setSelectedFileName: (fileName: string) => void
  setFiles: (files: Files) => void
  addFile: (fileName: string) => void
  removeFile: (fileName: string) => void
  updateFileName: (oldFieldName: string, newFieldName: string) => void
}

export const PlaygroundContext = createContext<PlaygroundContext>({
  selectedFileName: 'App.tsx'
} as PlaygroundContext)

export const PlaygroundProvider = (props: PropsWithChildren) => {
  const { children } = props;
  const [files, setFiles] = useState<Files>(initFiles);
  const [selectedFileName, setSelectedFileName] = useState('App.tsx');

  const addFile = (name: string) => {
    files[name] = {
      name,
      language: fileName2Language(name),
      value: ''
    }
    setFiles({...files})
  }

  const removeFile = (name: string) => {
    delete files[name];
    setFiles({...files});
  }

  const updateFileName = (oldFieldName: string, newFieldName: string) => {
    if(!files[oldFieldName] || newFieldName === undefined || newFieldName === null) return;
    const { [oldFieldName]: value, ...rest } = files;
    const newFile = {
      [newFieldName]: {
        ...value,
        language: fileName2Language(newFieldName),
        name: newFieldName
      },
    }
    setFiles({
      ...rest,
      ...newFile
    })
  }

  return <PlaygroundContext.Provider value={{
    files,
    selectedFileName,
    setSelectedFileName,
    setFiles,
    addFile,
    removeFile,
    updateFileName
  }}>
    {children}
  </PlaygroundContext.Provider>
}
```

```ts
// files.ts
import { Files } from "./PlaygroundContext"
import importMap from './template/import-map.json?raw';
import AppCss from './template/App.css?raw';
import App from './template/App.tsx?raw';
import main from './template/main.tsx?raw';
import { fileName2Language } from "./utils"


// app 文件名
export const APP_COMPONENT_FILE_NAME = 'App.tsx'
// esm 模块映射文件名
export const IMPORT_MAP_FILE_NAME = 'import-map.json'
// app 入口文件名
export const ENTRY_FILE_NAME = 'main.tsx'

export const initFiles: Files = {
  [ENTRY_FILE_NAME]: {
    name: ENTRY_FILE_NAME,
    language: fileName2Language(ENTRY_FILE_NAME),
    value: main,
  },
  [APP_COMPONENT_FILE_NAME]: {
    name: APP_COMPONENT_FILE_NAME,
    language: fileName2Language(APP_COMPONENT_FILE_NAME),
    value: App
  },
  'App.css': {
    name: 'App.css',
    language: 'css',
    value: AppCss
  },
  [IMPORT_MAP_FILE_NAME]: {
    name: IMPORT_MAP_FILE_NAME,
    language: fileName2Language(IMPORT_MAP_FILE_NAME),
    value: importMap
  }
}
```

### babel编译、iframe预览
```sh
npm install --save @babel/standalone

npm install --save-dev @types/babel__standalone
```

- compiler使用`babel transform`编译源码
- 使用`customResolver`插件遍历import语句替换成本地blob地址
- 最后编译生成浏览器可执行的源码
```js
// compiler.ts
import { transform } from "@babel/standalone";
import { File, Files } from "../../PlaygroundContext";
import { ENTRY_FILE_NAME } from "../../files";
import { PluginObj } from "@babel/core";

export const beforeTransformCode = (filename: string, code: string) => {
  let _code = code;
  const regexReact = /import\s+React/g;
  if ((filename.endsWith('.jsx') || filename.endsWith('.tsx')) && !regexReact.test(code)) {
    _code = `import React from 'react';\n${code}`
  }
  return _code;
}

export const babelTransform = (filename: string, code: string, files: Files) => {
  let _code = beforeTransformCode(filename, code);
  let result = '';
  try {
    result = transform(_code, {
      presets: ['react', 'typescript'],
      filename,
      plugins: [customResolver(files)],
      retainLines: true
    }).code!
  } catch(e) {
    console.error('编译出错', e);
  }
  return result;
}

const getModuleFile = (files: Files, modulePath: string): File => {
  let moduleName = modulePath.split('./').pop() || ''; 
  if(!moduleName.includes('.')) { // 隐藏后缀名模块
    const realModuleName = Object.keys(files).filter(key => {
      return key.endsWith('.ts')
          || key.endsWith('.tsx')
          || key.endsWith('.js')
          || key.endsWith('.jsx')
    }).find(key => {  // 匹配完成名模块
      return key.split('.').includes(moduleName)
    });
    if(realModuleName) {
      moduleName = realModuleName;
    }
  }
  return files[moduleName];
}

const json2Js = (file: File) => {
  const js = `export default ${file.value}`;
  return URL.createObjectURL(new Blob([js], { type: 'application/javascript' }));
}

const css2Js = (file: File) => {
  const randomId = new Date().getTime();
  const js = `
(() => {
  const stylesheet = document.createElement('style')
  stylesheet.setAttribute('id', 'style_${randomId}_${file.name}')
  document.head.appendChild(stylesheet)

  const styles = document.createTextNode(\`${file.value}\`)
  stylesheet.innerHTML = ''
  stylesheet.appendChild(styles)
})()
  `
  return URL.createObjectURL(new Blob([js], { type: 'application/javascript' }));
}

function customResolver(files: Files): PluginObj {
  return {
    visitor: {
      ImportDeclaration(path) {
        const modulePath = path.node.source.value;
        if(modulePath.startsWith('.')) {  // 本地模块,路径 .开头
          const file = getModuleFile(files, modulePath);
          if(!file) return
          if(file.name.endsWith('.css')) {
            path.node.source.value = css2Js(file)
          } else if(file.name.endsWith('.json')) {
            path.node.source.value = json2Js(file)
          } else {
            path.node.source.value = URL.createObjectURL(
              new Blob([babelTransform(file.name, file.value, files)], {
                type: 'application/javascript'
              })
            )
          }
        }
      }
    }
  }
}

export const compile = (files: Files) => {
  const main = files[ENTRY_FILE_NAME];
  return babelTransform(ENTRY_FILE_NAME, main.value, files)
}
```
#### iframe预览
- 加载iframe文件资源
- 动态集成import-map.json配置
- 监听`files`文件改变.然后`compiler`编译成源码加载如iframe内
- 生成`html blob url`加载到iframe src内显示预览内容
```ts
// preview/index.tsx
import { useContext, useEffect, useState } from "react"
import { PlaygroundContext } from "../../PlaygroundContext"
import { compile } from "./compiler";
import iframeRaw from './iframe.html?raw';
import { IMPORT_MAP_FILE_NAME } from "../../files";


export default function Preview() {
  const getIframeUrl = () => {
    const res = iframeRaw.replace(
      '<script type="importmap"></script>',
      `<script type="importmap">${
          files[IMPORT_MAP_FILE_NAME].value
      }</script>`
    ).replace(
      '<script type="module" id="appSrc"></script>',
      `<script type="module" id="appSrc">${compiledCode}</script>`,
    )
    return URL.createObjectURL(new Blob([res], { type: 'text/html' }))
  }

  const { files } = useContext(PlaygroundContext);
  const [compiledCode, setCompiledCode] = useState('');
  const [iframeUrl, setIframeUrl] = useState(getIframeUrl());

  useEffect(() => {
    const res = compile(files);
    setCompiledCode(res);
  }, [files])

  useEffect(() => {
      setIframeUrl(getIframeUrl())
  }, [files[IMPORT_MAP_FILE_NAME].value, compiledCode]);

  

  return <div style={{height: '100%'}}>
    <iframe
      src={iframeUrl}
      style={{
          width: '100%',
          height: '100%',
          padding: 0,
          border: 'none',
      }}
    />
  </div>
}
```