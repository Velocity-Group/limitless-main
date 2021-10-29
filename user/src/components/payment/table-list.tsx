/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Table, Tag } from 'antd';
import { ITransaction } from 'src/interfaces';
import { formatDate } from '@lib/date';
import Link from 'next/link';

interface IProps {
  dataSource: ITransaction[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange: Function;
}

const PaymentTableList = ({
  dataSource,
  pagination,
  rowKey,
  loading,
  onChange
}: IProps) => {
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      render(id) {
        return (
          <a style={{ whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
            {id.slice(16, 24)}
          </a>
        );
      }
    },
    {
      title: 'Description',
      key: 'description',
      render(record: any) {
        return <span>{record?.products[0]?.description}</span>;
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render(type: string) {
        switch (type) {
          case 'token_package': return <Tag color="blue">Token Package</Tag>;
          case 'monthly_subscription': return <Tag color="orange">Monthly Subscription</Tag>;
          case 'yearly_subscription': return <Tag color="red">Yearly Subscription</Tag>;
          case 'free_subscription': return <Tag color="green">Free Subscription</Tag>;
          default: return <Tag>{type}</Tag>;
        }
      }
    },
    {
      title: 'Original price',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      render(originalPrice) {
        return (
          <span>
            $
            {(originalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Discount',
      dataIndex: 'couponInfo',
      render(couponInfo, record) {
        return couponInfo ? (
          <span style={{ whiteSpace: 'nowrap' }}>
            {`${(couponInfo.value || 0) * 100}%`}
            {' '}
            - $
            {((record?.originalPrice || 0) * couponInfo.value).toFixed(2)}
          </span>
        ) : (
          ''
        );
      }
    },
    {
      title: 'End price',
      dataIndex: 'totalPrice',
      render(totalPrice) {
        return (
          <span>
            $
            {(totalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status: string) {
        switch (status) {
          case 'success':
            return <Tag color="green">Success</Tag>;
          case 'fail':
            return <Tag color="red">Fail</Tag>;
          case 'processing':
            return <Tag color="orange">Processing</Tag>;
          case 'canceled':
            return <Tag color="pink">Canceled</Tag>;
          case 'refunded':
            return <Tag color="violet">Refunded</Tag>;
          case 'created':
            return <Tag color="default">Created</Tag>;
          case 'require_authentication':
            return <Tag color="default">Require Authentication</Tag>;
          default: break;
        }
        return <Tag color="red">{status}</Tag>;
      }
    },
    {
      title: 'Update at',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      render(record) {
        if (record.status === 'require_authentication' && record.stripeConfirmUrl) {
          return <Link href={record.stripeConfirmUrl}><a>Confirm payment</a></Link>;
        }
        return null;
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={pagination}
        rowKey={rowKey}
        loading={loading}
        onChange={onChange.bind(this)}
      />
    </div>
  );
};
export default PaymentTableList;
