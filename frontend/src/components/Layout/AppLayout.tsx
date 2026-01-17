import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  ShoppingOutlined,
  ExperimentOutlined,
  BulbOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: 'Inventario',
    },
    {
      key: '/purchases',
      icon: <ShoppingOutlined />,
      label: 'Compras',
    },
    {
      key: '/recipes',
      icon: <ExperimentOutlined />,
      label: 'Recetas',
    },
    {
      key: '/recommendations',
      icon: <BulbOutlined />,
      label: 'Recomendaciones',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {collapsed ? '🍺' : '🍺 Beergate'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ float: 'right', marginRight: 24 }}>
            <LogoutOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
