import { Table, Button, Space, Input, Select, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'

const { Search } = Input
const { Option } = Select

const Inventory = () => {
  // TODO: Fetch real data
  const data = [
    {
      key: '1',
      name: 'Castlle Malting Chateau Piulsen',
      category: 'Malt',
      quantity: 23.0,
      unit: 'kg',
      status: 'available',
      supplier: 'Castle Malting',
    },
    {
      key: '2',
      name: 'Cara Red',
      category: 'Malt',
      quantity: 3.0,
      unit: 'kg',
      status: 'available',
      supplier: 'Desconocido',
    },
    {
      key: '3',
      name: 'Carapils',
      category: 'Malt',
      quantity: 3.5,
      unit: 'kg',
      status: 'available',
      supplier: 'Desconocido',
    },
    {
      key: '4',
      name: 'Vienna',
      category: 'Malt',
      quantity: 1.9,
      unit: 'kg',
      status: 'low_stock',
      supplier: 'Desconocido',
    },
  ]

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Malt', value: 'Malt' },
        { text: 'Hop', value: 'Hop' },
        { text: 'Yeast', value: 'Yeast' },
      ],
      onFilter: (value: any, record: any) => record.category === value,
    },
    {
      title: 'Cantidad',
      key: 'quantity',
      render: (record: any) => `${record.quantity} ${record.unit}`,
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'available' ? 'green' : status === 'low_stock' ? 'orange' : 'red'
        const text = status === 'available' ? 'Disponible' : status === 'low_stock' ? 'Stock Bajo' : 'Agotado'
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: 'Proveedor',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: () => (
        <Space>
          <Button size="small">Editar</Button>
          <Button size="small">Historial</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Inventario</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          Agregar Ingrediente
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Buscar ingrediente"
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Filtrar por categoría"
          style={{ width: 200 }}
          allowClear
        >
          <Option value="malt">Maltas</Option>
          <Option value="hop">Lúpulos</Option>
          <Option value="yeast">Levaduras</Option>
          <Option value="adjunct">Adjuntos</Option>
        </Select>
        <Select
          placeholder="Estado"
          style={{ width: 150 }}
          allowClear
        >
          <Option value="available">Disponible</Option>
          <Option value="low_stock">Stock Bajo</Option>
          <Option value="expired">Caducado</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default Inventory
