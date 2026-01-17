import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import {
  ShoppingCartOutlined,
  WarningOutlined,
  ExperimentOutlined,
  EuroOutlined,
} from '@ant-design/icons'

const Dashboard = () => {
  // TODO: Fetch real data
  const stats = {
    totalIngredients: 11,
    totalValue: 245.50,
    lowStockAlerts: 2,
    expiringItems: 1,
  }

  const recentActivity = [
    {
      key: '1',
      action: 'Compra',
      item: 'Pale Ale Malt',
      quantity: '25 kg',
      date: '2026-01-15',
    },
    {
      key: '2',
      action: 'Uso',
      item: 'Simcoe Hops',
      quantity: '100 g',
      date: '2026-01-14',
    },
    {
      key: '3',
      action: 'Elaboración',
      item: 'IPA Americana',
      quantity: '20 L',
      date: '2026-01-13',
    },
  ]

  const columns = [
    {
      title: 'Acción',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => {
        const color = text === 'Compra' ? 'green' : text === 'Uso' ? 'blue' : 'orange'
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Ingredientes"
              value={stats.totalIngredients}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Valor Inventario"
              value={stats.totalValue}
              precision={2}
              prefix={<EuroOutlined />}
              suffix="€"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Alertas Stock Bajo"
              value={stats.lowStockAlerts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Por Caducar"
              value={stats.expiringItems}
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Actividad Reciente">
        <Table
          columns={columns}
          dataSource={recentActivity}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Dashboard
