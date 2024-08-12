import { useContext } from "react";
import { Allotment } from "allotment";
import Header from "./components/Header";
import CodeEditor from "./components/CodeEditor";
import Preview from "./components/Preview";
import { PlaygroundContext } from "./PlaygroundContext";
import 'allotment/dist/style.css';

import './index.scss';

export default function ReactPlayground() {

  const {
    theme,
    // setTheme
  } = useContext(PlaygroundContext)

  return <div
    style={{height: '100vh'}}
    className={theme}
  >
    <Header />
    <Allotment defaultSizes={[100, 100]}>
      <Allotment.Pane minSize={500}>
        <CodeEditor />
      </Allotment.Pane>
      <Allotment.Pane>
        <Preview />
      </Allotment.Pane>
    </Allotment>
  </div>
}