import React, { useEffect, useState } from "react";
import { Table, Alert, Input, Form, Popconfirm, Space, Button, message, Checkbox } from "antd";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

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
  const [loginStatus, setLoginStatus] = useState(null);
  const [loginError, setLoginError] = useState(null);

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
          // Приводим к серверным названиям полей, если нужно:
          is_computer: row.isComputer,  // camelCase -> snake_case
          working_place: row.address,
          owner: row.number
        };

        if (item.isNew) {
          // POST для новой записи
          await axios.post("http://10.10.5.24:8001/technic/",
            JSON.stringify(updatedItem),  // Явное преобразование в JSON
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          message.success("Строка добавлена на сервер");
        } else {
          // PUT для существующей записи
          await axios.put(
            `http://10.10.5.24:8001/technic/${item.code}/`,  // Используем item.code вместо code
            JSON.stringify(updatedItem),
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          message.success("Изменения сохранены");
        }

        // Обновляем локальное состояние
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
          key: code, // или item.id, если он есть
          code: code, // сохраняем код отдельно, если нужно
          isComputer: item.is_computer ?? false, // приведение к camelCase, если нужно
          address: item.working_place, // если в таблице колонка "address"
          number: item.owner, // если колонка "number"
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
        setLoginStatus(response.data);
        setLoginError(null);
      })
      .catch((error) => {
        setLoginError(error.message);
        setLoginStatus(null);
      });
  };

  useEffect(() => {
    checkLoginStatus();
    fetchInfo();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {loginError && (
        <Alert
          message="Ошибка"
          description={`Не удалось проверить статус входа: ${loginError}`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {loginStatus && (
        <Alert
          message="Статус входа"
          description={`Вход выполнен успешно`}
          type="info"
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
            rowExpandable: (record) =>
              record.description !== "",
          }}
          title={() => "Учёт техники"}
        />
      </Form>
    </div>
  );
};

export default App;
