import {
  Table, Tag, Button, Avatar
} from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDate, nowIsBefore } from '@lib/date';
import Link from 'next/link';
import { useIntl } from 'react-intl';

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
  const intl = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'model', defaultMessage: 'Model' }),
      dataIndex: 'performerInfo',
      render(data, records: ISubscription) {
        return (
          <Link
            href={{
              pathname: '/model/profile',
              query: { username: records?.performerInfo?.username || records?.performerInfo?._id }
            }}
            as={`/${records?.performerInfo?.username || records?.performerInfo?._id}`}
          >
            <a>
              <Avatar src={records?.performerInfo?.avatar || '/static/no-avatar.png'} />
              {' '}
              {records?.performerInfo?.name || records?.performerInfo?.username || 'N/A'}
            </a>
          </Link>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'type', defaultMessage: 'Type' }),
      dataIndex: 'subscriptionType',
      render(subscriptionType: string) {
        switch (subscriptionType) {
          case 'monthly':
            return <Tag color="blue">{intl.formatMessage({ id: 'monthly', defaultMessage: 'Monthly' })}</Tag>;
          case 'yearly':
            return <Tag color="red">{intl.formatMessage({ id: 'yearly', defaultMessage: 'Yearly' })}</Tag>;
          case 'free':
            return <Tag color="orange">{intl.formatMessage({ id: 'free', defaultMessage: 'Free' })}</Tag>;
          default:
            return <Tag color="orange">{subscriptionType}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'startDate', defaultMessage: 'Start Date' }),
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date, 'll')}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'expiryDate', defaultMessage: 'Expiry Date' }),
      dataIndex: 'expiredAt',
      sorter: true,
      render(date: Date, record: ISubscription) {
        return <span>{record.status !== 'active' ? formatDate(date, 'll') : ''}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'renewalDate', defaultMessage: 'Renewal Date' }),
      dataIndex: 'nextRecurringDate',
      sorter: true,
      render(date: Date, record: ISubscription) {
        return <span>{record.status === 'active' && record.subscriptionId && record.subscriptionType !== 'free' && formatDate(date, 'll')}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'pmGateway', defaultMessage: 'PM Gateway' }),
      dataIndex: 'paymentGateway',
      render(paymentGateway: string) {
        switch (paymentGateway) {
          case 'stripe':
            return <Tag color="blue">{intl.formatMessage({ id: 'stripe', defaultMessage: 'Stripe' })}</Tag>;
          case 'bitpay':
            return <Tag color="pink">{intl.formatMessage({ id: 'bitpay', defaultMessage: 'Bitpay' })}</Tag>;
          case 'paypal':
            return <Tag color="violet">{intl.formatMessage({ id: 'paypal', defaultMessage: 'Paypal' })}</Tag>;
          case 'ccbill':
            return <Tag color="orange">{intl.formatMessage({ id: 'ccBill', defaultMessage: 'CCBill' })}</Tag>;
          default:
            return <Tag color="default">{paymentGateway}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'status', defaultMessage: 'Status' }),
      dataIndex: 'status',
      render(status: string, record: ISubscription) {
        if (!nowIsBefore(record.expiredAt)) {
          return <Tag color="red">{intl.formatMessage({ id: 'suspended', defaultMessage: 'Suspended' })}</Tag>;
        }
        switch (status) {
          case 'active':
            return <Tag color="success">{intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}</Tag>;
          case 'deactivated':
            return <Tag color="red">{intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}</Tag>;
          default:
            return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
      dataIndex: '_id',
      render(_id, record: ISubscription) {
        return (
          <>
            {record.status === 'active' && nowIsBefore(record.expiredAt) ? (
              <Button danger onClick={() => cancelSubscription(record)}>
                {intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
              </Button>
            ) : (
              <Button type="primary" onClick={() => activeSubscription(record)}>
                {intl.formatMessage({ id: 'activate', defaultMessage: 'Activate' })}
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
