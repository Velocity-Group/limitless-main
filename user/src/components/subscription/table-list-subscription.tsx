import { Table, Tag, Button } from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDate, formatDateNoTime } from '@lib/date';
import Link from 'next/link';

interface IProps {
  dataSource: ISubscription[];
  // eslint-disable-next-line react/require-default-props
  pagination?: any;
  // eslint-disable-next-line react/require-default-props
  rowKey?: string;
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
        'By aggree to cancel this model subscription, your will not able to access his contents immediately '
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
              {records?.performerInfo?.username || 'N/A'}
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
            return <Tag color="orange">Monthly Subscription</Tag>;
          case 'yearly':
            return <Tag color="orange">Yearly Subscription</Tag>;
          case 'free':
            return <Tag color="orange">Free Subscription</Tag>;
          default:
            return null;
        }
      }
    },
    {
      title: 'Expire_at',
      dataIndex: 'expiredAt',
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Start_recurring_at',
      dataIndex: 'startRecurringDate',
      render(date: Date, record) {
        return <span>{record.status === 'active' && formatDate(date)}</span>;
      }
    },
    {
      title: 'Next_recurring_at',
      dataIndex: 'nextRecurringDate',
      render(date: Date, record) {
        return <span>{record.status === 'active' && formatDate(date)}</span>;
      }
    },
    {
      title: 'Last_updated_at',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
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
      title: 'PM_Gateway',
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
      title: 'Actions',
      dataIndex: '_id',
      sorter: false,
      render(_id, record) {
        return (
          <>
            {!['free', 'system'].includes(record.subscriptionType) && (
              <>
                {record.status !== 'deactivated' ? (
                  <Button danger onClick={() => onCancel(record)}>
                    Cancel subscription
                  </Button>
                ) : (
                  <Button type="primary" onClick={() => activeSubscription(record)}>
                    Re-active subscription
                  </Button>
                )}
              </>
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
