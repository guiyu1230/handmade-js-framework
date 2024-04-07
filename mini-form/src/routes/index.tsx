import Form from '../pages/Form';
import Drag from '../pages/Drag';
import Sort from '../pages/Sort';
import SortPage from '../pages/Sort1';
import LowCode from '../pages/Lowcode';

const routes = [
  { path: '/', element: <Form /> },
  { path: '/form', element: <Form /> },
  { path: 'drag', element: <Drag /> },
  { path: 'sort', element: <Sort /> },
  { path: 'sort1', element: <SortPage /> },
  { path: 'lowcode', element: <LowCode /> }
]

export default routes;
