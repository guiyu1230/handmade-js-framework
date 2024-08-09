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

  const handleEditorMount: OnMount = (editor, monaco) => {

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument')?.run()
      // const actions = editor.getSupportedActions().map(a => a.id);
      // console.log(actions);
    });

    const ata = createATA((code, path) => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(code, `file://${path}`);
    })

    editor.onDidChangeModelContent(() => {
      ata(editor.getValue())
    });

    ata(editor.getValue());

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