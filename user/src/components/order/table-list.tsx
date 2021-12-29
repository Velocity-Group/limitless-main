/* eslint-disable react/destructuring-assignment */
import { Table, Tag, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { IOrder, IUser } from 'src/interfaces';
import { formatDate } from '@lib/date';
import Link from 'next/link';

interface IProps {
  dataSource: IOrder[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange: Function;
  user: IUser;
}

const OrderTableList = ({
  dataSource,
  pagination,
  rowKey,
  loading,
  onChange,
  user
}: IProps) => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render(orderNumber, record) {
        return (
          <Link href={{ pathname: user.isPerformer ? '/model/my-order/detail' : '/user/orders/detail', query: { id: record._id } }}>
            <a>
              {orderNumber || 'N/A'}
            </a>
          </Link>
        );
      }
    },
    {
      title: 'Product',
      dataIndex: 'productInfo',
      key: 'productInfo',
      render(product) {
        return (
          <Tooltip title={product?.name}>
            <div style={{
              maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}
            >
              <Link href={{ pathname: '/store', query: { id: product?.slug || product?._id } }} as={`/store/${product?.slug || product?._id}`}>
                <a>{product?.name}</a>
              </Link>
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Tokens',
      dataIndex: 'totalPrice',
      render(totalPrice) {
        return (
          <span>
            <img alt="coin" src="/static/coin-ico.png" width="15px" />
            {(totalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Delivery status',
      dataIndex: 'deliveryStatus',
      render(status: string) {
        switch (status) {
          case 'created':
            return <Tag color="gray">Created</Tag>;
          case 'processing':
            return <Tag color="#FFCF00">Processing</Tag>;
          case 'shipping':
            return <Tag color="#00dcff">Shipping</Tag>;
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
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render(id: string) {
        return (
          <Link href={{ pathname: user.isPerformer ? '/model/my-order/detail' : '/user/orders/detail', query: { id } }}>
            <a>
              <EyeOutlined />
              {' '}
              view
            </a>
          </Link>
        );
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

export default OrderTableList;
