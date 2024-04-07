import React, { Fragment, useCallback, useContext, useState } from 'react';
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper'

const ROW = 'row';
const COLUMN = 'column';
const COMPONENT = 'component';

interface LayoutItem {
  type: string;
  id: string;
  children?: LayoutItem[];
  component?: {
    type: string
  }
}

const initialLayout = [
  {
    type: ROW,
    id: 'row0',
    children: [
      {
        type: COLUMN,
        id: 'column0',
        children: [
          {
            type: COMPONENT,
            id: "component0",
            component: {
              type: 'aaa'
            }
          },
          {
            type: COMPONENT,
            id: "component1",
            component: {
              type: 'bbb'
            }
          }
        ]
      },
      {
        type: COLUMN,
        id: "column1",
        children: [
            {
                type: COMPONENT,
                id: "component2",
                component: {
                    type: 'eee'
                }
            }
        ]
      }
    ]
  },
  {
    type: ROW,
    id: "row1",
    children: [
        {
            type: COLUMN,
            id: "column2",
            children: [
                {
                    type: COMPONENT,
                    id: "component3",
                    component: {
                        type: 'bbb'
                    }
                },
                {
                    type: COMPONENT,
                    id: "component0",
                    component: {
                        type: 'aaa'
                    }
                },
                {
                    type: COMPONENT,
                    id: "component2",
                    component: {
                        type: 'bbb'
                    }
                }
            ]
        }
    ]
  }
]

let id = 0;

function Aaa() {
  return <button>aaa</button>
}
function Bbb() {
  return <img alt="哆啦A梦" width="50" height="50" src="https://img0.baidu.com/it/u=3610760552,2286123102&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"/>
}

function Ccc() {
  return <input type="range"></input>
}

const registeredComponent: Record<string, any> = {
  aaa: Aaa,
  bbb: Bbb,
  ccc: Ccc,
}

interface ComponentProps {
  data: LayoutItem,
  rowIndex: number;
  columnIndex: number;
  compIndex: number;
}
function Component(compProps: ComponentProps) {
  const { component } = compProps.data;

  const currentPath = `${compProps.rowIndex}-${compProps.columnIndex}-${compProps.compIndex}`;
  const [, drag] = useDrag({
    type: 'component',
    item: {
      type: "component",
      path: currentPath,
      data: compProps.data
    }
  })

  const Comp = registeredComponent[component!.type] || Aaa;

  return <div ref={drag} className="component">
    <Comp></Comp>
  </div>
}

interface ColumnProps  {
  data: LayoutItem;
  columnIndex: number;
  rowIndex: number;
}

function Column(columnProps: ColumnProps) {
  const { children } = columnProps.data;

  const currentPath = `${columnProps.rowIndex}-${columnProps.columnIndex}`;
  const [, drag] = useDrag({
    type: 'column',
    item: {
      type: 'column',
      path: currentPath,
      data: columnProps.data
    }
  })

  return <div ref={drag} className="column">
    {
        children?.map((item, index) => {
            return <Fragment key={index}>
              <DropZone className='drop-zone-horizental' path={`${currentPath}-${index}`} accept='component'></DropZone>
              <Component key={`comp_id_${item.id}`} data={item}
                rowIndex={columnProps.rowIndex}
                columnIndex={columnProps.columnIndex}
                compIndex={index}
              ></Component>
            </Fragment>
        })
    }
    <DropZone className='drop-zone-horizental' path={`${currentPath}-${children?.length}`} accept='component'></DropZone>
  </div>
}

interface RowProps {
  data: LayoutItem;
  rowIndex: number;
}

function Row(rowProps: RowProps) {
  const { children } = rowProps.data;

  const currentPath = rowProps.rowIndex + '';

  const [, drag] = useDrag({
    type: 'row',
    item: {
      path: currentPath,
      type: 'row',
      data: rowProps.data
    }
  })

  return <div ref={drag} className="row">
      {
          children?.map((item, index) => {
              return <Fragment key={index}>
                <DropZone className='drop-zone-vertical' path={`${currentPath}-${index}`} accept="column"></DropZone>
                <Column key={`col_id_${item.id}`} data={item} rowIndex={rowProps.rowIndex} columnIndex={index}></Column>
              </Fragment>
          })
      }
      <DropZone className='drop-zone-vertical' path={`${currentPath}-${children?.length}`} accept="column"></DropZone>
  </div>
}

