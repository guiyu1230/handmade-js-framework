import { useCallback, useEffect, useRef, useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper'

interface CardItem {
  id: number;
  content: string;
}

interface CardProps {
  data: CardItem,
  index: number,
  swapIndex: Function
}

interface DragData {
  id: number;
  index: number;
}

function Card(props: CardProps) {
  const { data, swapIndex, index } = props;

  const ref = useRef(null);

  const [{ handlerId },drop] = useDrop({
    accept: 'card',
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragData) {
      if(item.index === index) return;
      swapIndex(index, item.index)
      item.index = index;
    },
    // drop(item: DragData) {
    //   swapIndex(index, item.index)
    //   item.index = index;
    // }
  })

  const [{ dragging },drag] = useDrag({
    type: 'card',
    item: () => ({
      id: data.id,
      index
    }),
    collect(monitor) {
      return {
        dragging: monitor.isDragging()
      }
    },
  })

  useEffect(() => {
    drag(drop(ref))
  }, [drag, drop])

  return <div ref={ref} className={ dragging ? "card dragging" : "card"} data-handler-id={handlerId}>{data.content}</div>
}

function Sort() {
  const [cardList, setCardList] = useState<CardItem[]>([
    { id:0, content: '000' },
    { id:1, content: '111' },
    { id:2, content: '222' },
    { id:3, content: '333' },
    { id:4, content: '444' }
  ])

  const swapIndex = useCallback((index1: number, index2: number) => {
    const tmp = cardList[index1];
    cardList[index1] = cardList[index2];
    cardList[index2] = tmp;
    setCardList([...cardList]);

    // setCardList(preCards => {
    //   const tmp = preCards[index1];
    //   preCards[index1] = preCards[index2];
    //   preCards[index2] = tmp;
    //   return [...preCards];
    // })

    // setCardList((prevCards) =>
    //   update(prevCards, {
    //     $splice: [
    //       [index1, 1],
    //       [index2, 0, prevCards[index1]],
    //     ],
    //   }),
    // )
  }, [])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="class-list">
        {
          cardList.map((item: CardItem, index) => (
              <Card data={item} key={'card_' + item.id} index={index}  swapIndex={swapIndex} />
          ))
        }
      </div>
    </DndProvider>
  )
}

export default Sort;
