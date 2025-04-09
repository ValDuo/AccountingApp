import logo from "./parser.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import { Table } from "antd";
import axios from "axios";

const App = () => {
  const [dataSource, setDataSource] = useState([]);  

  const columns = [
    {
      title: 'Владелец',
      dataIndex: 'name',
      render: text => <a>{text}</a>,
    },
    {
      title: 'Тип',
      className: 'column-type',
      dataIndex: 'type',

    },
    {
      title: 'Помещение',
      dataIndex: 'address',
    },
    {
      title: 'Номер',
      dataIndex: 'number',
    },
    {
      title: 'Действие',
      dataIndex: '',
      key: 'x',
      render: () => <a>Изменить</a>,
    },
  ];
  const data = [
    {
      key: '1',
      name: 'Иван Иванов',
      type: 'Техника',
      address: 'г. Ростов-на-Дону, ул. Пушкинская, 174',
      number: '1000346234003',
      description: 'Это оборудование нужно для отедла ОУВ',
    },
    {
      key: '2',
      name: 'Денис Петренко',
      type: 'Мебель',
      address: 'г. Ростов-на-Дону, ул. Красноармейская, 150',
      number: '1000352343033',
      description: 'Это оборудование нужно для отдела ОТЗ',
    },
    {
      key: '3',
      name: 'Владимир Яценко',
      type: 'Оборудование',
      address: 'г. Ростов-на-Дону, ул. Большая Садовая, 67',
      number: '1000245645033',
      description: 'Это оборудование нужно для отдела ОУВ',
    },
  ];


  const fetchInfo = () => {
    axios.get('http://10.10.5.24:8000/json/').then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Ошибка при загрузке данных:', error);
      });
  }

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <Table
      columns={columns}
      dataSource={data}
      bordered
      expandable={{
        expandedRowRender: record => <p style={{ margin: 0 }}>{record.description}</p>,
        rowExpandable: record => record.name !== 'Нет дополнительной информации об объекте',
      }}
      title={() => 'Учёт техники'}
      footer={() => 'Добавить строку'}
    />
    );
}

export default App;

