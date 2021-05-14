/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import { Table, Tag } from 'antd';
import Link from 'next/link';
import { PayoutRequestInterface } from 'src/interfaces';
import { formatDate } from 'src/lib';

interface IProps {
  payouts: PayoutRequestInterface[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange(pagination, filters, sorter, extra): Function;
}

const PayoutRequestList = ({
  payouts,
  searching,
  total,
  pageSize,
  onChange
}: IProps) => {
  const columns = [
    {
      title: 'IDs',
      dataIndex: '_id',
      key: 'id',
      render: (id: string, record) => (
        <Link
          href={{
            pathname: '/payout-requests/update',
            query: {
              data: JSON.stringify(record),
              id: record._id
            }
          }}
          as={`/payout-request/update?id=${record._id}`}
        >
          <a>
            {id.slice(16, 24).toUpperCase()}
          </a>
        </Link>
      )
    },
    {
      title: 'Request Tokens',
      dataIndex: 'requestTokens',
      key: 'requestTokens',
      render: (requestTokens: number) => (
        <span>
          <img alt="token" src="/static/coin-ico.png" width="20px" />
          {requestTokens || 0}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        switch (status) {
          case 'done':
            return <Tag color="green" style={{ textTransform: 'capitalize' }}>Done</Tag>;
          case 'pending':
            return <Tag color="orange" style={{ textTransform: 'capitalize' }}>Pending</Tag>;
          case 'rejected':
            return <Tag color="red" style={{ textTransform: 'capitalize' }}>Rejected</Tag>;
          default: break;
        }
        return <Tag color="blue" style={{ textTransform: 'capitalize' }}>{status}</Tag>;
      }
    },
    {
      title: 'Request at',
      key: 'createdAt',
      dataIndex: 'createdAt',
      render: (createdAt: Date) => <span>{formatDate(createdAt)}</span>,
      sorter: true
    },
    {
      title: 'Last updated at',
      key: 'updatedAt',
      dataIndex: 'updatedAt',
      render: (updatedAt: Date) => <span>{formatDate(updatedAt)}</span>,
      sorter: true
    },
    {
      title: 'Actions',
      key: 'details',
      render: (request: PayoutRequestInterface) => (
        <Link
          href={{
            pathname: '/payout-requests/update',
            query: {
              data: JSON.stringify(request),
              id: request._id
            }
          }}
          as={`/payout-request/update?id=${request._id}`}
        >
          <a>View details</a>
        </Link>
      )
    }
  ];
  const dataSource = payouts.map((p) => ({ ...p, key: p._id }));

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
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange}
    />
  );
};
PayoutRequestList.defaultProps = {};
export default PayoutRequestList;