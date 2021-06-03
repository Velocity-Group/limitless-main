/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import { Button, Table } from 'antd';
import { formatDate } from '@lib/date';

interface IProps {
  items: any[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange: Function;
  handleReport: Function;
  submiting: boolean;
}

const reportTableList = ({
  items,
  searching,
  total,
  pageSize,
  onChange
}: IProps) => {
  const columns = [
    {
      title: 'User',
      dataIndex: 'sourceInfo',
      key: 'sourceInfo',
      render: (user) => (
        <span>
          {user?.name || user?.username || 'N/A'}
        </span>
      )
    },
    {
      title: 'Username',
      dataIndex: 'performerInfo',
      key: 'performerInfo',
      render: (performer) => (
        <span>
          {performer?.name || performer?.username || 'N/A'}
        </span>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Created at',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: Date) => <span>{formatDate(createdAt)}</span>,
      sorter: true
    },
    {
      title: 'Actions',
      key: '_id',
      render: () => (
        <Button
          type="primary"
        >
          View
        </Button>
      )
    }
  ];

  const dataSource = items.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      scroll={{ x: true }}
      loading={searching}
      onChange={onChange.bind(this)}
    />
  );
};
export default reportTableList;
