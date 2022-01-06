import { PureComponent } from 'react';
import {
  Table, Tag
} from 'antd';
import { formatDate } from '@lib/date';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
}

export class TableListPaymentTransaction extends PureComponent<IProps> {
  render() {
    const columns = [
      {
        title: 'User',
        dataIndex: 'sourceInfo',
        key: 'sourceInfo',
        render(sourceInfo) {
          return (
            <div>
              {sourceInfo?.name || sourceInfo?.username || 'N/A'}
            </div>
          );
        }
      },
      {
        title: 'Description',
        key: 'description',
        render(record: any) {
          return <span>{record?.products && record?.products[0] && record?.products[0].name}</span>;
        }
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render(type: string) {
          return <Tag color="orange">{type}</Tag>;
        }
      },
      // {
      //   title: 'Quantity',
      //   dataIndex: 'quantity',
      //   key: 'quantity',
      //   render(quantity: number) {
      //     return <span>{quantity}</span>;
      //   }
      // },
      {
        title: 'Original price',
        dataIndex: 'originalPrice',
        render(originalPrice) {
          return (
            <span>
              $
              {(originalPrice || 0).toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Discount',
        dataIndex: 'couponInfo',
        render(couponInfo, record) {
          return (
            <span>
              {`${(couponInfo?.value || 0) * 100}% - $${((couponInfo?.value || 0) * (record?.originalPrice || 0)).toFixed(2)}`}
            </span>
          );
        }
      },
      {
        title: 'End Price',
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
        title: 'Payment status',
        dataIndex: 'status',
        render(status: string) {
          switch (status) {
            case 'success':
              return <Tag color="green">Success</Tag>;
            case 'fail':
              return <Tag color="red">Fail</Tag>;
            case 'processing':
              return <Tag color="orange">Processing</Tag>;
            case 'canceled':
              return <Tag color="pink">Canceled</Tag>;
            case 'refunded':
              return <Tag color="violet">Refunded</Tag>;
            case 'created':
              return <Tag color="default">Created</Tag>;
            case 'require_authentication':
              return <Tag color="default">Require Authentication</Tag>;
            default: return <Tag color="red">{status}</Tag>;
          }
        }
      },
      {
        title: 'Updated On',
        dataIndex: 'updatedAt',
        sorter: true,
        fixed: 'right' as 'right',
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      }
    ];
    const {
      dataSource, rowKey, loading, pagination, onChange
    } = this.props;
    return (
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        onChange={onChange.bind(this)}
      />
    );
  }
}
