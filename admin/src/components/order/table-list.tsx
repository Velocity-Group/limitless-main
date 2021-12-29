/* eslint-disable react/destructuring-assignment */
import { Table, Tag, Avatar } from 'antd';
import {
  EyeOutlined
} from '@ant-design/icons';
import { IOrder } from 'src/interfaces';
import { formatDate } from '@lib/date';
import Link from 'next/link';

interface IProps {
  dataSource: IOrder[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange: Function;
}

const OrderTableList = ({
  dataSource,
  pagination,
  rowKey,
  loading,
  onChange
}: IProps) => {
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render(orderNumber, record) {
        return <Link href={{ pathname: '/order/detail', query: { id: record._id } }}><a>{orderNumber}</a></Link>;
      }
    },
    {
      title: 'User',
      dataIndex: 'userInfo',
      key: 'userInfo',
      render(userInfo) {
        return (
          <span>
            <Avatar src={userInfo?.avatar || '/no-avatar.png'} />
            {' '}
            {`${userInfo?.name || userInfo?.username || 'N/A'}`}
          </span>
        );
      }
    },
    {
      title: 'Model',
      dataIndex: 'performerInfo',
      key: 'performerInfo',
      render(performerInfo) {
        return (
          <span>
            <Avatar src={performerInfo?.avatar || '/no-avatar.png'} />
            {' '}
            {`${performerInfo?.name || performerInfo?.username || 'N/A'}`}
          </span>
        );
      }
    },
    {
      title: 'Product',
      dataIndex: 'productInfo',
      key: 'productInfo',
      render(productInfo) {
        return (
          <span>
            {`${productInfo?.name || 'N/A'}`}
          </span>
        );
      }
    },
    {
      title: 'Tokens',
      dataIndex: 'totalPrice',
      render(totalPrice) {
        return (
          <span>
            <img src="/coin-ico.png" width="15px" alt="coin" />
            {(totalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Delivery Status',
      dataIndex: 'deliveryStatus',
      render(status: string) {
        switch (status) {
          case 'created':
            return <Tag color="gray">Created</Tag>;
          case 'processing':
            return <Tag color="#FFCF00">Processing</Tag>;
          case 'shipping':
            return <Tag color="#00dcff">Shipped</Tag>;
          case 'delivered':
            return <Tag color="#00c12c">Delivered</Tag>;
          case 'refunded':
            return <Tag color="red">Refunded</Tag>;
          default: return <Tag color="#FFCF00">{status}</Tag>;
        }
      }
    },
    {
      title: 'Updated On',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render(id: string) {
        return <Link href={{ pathname: '/order/detail', query: { id } }}><a><EyeOutlined /></a></Link>;
      }
    }
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      rowKey={rowKey}
      loading={loading}
      onChange={onChange.bind(this)}
    />
  );
};
export default OrderTableList;
