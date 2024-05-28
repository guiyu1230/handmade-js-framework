## 手写vue playground

### 架构设计

![文件格式](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/21aa20eae708456ead8f37a92c9d96a0~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=515&h=365&s=27729&e=png&b=ffffff)

### 文件格式
```
|- src
    |- components
        |- Preview
          |- index.vue
          |- preview-template.html
        |- VuePlayground.vue
        |- VueSfcEditor.vue
    |- App.vue
```



### 文件功能

- `VueSfcEditor`是编辑器组件.编辑后同步源码给`VuePlayground`组件
- `VuePlayground`组件内部使用`@vue/compiler-sfc`编译源码
- `VuePlayground`编译源码成浏览器可执行的脚本给`Preview`执行渲染

`Preview` 组件首次渲染时创建一个 `iframe` 容器。 监听到代码变更时，通过`iframe.contentWindow.postMessage` 方法将编译后的代码传递给 `iframe`。`iframe` 监听 `message` 事件，将传递的代码包裹在 `script`标签中执行。

### 源码
#### VuePlayground.vue源码
```html
<template>
  <div class="vue-playground">
    <div class="vue-playground__editor">
      <VueSfcEditor></VueSfcEditor>
    </div>
    <div class="vue-playground__preview">
      <Preview></Preview>
    </div>
  </div>
</template>

<script setup>
import VueSfcEditor from './VueSfcEditor.vue';
import Preview from './Preview/index.vue';
import { provide, reactive } from 'vue';
import {
  parse,
  compileScript,
  compileTemplate,
  compileStyle,
} from "@vue/compiler-sfc";

// 默认代码
const DefaultCode = `
<script setup>
import { ref } from 'vue'

const msg = ref('Hello World!')
<\/script>

<template>
  <h1>{{ msg }}</h1>
  <input v-model="msg" />
</template>
`;

const state = reactive({
  // sfc 源代码
  code: DefaultCode.trim(),
  updateCode(code) {
    state.code = code;
  },
  // 编译过程
  compile(code) {
    const { descriptor } = parse(code);
    
    let _code = `
    if(window.__app__) {
      window.__app__.unmount();
    }
    window.__app__ = null;
    `;

    const componentName = "__AppVue__";

    // 编译脚本.
    if(descriptor.script || descriptor.scriptSetup) {
      const script = compileScript(descriptor, {
        inlineTemplate: true,
        id: descriptor.filename,
      });
      _code += script.content.replace(
        "export default",
        `window.${componentName} =`
      )
    }

    // 非 setup 模式下, 需要编译template
    if(!descriptor.scriptSetup && descriptor.template) {
      const template = compileTemplate(descriptor.template, {
        id: descriptor.filename
      });
      _code = 
        _code + 
        ";" + 
        template.code.replace(
          "export function",
          `window.${componentName}.render = function`
        );
    }

    // 创建 vue app 实例并渲染
    _code += `;
    import { createApp } from "vue";

    window.__app__ = createApp(window.${componentName});
    window.__app__.mount("#app");

    if(window.__style__) {
      window.__style__.remove();
    }
    `;

    // 编译css样式
    if(descriptor.styles?.length) {
      const styles = descriptor.styles.map(style => {
        return compileStyle({
          source: style.content,
          id: descriptor.filename
        }).code;
      });

      _code += `
      window.__style__ = document.createElement("style");
      window.__style__.innerHTML = ${JSON.stringify(styles.join(""))};
      document.body.appendChild(window.__style__);
      `;
    }
    console.log(_code);
    return _code;
  }
})

provide("store", state);
</script>

<style scoped>
.vue-playground {
  display: flex;
  height: 100%;
}
.vue-playground > * {
  flex: 1;
}
</style>
```

#### VueSfcEditor.vue
```html
<template>
  <div style="width: 100%; height: 100%" ref="vueSfcEditor"></div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';
import { basicSetup, EditorView } from 'codemirror';
import { vue } from "@codemirror/lang-vue";
import { oneDark } from "@codemirror/theme-one-dark";

const vueSfcEditor = ref();

const store = inject("store");

onMounted(() => {
  if(!vueSfcEditor.value) return;

  new EditorView({
    doc: store.code,
    extensions: [
      basicSetup, // 添加行号、撤销历史、代码折叠、语法高亮等功能
      vue(), // 添加 vue sfc 的语法解析,
      // 全屏展示
      EditorView.theme({
        "&": {height: "100%"},
        ".cm-scroller": { overflow: "auto" }
      }),
      oneDark,
      EditorView.updateListener.of(view => {
        if(view.docChanged) {
          store.updateCode(view.state.doc.toString())
        }
      })
    ],
    parent: vueSfcEditor.value
  })
})
</script>
```
#### preview/preview-template.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <div id="app"></div>
  <script type="importmap">
    {
      "imports": {
        "vue": "https://unpkg.com/vue@3.4.21/dist/vue.esm-browser.js"
      }
    }
  </script>
  <script>
    // 监听 message, preview/index.vue 通过postmessage传递需要执行的代码
    window.addEventListener("message", ({ data }) => {
      const { type, code } = data;
      console.log('iframe', type, code);
      if(type === "eval") {
        handleEval(code);
      }
    });

    const evalScriptElements = [];

    // 处理需要执行的代码
    function handleEval(code) {
      // 移除历史脚本
      if(evalScriptElements.length) {
        evalScriptElements.forEach(el => el.remove());
        evalScriptElements.length = 0;
      }

      // 创建新的脚本元素
      const script = document.createElement("script");
      script.setAttribute("type", "module");
      script.innerHTML = code;
      evalScriptElements.push(script);

      // 插入到body中
      document.body.appendChild(script);
    }
  </script>
</body>
</html>
```

#### preview/index.vue
```html
<template>
  <div class="preview" ref="preview"></div>
</template>

<script setup>
import { ref, onMounted, inject, watch, onUnmounted } from "vue";
import PreviewTemplate from "./preview-template.html?raw";

const preview = ref();

let proxy = null;

// 注入store
const store = inject("store");

// 创建沙盒
function createSandbox() {
  const template = document.createElement("iframe");
  template.setAttribute("frameborder", "0");
  template.style = "width: 100%; height:100%";
  template.srcdoc = PreviewTemplate;
  preview.value.appendChild(template);

  template.onload = () => {
    proxy = createProxy(template);
  }
}

// 创建代理, 用于监听code 变化, 告诉沙盒重新渲染
function createProxy(iframe) {
  let _iframe = iframe;

  // 监听code 变化，告诉沙盒重新渲染
  const stopWatch = watch(() => store?.code, compile, { immediate: true });

  function compile(code) {
    if(!code?.trim()) return;

    const compiledCode = store?.compile(code);

    _iframe.contentWindow.postMessage(
      { type: "eval", code: compiledCode },
      "*"
    );
  }

  // 销毁沙盒
  function destroy() {
    _iframe?.remove();
    _iframe = null;
    stopWatch?.();
  }

  return {
    compile,
    destroy
  };
}

onMounted(createSandbox)
onUnmounted(() => proxy?.destroy());
</script>

<style scoped>
.preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
```