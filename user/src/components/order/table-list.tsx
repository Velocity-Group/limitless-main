/* eslint-disable react/destructuring-assignment */
import {
  Empty, Table, Tag, Tooltip
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { IOrder, IUser } from 'src/interfaces';
import { formatDate } from '@lib/date';
import Link from 'next/link';
import { useIntl } from 'react-intl';

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
  const intl = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'id', defaultMessage: 'ID' }),
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
      title: intl.formatMessage({ id: 'product', defaultMessage: 'Product' }),
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
      title: intl.formatMessage({ id: 'price', defaultMessage: 'Price' }),
      dataIndex: 'totalPrice',
      render(totalPrice) {
        return (
          <span>
            $
            {(totalPrice || 0).toFixed(2)}
          </span>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'deliveryStatus', defaultMessage: 'Delivery Status' }),
      dataIndex: 'deliveryStatus',
      render(status: string) {
        switch (status) {
          case 'created':
            return <Tag color="gray">{intl.formatMessage({ id: 'created', defaultMessage: 'Created' })}</Tag>;
          case 'processing':
            return <Tag color="#FFCF00">{intl.formatMessage({ id: 'processing', defaultMessage: 'Processing' })}</Tag>;
          case 'shipping':
            return <Tag color="#00dcff">{intl.formatMessage({ id: 'shipping', defaultMessage: 'Shipping' })}</Tag>;
          case 'delivered':
            return <Tag color="#00c12c">{intl.formatMessage({ id: 'delivered', defaultMessage: 'Delivered' })}</Tag>;
          case 'refunded':
            return <Tag color="red">{intl.formatMessage({ id: 'refunded', defaultMessage: 'Refunded' })}</Tag>;
          default: return <Tag color="#FFCF00">{status}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
      dataIndex: '_id',
      render(id: string) {
        return (
          <Link href={{ pathname: user.isPerformer ? '/model/my-order/detail' : '/user/orders/detail', query: { id } }}>
            <a>
              <EyeOutlined />
              {' '}
              {intl.formatMessage({ id: 'view', defaultMessage: 'view' })}
            </a>
          </Link>
        );
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        locale={{
          emptyText: <Empty
            description={intl.formatMessage({ id: 'emptyData', defaultMessage: 'No Data' })}
          />
        }}
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
