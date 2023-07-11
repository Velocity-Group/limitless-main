import { Table, Tag, Avatar } from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDate, nowIsBefore } from '@lib/date';
import { useIntl } from 'react-intl';

interface IProps {
  dataSource: ISubscription[];
  pagination: any;
  rowKey: string;
  onChange: any;
  loading: boolean;
}

export const TableListSubscription = ({
  dataSource,
  pagination,
  rowKey,
  onChange,
  loading
}: IProps) => {
  const intl = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'user', defaultMessage: 'User' }),
      dataIndex: 'userInfo',
      render(data, records) {
        return (
          <span>
            <Avatar src={records?.userInfo?.avatar || '/static/no-avatar.png'} />
            {' '}
            {records?.userInfo?.name || records?.userInfo?.username || 'N/A'}
          </span>
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
          case 'system':
            return <Tag color="green">{intl.formatMessage({ id: 'system', defaultMessage: 'System' })}</Tag>;
          default:
            return <Tag color="#FFCF00">{subscriptionType}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'startDate', defaultMessage: 'Start Date' }),
      dataIndex: 'createdAt',
      render(date: Date) {
        return <span>{formatDate(date, 'll')}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'expiryDate', defaultMessage: 'Expiry Date' }),
      dataIndex: 'expiredAt',
      render(date: Date, record: ISubscription) {
        return <span>{record.status !== 'active' ? formatDate(date, 'll') : ''}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'renewalDate', defaultMessage: 'Renewal Date' }),
      dataIndex: 'nextRecurringDate',
      render(date: Date, record: ISubscription) {
        return <span>{record.status === 'active' && record.subscriptionType !== 'free' && formatDate(date, 'll')}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'pmGateway', defaultMessage: 'PM Gateway' }),
      dataIndex: 'paymentGateway',
      render(paymentGateway: string) {
        switch (paymentGateway) {
          case 'stripe':
            return <Tag color="blue">{intl.formatMessage({ id: 'stripe', defaultMessage: 'Stripe' })}</Tag>;
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
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
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
            return <Tag color="#00c12c">{intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}</Tag>;
          case 'deactivated':
            return <Tag color="#FFCF00">{intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}</Tag>;
          default:
            return <Tag color="pink">{status}</Tag>;
        }
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
