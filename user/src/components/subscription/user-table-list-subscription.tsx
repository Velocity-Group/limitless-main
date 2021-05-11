import { Table, Tag, Button } from 'antd';
import { ISubscription } from 'src/interfaces';
import { formatDateNoTime } from '@lib/date';

interface IProps {
  dataSource: ISubscription[];
  pagination: any;
  rowKey: string;
  onChange: any;
  loading: boolean;
  blockUser: Function;
  unblockUser: Function;
}

export const TableListSubscription = ({
  dataSource,
  pagination,
  rowKey,
  onChange,
  loading,
  blockUser,
  unblockUser
}: IProps) => {
  const columns = [
    {
      title: 'User',
      dataIndex: 'userInfo',
      render(data, records) {
        return <span>{records?.userInfo.username || 'N/A'}</span>;
      }
    },
    {
      title: 'Type',
      dataIndex: 'subscriptionType',
      render(subscriptionType: string) {
        switch (subscriptionType) {
          case 'monthly':
            return <Tag color="#936dc9">Monthly Subscription</Tag>;
          case 'yearly':
            return <Tag color="#00dcff">Yearly Subscription</Tag>;
          case 'free':
            return <Tag color="#FFCF00">Free Subscription</Tag>;
          case 'system':
            return <Tag color="#FFCF00">System</Tag>;
          default:
            return null;
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
      title: 'Start Recurring Date',
      dataIndex: 'startRecurringDate',
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
        return <span>{formatDateNoTime(date)}</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status: string) {
        switch (status) {
          case 'active':
            return <Tag color="#00c12c">Active</Tag>;
          case 'deactivated':
            return <Tag color="#FFCF00">Deactivated</Tag>;
          default:
            return <Tag color="pink">{status}</Tag>;
        }
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (data, record) => (!record.blockedUser ? (
        <Button
          className="primary"
          onClick={() => blockUser({ userId: record.userId })}
        >
          Block
        </Button>
      ) : (
        <Button
          className="secondary"
          onClick={() => unblockUser(record.userId)}
        >
          Unblock
        </Button>
      ))
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
