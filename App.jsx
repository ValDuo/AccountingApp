import React, { useEffect, useState } from "react";
import { Table, Alert, Flex, Input, Form, Popconfirm, Space, Button, message, Checkbox } from "antd";
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import { useNavigate } from 'react-router-dom'; //хук для навигации

const EditableCell = ({
  editing,
  dataIndex,
  title,
  record,
  children,
  ...restProps
}) => {
  const inputNode =
    dataIndex === "isComputer" ? (
      <Checkbox />
    ) : (
      <Input />
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          valuePropName={dataIndex === "isComputer" ? "checked" : "value"}
          style={{ margin: 0 }}
        >
          {inputNode}
        </Form.Item>
      ) : dataIndex === "isComputer" ? (
        <Checkbox checked={record[dataIndex]} disabled />
      ) : (
        children
      )}
    </td>
  );
};

const App = () => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [editingKey, setEditingKey] = useState("");
  const [loginStatus, setLoginStatus] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancel = () => setEditingKey("");

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...dataSource];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        const updatedItem = {
          ...item,
          ...row,
          is_computer: row.isComputer,
          working_place: row.address,
          owner: row.number
        };

        if (item.isNew) {
          await axios.post("http://10.10.5.24:8001/technic/",
            JSON.stringify(updatedItem),
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          message.success("Строка добавлена на сервер");
        } else {
          await axios.put(
            `http://10.10.5.24:8001/technic/${item.code}/`,
            JSON.stringify(updatedItem),
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          message.success("Изменения сохранены");
        }

        const updatedData = [...newData];
        updatedData[index] = { ...updatedItem, isNew: false };
        setDataSource(updatedData);
        setEditingKey("");
      }
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      message.error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Ошибка при сохранении"
      );
    }
  };

  const handleDelete = async (key, code) => {
    try {
      await axios.delete(`http://10.10.5.24:8001/technic/${code}/`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      const newData = dataSource.filter((item) => item.key !== key);
      setDataSource(newData);
      message.success("Удалено");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      message.error("Не удалось удалить");
    }
  };

  const handleAdd = () => {
    const newRow = {
      key: uuidv4(),
      code: "",
      type: "",
      isComputer: false,
      address: "",
      number: "",
      isNew: true,
    };
    setDataSource([...dataSource, newRow]);
    edit(newRow);
  };

  const columns = [
    {
      title: "Индивидуальный номер",
      dataIndex: "code",
      editable: true,
    },
    {
      title: "Тип",
      dataIndex: "type",
      editable: true,
    },
    {
      title: "Компьютер",
      dataIndex: "isComputer",
      editable: true,
    },
    {
      title: "Помещение",
      dataIndex: "address",
      editable: true,
    },
    {
      title: "ИНН собственника",
      dataIndex: "number",
      editable: true,
    },
    {
      title: "Действие",
      dataIndex: "operation",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a onClick={() => save(record.key)} style={{ marginRight: 8 }}>
              Сохранить
            </a>
            <Popconfirm title="Отменить изменения?" onConfirm={cancel}>
              <a>Отмена</a>
            </Popconfirm>
          </span>
        ) : (
          <Space>
            <a disabled={editingKey !== ""} onClick={() => edit(record)}>
              Изменить
            </a>
            <Popconfirm
              title="Удалить строку?"
              onConfirm={() => handleDelete(record.key, record.code)}
            >
              <a>Удалить</a>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) =>
    col.editable
      ? {
        ...col,
        onCell: (record) => ({
          record,
          inputType: "text",
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record),
        }),
      }
      : col
  );

  const fetchInfo = () => {
    axios
      .get("http://10.10.5.24:8001/technic")
      .then((response) => {
        const technicData = response.data.technic;
        const loadedData = Object.entries(technicData).map(([code, item]) => ({
          ...item,
          key: code,
          code: code,
          isComputer: item.is_computer ?? false,
          address: item.working_place,
          number: item.owner,
        }));
        setDataSource(loadedData);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке данных:", error);
        message.error("Не удалось загрузить данные с сервера");
      });
  };

  const checkLoginStatus = () => {
    axios
      .get("http://10.10.5.24:8001/technic")
      .then((response) => {
        setLoginStatus(true);
        setIsAuthenticated(false);
        setLoginError(null);
      })
      .catch((error) => {
        setLoginError(error.message);
        setLoginStatus(false);
        setIsAuthenticated(false);
      });
  };

  const onFinish = async (values) => {
    const { username, password } = values;
    await login(username, password);
    
  };
    
  

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    setIsAuthenticated(false);
    try {
      const response = await axios.post('http://localhost:8001/user_login/auth/token/', {
        username,
        password
      });
  
      const { access, refresh } = response.data;
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
  
      await axios.get("http://localhost:8001/user_login/is_login/", {
        username,
        password,
        headers: { Authorization: `Bearer ${access}` }
      });
      
      setIsAuthenticated(true);
      setLoginError(null);
      fetchInfo();
    } catch (error) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setIsAuthenticated(false);
      if (error.response?.status === 401) {
        setLoginError("Такого пользователя нет в системе");
      } else {
        console.error("Ошибка авторизации:", error);
        setLoginError("Ошибка соединения с сервером");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthenticated || loginError) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
        {loginError && (
          <Alert
            message="Ошибка"
            description={`Не удалось подключиться к серверу: ${loginError}`}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Введите имя пользователя!' }] }
            onChange = {() => setLoginError(null)}
          >
            <Input prefix={<UserOutlined />} placeholder="Логин" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль!' }]}
          >
            <Input prefix={<LockOutlined />} type="password" placeholder="Пароль" />
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
            <Button block type="primary" htmlType="submit" loading={isLoading}>
              Войти в систему
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {isAuthenticated && (
        <Alert
          message="Вход выполнен"
          description="Вы успешно вошли в систему"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Button
        onClick={handleAdd}
        type="primary"
        style={{ marginBottom: 16 }}
        disabled={editingKey !== ""}
      >
        Добавить строку
      </Button>

      <Form form={form} component={false}>
        <Table
          components={{ body: { cell: EditableCell } }}
          bordered
          dataSource={dataSource}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{ onChange: cancel }}
          expandable={{
            expandedRowRender: (record) => (
              <p style={{ margin: 0 }}>Описание не задано</p>
            ),
            rowExpandable: (record) => record.description !== "",
          }}
          title={() => "Учёт техники"}
        />
      </Form>
    </div>
  );
};

export default App;