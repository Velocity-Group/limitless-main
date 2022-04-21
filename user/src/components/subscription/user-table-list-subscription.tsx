import { Table, Tag } from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDate, nowIsBefore } from '@lib/date';

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
  const columns = [
    {
      title: 'User',
      dataIndex: 'userInfo',
      render(data, records) {
        return <span>{records?.userInfo?.name || records?.userInfo?.username || 'N/A'}</span>;
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
          case 'system':
            return <Tag color="green">System</Tag>;
          default:
            return <Tag color="#FFCF00">{subscriptionType}</Tag>;
        }
      }
    },
    {
      title: 'Start Date',
      dataIndex: 'startRecurringDate',
      render(date: Date, record: ISubscription) {
        return <span>{record.status === 'active' && formatDate(date, 'll')}</span>;
      }
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiredAt',
      render(date: Date, record: ISubscription) {
        return <span>{record.status === 'active' && formatDate(date, 'll')}</span>;
      }
    },
    {
      title: 'Renews On',
      dataIndex: 'nextRecurringDate',
      render(date: Date, record: ISubscription) {
        return <span>{record.status === 'active' && nowIsBefore(record.expiredAt) ? formatDate(date, 'll') : 'N/A'}</span>;
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
      title: 'Updated on',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status: string, record: ISubscription) {
        if (!nowIsBefore(record.expiredAt)) {
          return <Tag color="red">Suspended</Tag>;
        }
        switch (status) {
          case 'active':
            return <Tag color="#00c12c">Active</Tag>;
          case 'deactivated':
            return <Tag color="#FFCF00">Inactive</Tag>;
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
