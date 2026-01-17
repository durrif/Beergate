import { Table, Button, Upload, Space, Tag, message } from 'antd'
import { UploadOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons'

const Recipes = () => {
  const data = [
    {
      key: '1',
      name: 'American IPA',
      style: '21A American IPA',
      batchSize: 20,
      abv: 6.5,
      ibu: 65,
      status: 'draft',
      canBrew: true,
    },
    {
      key: '2',
      name: 'Belgian Dubbel',
      style: '26B Belgian Dubbel',
      batchSize: 20,
      abv: 7.2,
      ibu: 20,
      status: 'planned',
      canBrew: false,
    },
  ]

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Estilo',
      dataIndex: 'style',
      key: 'style',
    },
    {
      title: 'Tamaño',
      dataIndex: 'batchSize',
      key: 'batchSize',
      render: (value: number) => `${value} L`,
    },
    {
      title: 'ABV',
      dataIndex: 'abv',
      key: 'abv',
      render: (value: number) => `${value}%`,
    },
    {
      title: 'IBU',
      dataIndex: 'ibu',
      key: 'ibu',
    },
    {
      title: 'Disponible',
      dataIndex: 'canBrew',
      key: 'canBrew',
      render: (canBrew: boolean) => (
        <Tag color={canBrew ? 'green' : 'red'}>
          {canBrew ? 'Sí' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button size="small">Ver</Button>
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!record.canBrew}
          >
            Elaborar
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Recetas</h1>
        <Space>
          <Upload>
            <Button icon={<UploadOutlined />}>Importar BeerXML</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva Receta
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default Recipes
