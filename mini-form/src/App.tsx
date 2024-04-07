import React from 'react';
import { useRoutes, useNavigate } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import { FormOutlined, SortAscendingOutlined, StarOutlined, DragOutlined, CodeOutlined } from '@ant-design/icons';
import routes from './routes/index';

const { Header, Content, Footer, Sider } = Layout;

const items = [
  { icon: React.createElement(FormOutlined), key: "form", label: '表单页' },
  { icon: React.createElement(DragOutlined), key: "drag",  label: '拖拽页' },
  { icon: React.createElement(StarOutlined), key: "sort",  label: '排序页' },
  { icon: React.createElement(SortAscendingOutlined), key: "sort1",  label: '排序页1' },
  { icon: React.createElement(CodeOutlined), key: "lowcode",  label: '低代码' }
]


function App() {
  const ElementRouter = useRoutes(routes);
  const history = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const handleClick = (item: any) => {
    history(item.key);
  }
  return (
    <Layout style={{height: '100vh', overflow: 'hidden'}}>
       <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
        // style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div className="demo-logo-vertical" />
        <Menu theme="dark" mode="inline" onClick={handleClick} defaultSelectedKeys={['form']} items={items} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              height: '100%',
              overflow: 'auto',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {ElementRouter}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  )
}

export default App;
