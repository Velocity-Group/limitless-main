import { Table, Tag, Button } from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDate } from '@lib/date';
import Link from 'next/link';

interface IProps {
  dataSource: ISubscription[];
  pagination: any;
  rowKey: string;
  onChange: any;
  loading: boolean;
  cancelSubscription: Function;
  activeSubscription: Function;
}

export const TableListSubscription = ({
  dataSource,
  pagination,
  rowKey,
  onChange,
  loading,
  cancelSubscription,
  activeSubscription
}: IProps) => {
  const onCancel = (value) => {
    if (
      !window.confirm(
        'Confirm to cancel this subscription!'
      )
    ) {
      return;
    }
    cancelSubscription(value);
  };
  const columns = [
    {
      title: 'Model',
      dataIndex: 'performerInfo',
      render(data, records) {
        return (
          <Link
            href={{
              pathname: '/model/profile',
              query: { username: records?.performerInfo?.username || records?.performerInfo?._id }
            }}
            as={`/model/${records?.performerInfo?.username || records?.performerInfo?._id}`}
          >
            <a>
              {records?.performerInfo?.name || records?.performerInfo?.username || 'N/A'}
            </a>
          </Link>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'subscriptionType',
      render(subscriptionType: string) {
        switch (subscriptionType) {
          case 'monthly':
            return <Tag color="blue">Monthly Subscription</Tag>;
          case 'yearly':
            return <Tag color="red">Yearly Subscription</Tag>;
          case 'free':
            return <Tag color="orange">Free Subscription</Tag>;
          default:
            return <Tag color="orange">{subscriptionType}</Tag>;
        }
      }
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiredAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date, 'll')}</span>;
      }
    },
    {
      title: 'Start Recurring Date',
      dataIndex: 'startRecurringDate',
      sorter: true,
      render(date: Date, record) {
        return <span>{record.status === 'active' && formatDate(date, 'll')}</span>;
      }
    },
    {
      title: 'Next Recurring Date',
      dataIndex: 'nextRecurringDate',
      sorter: true,
      render(date: Date, record) {
        return <span>{record.status === 'active' && formatDate(date, 'll')}</span>;
      }
    },
    {
      title: 'Updated at',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'PM Gateway',
      dataIndex: 'paymentGateway',
      render(paymentGateway: string) {
        switch (paymentGateway) {
          case 'stripe':
            return <Tag color="blue">Stripe</Tag>;
          case 'bitpay':
            return <Tag color="pink">Bitpay</Tag>;
          case 'paypal':
            return <Tag color="violet">Paypal</Tag>;
          case 'ccbill':
            return <Tag color="orange">CCbill</Tag>;
          default:
            return <Tag color="default">{paymentGateway}</Tag>;
        }
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status: string) {
        switch (status) {
          case 'active':
            return <Tag color="success">Active</Tag>;
          case 'deactivated':
            return <Tag color="red">Inactive</Tag>;
          default:
            return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render(_id, record) {
        return (
          <>
            {record.status !== 'deactivated' ? (
              <Button danger onClick={() => onCancel(record)}>
                Cancel subscription
              </Button>
            ) : (
              <Button type="primary" onClick={() => activeSubscription(record)}>
                Activate subscription
              </Button>
            )}
          </>
        );
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        pagination={pagination}
        onChange={onChange}
        loading={loading}
      />
    </div>
  );
};
