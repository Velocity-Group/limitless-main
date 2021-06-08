import { PureComponent } from 'react';
import { Table, Tag } from 'antd';
import { formatDate } from '@lib/date';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
}

export class TableListEarning extends PureComponent<IProps> {
  render() {
    const columns = [
      {
        title: 'Model',
        dataIndex: 'performerInfo',
        key: 'performer',
        render(performerInfo) {
          return (
            <div>
              {performerInfo?.name || performerInfo?.username || 'N/A'}
            </div>
          );
        }
      },
      {
        title: 'User',
        dataIndex: 'userInfo',
        key: 'user',
        render(userInfo) {
          return (
            <div>
              {userInfo?.name || userInfo?.username || 'N/A'}
            </div>
          );
        }
      },
      {
        title: 'GROSS',
        dataIndex: 'grossPrice',
        render(grossPrice, record) {
          return (
            <span>
              {record.isToken ? <img src="/coin-ico.png" width="15px" alt="coin" /> : '$'}
              {(grossPrice || 0).toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'NET',
        dataIndex: 'netPrice',
        render(netPrice, record) {
          return (
            <span>
              {record.isToken ? <img src="/coin-ico.png" width="15px" alt="coin" /> : '$'}
              {(netPrice || 0).toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Site_Commission',
        dataIndex: 'siteCommission',
        render(commission) {
          return (
            <span>
              {(commission || 0) * 100}
              %
            </span>
          );
        }
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
            case 'monthly_subscription':
              return <Tag color="#936dc9">Monthly Subscription</Tag>;
            case 'yearly_subscription':
              return <Tag color="#936dc9">Yearly Subscription</Tag>;
            case 'product':
              return <Tag color="#FFCF00">Product</Tag>;
            case 'gallery':
              return <Tag color="#FFCF00">Gallery</Tag>;
            case 'feed':
              return <Tag color="green">Post</Tag>;
            case 'tip':
              return <Tag color="#00dcff">Tip</Tag>;
            case 'video':
              return <Tag color="blue">Video</Tag>;
            default: return <Tag color="#00dcff">{type}</Tag>;
          }
        }
      },
      // {
      //   title: 'Paid status',
      //   dataIndex: 'isPaid',
      //   sorter: true,
      //   render(isPaid: boolean) {
      //     switch (isPaid) {
      //       case true:
      //         return <Tag color="green">Paid</Tag>;
      //       case false:
      //         return <Tag color="red">Unpaid</Tag>;
      //     }
      //   }
      // },
      // {
      //   title: 'Paid at',
      //   dataIndex: 'paidAt',
      //   sorter: true,
      //   render(paidAt: Date) {
      //     return <span>{formatDate(paidAt)}</span>;
      //   }
      // },
      {
        title: 'Date',
        dataIndex: 'createdAt',
        sorted: true,
        render(createdAt: Date) {
          return <span>{formatDate(createdAt)}</span>;
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
