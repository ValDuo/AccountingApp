import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Flex } from 'antd';
const App = () => {
   const onFinish = values => {
      console.log('Полученные значения из формы : ', values);
   };
   return (
      <Form
         name="login"
         initialValues={{ remember: true }}
         style={{ maxWidth: 360 }}
         onFinish={onFinish}
      >
         <Form.Item
            name="username"
            rules={[{ required: true, message: 'Введите имя пользователя!' }]}
         >
            <Input prefix={<UserOutlined />} placeholder="Username" />
         </Form.Item>
         <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль!' }]}
         >
            <Input prefix={<LockOutlined />} type="password" placeholder="Password" />
         </Form.Item>
         <Form.Item>
            <Flex justify="space-between" align="center">
               <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Запомнить меня</Checkbox>
               </Form.Item>
               <a href="">Забыли пароль?</a>
            </Flex>
         </Form.Item>

         <Form.Item>
            <Button block type="primary" htmlType="submit">
               Войти в систему
            </Button>
            or <a href="">Регистрация</a>
         </Form.Item>
      </Form>
   );
};
export default App;