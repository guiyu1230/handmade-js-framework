import { DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sort1 from '../component/sort1';

function SortPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Sort1 />
    </DndProvider>
  )
}

export default SortPage;
