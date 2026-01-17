import { Card, List, Tag, Button } from 'antd'
import { BulbOutlined, WarningOutlined, ExperimentOutlined } from '@ant-design/icons'

const Recommendations = () => {
  const possibleRecipes = [
    {
      name: 'American IPA',
      style: '21A',
      canBrew: true,
      missing: [],
    },
    {
      name: 'Pale Ale',
      style: '18B',
      canBrew: true,
      missing: [],
    },
    {
      name: 'Belgian Dubbel',
      style: '26B',
      canBrew: false,
      missing: ['Levadura Belgian', 'Azúcar Candi'],
    },
  ]

  const alerts = [
    {
      type: 'low_stock',
      message: 'Vienna Malt está por debajo del umbral mínimo (1.9 kg disponibles)',
      severity: 'warning',
    },
    {
      type: 'expiring',
      message: 'Levadura US-05 caduca en 15 días',
      severity: 'info',
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Recomendaciones e Inteligencia</h1>

      <Card
        title={
          <span>
            <ExperimentOutlined /> ¿Qué puedo elaborar hoy?
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <List
          dataSource={possibleRecipes}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="primary" disabled={!item.canBrew}>
                  Ver Receta
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`${item.name} (${item.style})`}
                description={
                  item.canBrew ? (
                    <Tag color="green">Ingredientes disponibles</Tag>
                  ) : (
                    <span>
                      <Tag color="red">Faltan ingredientes</Tag>
                      {item.missing.join(', ')}
                    </span>
                  )
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        title={
          <span>
            <WarningOutlined /> Alertas de Inventario
          </span>
        }
      >
        <List
          dataSource={alerts}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  item.severity === 'warning' ? (
                    <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />
                  ) : (
                    <BulbOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                  )
                }
                title={item.type === 'low_stock' ? 'Stock Bajo' : 'Próximo a Caducar'}
                description={item.message}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Recommendations
