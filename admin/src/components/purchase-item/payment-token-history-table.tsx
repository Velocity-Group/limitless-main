/* eslint-disable react/destructuring-assignment */
import { Table, Tag } from 'antd';
import { IPaymentTokenHistory } from 'src/interfaces';
import { formatDate } from '@lib/date';

interface IProps {
  dataSource: IPaymentTokenHistory[];
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
      title: 'Transaction_ID',
      dataIndex: '_id',
      key: 'id',
      render(data, record) {
        return (
          <a style={{ textTransform: 'uppercase', fontWeight: 600 }}>
            {record._id.slice(16, 24)}
          </a>
        );
      }
    },
    {
      title: 'Buyer',
      dataIndex: 'sourceInfo',
      key: 'user',
      render(sourceInfo) {
        return (
          <span>
            {sourceInfo?.name || sourceInfo?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Seller',
      dataIndex: 'performerInfo',
      key: 'performerInfo',
      render(data, record) {
        return (
          <span>
            {record?.performerInfo?.name || record?.performerInfo?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Description',
      render(data, record) {
        return record.products.map((re) => (
          <>
            <span key={record._id}>
              {re.description}
            </span>
            <br />
          </>
        ));
      }
    },
    {
      title: 'Tokens',
      dataIndex: 'totalPrice',
      render(totalPrice) {
        return (
          <span>
            <img alt="gem" src="/coin-ico.png" width="15px" />
            {(totalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render(type: string) {
        switch (type) {
          case 'feed':
            return <Tag color="#1da3f1">Feed Post</Tag>;
          case 'monthly_subscription':
            return <Tag color="#ca50c6">Monthly Subscription</Tag>;
          case 'yearly_subscription':
            return <Tag color="#ca50c6">Yearly Subscription</Tag>;
          case 'video':
            return <Tag color="#00dcff">Video</Tag>;
          case 'gallery':
            return <Tag color="#00dcff">Gallery</Tag>;
          case 'product':
            return <Tag color="#FFCF00">Product</Tag>;
          case 'tip':
            return <Tag color="#dc3545">Tip</Tag>;
          case 'gift':
            return <Tag color="#dc2244">Gift</Tag>;
          case 'message':
            return <Tag color="#46b545">Message</Tag>;
          case 'public_chat':
            return <Tag color="#46c5ae">Public Chat</Tag>;
          case 'group_chat':
            return <Tag color="#3f9c8b">Group Chat</Tag>;
          case 'private_chat':
            return <Tag color="#157160">Private Chat</Tag>;
          default: return <Tag color="default">{type}</Tag>;
        }
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(status: string) {
        switch (status) {
          case 'pending':
            return <Tag color="blue">Pending</Tag>;
          case 'success':
            return <Tag color="green">Success</Tag>;
          case 'refunded':
            return <Tag color="red">Refunded</Tag>;
          default: return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
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
