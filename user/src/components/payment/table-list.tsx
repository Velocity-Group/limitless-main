/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Table, Tag } from 'antd';
import { ITransaction } from 'src/interfaces';
import { formatDate } from '@lib/date';
import { useIntl } from 'react-intl';
// import Link from 'next/link';

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
  const intl = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'id', defaultMessage: 'ID' }),
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
      title: intl.formatMessage({ id: 'description', defaultMessage: 'Description' }),
      key: 'description',
      render(record: any) {
        return <span>{record?.products && record?.products[0]?.description}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'type', defaultMessage: 'Type' }),
      dataIndex: 'type',
      key: 'type',
      render(type: string) {
        switch (type) {
          case 'token_package': return <Tag color="blue">{intl.formatMessage({ id: 'walletPurchase', defaultMessage: 'Wallet Purchase' })}</Tag>;
          case 'monthly_subscription': return <Tag color="orange">{intl.formatMessage({ id: 'monthlySubscription', defaultMessage: 'Monthly Subscription' })}</Tag>;
          case 'yearly_subscription': return <Tag color="red">{intl.formatMessage({ id: 'yearlySubscription', defaultMessage: 'Yearly Subscription' })}</Tag>;
          case 'free_subscription': return <Tag color="green">{intl.formatMessage({ id: 'freeSubscription', defaultMessage: 'Free Subscription' })}</Tag>;
          default: return <Tag>{type}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'originalPrice', defaultMessage: 'Original Price' }),
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
      title: intl.formatMessage({ id: 'discount', defaultMessage: 'Discount' }),
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
      title: intl.formatMessage({ id: 'endPrice', defaultMessage: 'End Price' }),
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
      title: intl.formatMessage({ id: 'status', defaultMessage: 'Status' }),
      dataIndex: 'status',
      render(status: string) {
        switch (status) {
          case 'success':
            return <Tag color="green">{intl.formatMessage({ id: 'success', defaultMessage: 'Success' })}</Tag>;
          case 'fail':
            return <Tag color="red">{intl.formatMessage({ id: 'fail', defaultMessage: 'Fail' })}</Tag>;
          case 'processing':
            return <Tag color="orange">{intl.formatMessage({ id: 'processing', defaultMessage: 'Processing' })}</Tag>;
          case 'canceled':
            return <Tag color="pink">{intl.formatMessage({ id: 'cancelled', defaultMessage: 'Cancelled' })}</Tag>;
          case 'refunded':
            return <Tag color="violet">{intl.formatMessage({ id: 'refunded', defaultMessage: 'Refunded' })}</Tag>;
          case 'created':
            return <Tag color="default">{intl.formatMessage({ id: 'created', defaultMessage: 'Created' })}</Tag>;
          case 'require_authentication':
            return <Tag color="default">{intl.formatMessage({ id: 'requireAuthentication', defaultMessage: 'Require authentication' })}</Tag>;
          default: break;
        }
        return <Tag color="red">{status}</Tag>;
      }
    },
    {
      title: intl.formatMessage({ id: 'gateway', defaultMessage: 'Gateway' }),
      dataIndex: 'paymentGateway',
      render(paymentGateway: string) {
        switch (paymentGateway) {
          case 'stripe':
            return <Tag color="blue">{intl.formatMessage({ id: 'stripe', defaultMessage: 'Stripe' })}</Tag>;
          case 'ccbill':
            return (
              <Tag color="orange">
                {intl.formatMessage({ id: 'ccbill', defaultMessage: 'CCbill' })}
                {' '}
              </Tag>
            );
          default: return <Tag color="red">{paymentGateway}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
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
