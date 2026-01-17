import { Table, Button, Upload, Space, message } from 'antd'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const Purchases = () => {
  const data = [
    {
      key: '1',
      supplier: 'Castle Malting',
      date: '2026-01-10',
      total: 125.50,
      status: 'completed',
      items: 5,
    },
    {
      key: '2',
      supplier: 'Hop Revolution',
      date: '2026-01-05',
      total: 89.00,
      status: 'processing',
      items: 3,
    },
  ]

  const columns = [
    {
      title: 'Proveedor',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `${value.toFixed(2)} €`,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: () => (
        <Space>
          <Button size="small">Ver Detalles</Button>
          <Button size="small">Procesar</Button>
        </Space>
      ),
    },
  ]

  const uploadProps: UploadProps = {
    name: 'file',
    action: 'http://localhost:8000/api/v1/purchases/upload-invoice',
    headers: {
      authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} subido correctamente`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} falló al subir`)
      }
    },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Compras y Facturas</h1>
        <Space>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Subir Factura PDF</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva Compra Manual
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

export default Purchases
