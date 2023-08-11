import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  rowKey: string,
  dataSource: [],
  loading: boolean,
  onChange: Function
}

function TableListReferralEarning({
  rowKey, dataSource, loading, onChange
}: IProps) {
  const columns = [
    {
      title: 'Referred person',
      render(data, record) {
        return <span>{record?.registerInfo.name || record?.registerInfo.username}</span>;
      }
    },
    {
      title: 'Presenter',
      render(data, record) {
        return <span>{record?.referralInfo.name || record?.referralInfo.username}</span>;
      }
    },
    {
      title: 'Role',
      render(data, record) {
        switch (record?.registerSource) {
          case 'performer':
            return <Tag color="cyan">Model</Tag>;
          case 'user':
            return <Tag color="geekblue">Fan</Tag>;
          default: return <Tag color="default">{record?.registerSource}</Tag>;
        }
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render(type) {
        switch (type) {
          case 'tip':
            return <Tag color="magenta">Tip</Tag>;
          case 'video':
            return <Tag color="volcano">Video</Tag>;
          case 'feed':
            return <Tag color="purple">Post</Tag>;
          case 'gallery':
            return <Tag color="purple">Gallery</Tag>;
          case 'monthly_subscription':
            return <Tag color="blue">Monthly Subscription</Tag>;
          case 'yearly_subscription':
            return <Tag color="gold">Yearly Subscription</Tag>;
          default: return <Tag color="default">{type}</Tag>;
        }
      }
    },
    {
      title: 'GROSS Price',
      render(data, record) {
        return (
          <span>
            $
            {(record?.grossPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'NET Price',
      render(data, record) {
        return (
          <span>
            $
            {(record?.netPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Referral Commission',
      render(data, record) {
        return (
          <span>
            {(record?.referralCommission || 0) * 100}
            %
          </span>
        );
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    }
  ];

  return (
    <Table
      rowKey={rowKey}
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      onChange={onChange.bind(this)}
    />
  );
}

export default TableListReferralEarning;
