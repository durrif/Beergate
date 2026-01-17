import { Form, Input, Button, Card } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'

const Login = () => {
  const onFinish = (values: any) => {
    console.log('Login:', values)
    // TODO: Implement login API call
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card
        title={
          <div style={{ textAlign: 'center', fontSize: 24 }}>
            🍺 Beergate
          </div>
        }
        style={{ width: 400 }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="username"
            rules={[{ required: true, message: 'Por favor ingresa tu email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@beergate.com" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="admin123" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