interface DropZoneProps {
  className: string;
  path: string;
  accept: "row" | "column" | "component" | "barItem";
}

function DropZone(props: DropZoneProps) {

  const { swapPosition } = useContext(LayoutContext);

  const accept = [props.accept];
  props.accept === "component" && accept.push('barItem');

  const [{ overing }, drop] = useDrop({
    // accept: ['column', 'row', 'component', 'barItem'],
    accept: accept,
    drop(item: any) {
      swapPosition(item, props.path);
    },
    collect(monitor) {
      return {
        overing: monitor.isOver()
      }
    }
  })
  return <div ref={drop} className={`drop-zone ${props.className} ${overing ? 'focus': ''}`}></div>
}

interface BarItemProps {
  type: string;
}

interface acceptItemProps {
  type: 'row' | 'column' | 'component' | 'barItem';
  path?: string;
  data: any;
}

function BarItem(props: BarItemProps) {
  const Comp = registeredComponent[props.type];

  const [, drag] = useDrag({
    type: 'barItem',
    item: {
      type: 'barItem',
      data: {
        type: 'barItem',
        component: props,
        id: 'barItem' + ++id
      } 
    } as acceptItemProps
  })

  return <div ref={drag} className="bar-item">
    <Comp></Comp>
  </div>
}

type ContextType = { swapPosition: Function };

const LayoutContext = React.createContext<ContextType>({
  swapPosition: () => {}
})

function LowCode() {
  const [layout, setLayout] = useState<LayoutItem[]>(initialLayout);

  const swapPosition = useCallback((item: acceptItemProps, targetPath: string) => {
    console.log(item, targetPath);
    let { type, data, path } = item;
    if(path && path === targetPath) return;

    let deleteObj = {};
    if(type === "barItem") {
      data = {
        ...data,
        type: 'component'
      }
    } else if(path) {
      // 清除
      const pathArr: number[] = path.split('-').map(Number);
      const sourcePath = pathArr.pop() as number;
      deleteObj = {$splice: [[sourcePath, 1]]} as any;
      while(pathArr.length) {
        const sourcePath = pathArr.pop() as number;
        deleteObj = {
          [sourcePath]: {
            children: deleteObj
          }
        }
      }
    }

    let insertObj = {};
    const targetPathArr = targetPath.split('-').map(Number);
    const targetPath1 = targetPathArr.pop() as number;
    insertObj = {$splice: [[targetPath1, 0, data]]}
    while(targetPathArr.length) {
      const targetPath1 = targetPathArr.pop() as number;
      insertObj = {
        [targetPath1]: {
          children: insertObj
        }
      }
    }
    // const mergeObject = update(deleteObj, { $merge: insertObj});
    // console.log(mergeObject)
    setLayout((preLayout) => 
      update(preLayout, {
        ...deleteObj,
        ...insertObj
    }))

    
    // setLayout((preLayout) => 
    //   update(preLayout, {
    //     1: {
    //       children: {
    //         0: {
    //           children: {$splice: [[1, 1]]  }
    //         }
    //       }
    //     },
    //     0: {
    //       children: {
    //         1: {
    //           children: {$splice: [[1,0, item.data]]}
    //         }
    //       }
    //     }
    // }))
    // const lay = layout as any;

    // lay[1].children[0].children.splice(0, 1);
    // lay[0].children[1].children.splice(1, 0, item.data);

    // setLayout([...lay])
    // console.log(item.path, path2);
  }, []);

  return <LayoutContext.Provider value={{swapPosition}}>
    <div className="container1">
      <DndProvider backend={HTML5Backend}>
        {
          layout.map((item, index) => {
            return <Fragment key={index}>
              <DropZone className='drop-zone-horizental' path={`${index}`} accept="row"></DropZone>
              <Row key={`row_id_${item.id}`} data={item} rowIndex={index}></Row>
            </Fragment>
          })
        }
        <DropZone className='drop-zone-horizental' path={`${layout.length}`} accept="row"></DropZone>
        <div className="bottomBar">
          <BarItem type="aaa"></BarItem>
          <BarItem type="bbb"></BarItem>
          <BarItem type="ccc"></BarItem>
        </div>
      </DndProvider>
    </div>
  </LayoutContext.Provider>
}


export default LowCode;
