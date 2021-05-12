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
            case 'pending':
              return <Tag color="orange">Pending</Tag>;
            case 'success':
              return <Tag color="green">Success</Tag>;
            case 'refunded':
              return <Tag color="red">Refunded</Tag>;
            default: return <Tag color="red">{status}</Tag>;
          }
        }
      },
      {
        title: 'Last update',
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
