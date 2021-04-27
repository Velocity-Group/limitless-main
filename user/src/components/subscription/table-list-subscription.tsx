/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/require-default-props */
import { Table, Tag, Button } from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDate, formatDateNoTime } from '@lib/date';
import Link from 'next/link';

interface IProps {
  dataSource: ISubscription[];
  pagination?: {};
  rowKey?: string;
  onChange(): Function;
  loading: boolean;
  cancelSubscription: Function;
}

export const TableListSubscription = ({
  dataSource,
  pagination,
  rowKey,
  onChange,
  loading,
  cancelSubscription
}: IProps) => {
  const onCancel = (value) => {
    if (!window.confirm('By aggree to cancel subscription, your will not able to access to this model posts immediately ')) {
      return;
    }
    cancelSubscription(value);
  };
  const columns = [
    {
      title: 'Model',
      dataIndex: 'performerInfo',
      render(performerInfo) {
        return (
          <Link
            href={{
              pathname: '/model/profile',
              query: { username: performerInfo?.username }
            }}
            as={`/${performerInfo?.username}`}
          >
            <a>
              {`${performerInfo?.name || performerInfo?.username}`}
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
          default: return (
            <Tag color="orange">
              {subscriptionType}
              {' '}
              Subscription
            </Tag>
          );
        }
      }
    },
    {
      title: 'Expired Date',
      dataIndex: 'expiredAt',
      render(date: Date) {
        return <span>{formatDateNoTime(date)}</span>;
      }
    },
    {
      title: 'Next Recurring Date',
      dataIndex: 'nextRecurringDate',
      render(date: Date) {
        return <span>{formatDateNoTime(date)}</span>;
      }
    },
    {
      title: 'Last updated at',
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
            return <Tag color="red">De-activated</Tag>;
          default:
            return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      sorter: false,
      render(_id: string, record: any) {
        return <>{record.status === 'active' && <Button danger onClick={() => onCancel(_id)}>Cancel subscription</Button>}</>;
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
