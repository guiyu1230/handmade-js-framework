import React, { useRef, useState } from 'react';
import { useDrag, useDrop, useDragLayer, DndProvider } from 'react-dnd';
import { getEmptyImage, HTML5Backend } from 'react-dnd-html5-backend';

interface ItemType {
  color: string;
}
interface BoxProps {
  color: string;
}

function Box(props: BoxProps) {
  const ref = useRef(null);

  const [{dragging}, drag, dragPreview] = useDrag({
    type: 'box',
    item: {
      color: props.color
    },
    collect(monitor) {
      return {
        dragging: monitor.isDragging()
      }
    }
  });

  React.useEffect(() => {
    drag(ref);
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [drag, dragPreview])

  return <div ref={ref} className={dragging ? 'box dragging': 'box'} style={
    { background: props.color || 'blue' }
  }></div>
}

function Container() {
  const [boxes, setBoxes] = useState<ItemType[]>([]);

  const ref = useRef(null);

  const [,drop] = useDrop(() => {
    return {
      accept: 'box',
      drop(item: ItemType) {
        setBoxes((boxes) => [...boxes, item])
      }
    }
  });

  React.useEffect(() => {
    drop(ref);
  }, [drop])
  

  return <div ref={ref} className="container">
    {
      boxes.map(item => (
        <Box color={item.color}></Box>
      ))
    }
  </div>
}

const DragLayer = () => {
  const {isDragging, item, currentOffset} = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset()
  }))

  if(!isDragging) {
    return null;
  }
  return (
    <div className="drag-layer" style={{
      left: currentOffset?.x,
      top: currentOffset?.y
    }}>
      {item.color} 拖拖拖
    </div>
  )
}

function SortPage() {
  return <DndProvider backend={HTML5Backend}>
    <Container></Container>
    <Box color="blue"></Box>
    <Box color="red"></Box>
    <Box color="green"></Box>
    <DragLayer></DragLayer>
  </DndProvider>
}

export default SortPage;
