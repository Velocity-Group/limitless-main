/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import { Table, Button } from 'antd';
// import Link from 'next/link';
import { formatDate } from 'src/lib';
import './../../../pages/model/block-user/index.less';

interface IProps {
  items: any[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange: Function;
  unblockUser: Function;
  submiting: boolean;
}

const UsersBlockList = ({
  items,
  searching,
  total,
  pageSize,
  onChange,
  unblockUser,
  submiting
}: IProps) => {
  const columns = [
    {
      title: 'User',
      dataIndex: 'targetInfo',
      key: 'targetInfo',
      render: (targetInfo: any) => (
        <span>{targetInfo.name || targetInfo.username || 'N/A'}</span>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Blocked at',
      key: 'createdAt',
      dataIndex: 'createdAt',
      render: (createdAt: Date) => <span>{createdAt}</span>,
      sorter: true
    },
    {
      title: 'Actions',
      key: '_id',
      render: (item) => (
        <Button 
          type="primary" 
          disabled={submiting} 
          onClick={() => unblockUser(item.targetId)}>
            Unblock
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
      // scroll={{ x: true }}
      loading={searching}
      onChange={onChange.bind(this)}
    />
  );
};
UsersBlockList.defaultProps = {};
export default UsersBlockList;
