/* eslint-disable default-case */
import { PureComponent } from 'react';
import { Table, Tag } from 'antd';
import { formatDate } from '@lib/date';
import { IEarning } from 'src/interfaces';

interface IProps {
  dataSource: IEarning[];
  rowKey: string;
  pagination: {};
  onChange: Function;
  loading: boolean;
  isToken: boolean;
}

export class TableListEarning extends PureComponent<IProps> {
  render() {
    const {
      dataSource, rowKey, pagination, onChange, loading, isToken
    } = this.props;
    const columns = isToken ? [
      {
        title: 'User',
        dataIndex: 'userInfo',
        render(userInfo) {
          return (
            <span>
              {userInfo?.name || userInfo?.username || 'N/A'}
            </span>
          );
        }
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
            // case 'private_chat':
            //   return <Tag color="violet">Private Chat</Tag>;
            // case 'group_chat':
            //   return <Tag color="violet">Group Chat</Tag>;
            case 'public_chat':
              return <Tag color="violet">Paid Streaming</Tag>;
            case 'feed':
              return <Tag color="green">Post</Tag>;
            case 'tip':
              return <Tag color="orange">Tip</Tag>;
            case 'gift':
              return <Tag color="orange">Gift</Tag>;
            case 'message':
              return <Tag color="pink">Message</Tag>;
            case 'product':
              return <Tag color="blue">Product</Tag>;
            case 'gallery':
              return <Tag color="success">Gallery</Tag>;
            case 'stream_tip':
              return <Tag color="orange">Streaming tip</Tag>;
          }
          return <Tag color="success">{type}</Tag>;
        }
      },
      {
        title: 'GROSS',
        dataIndex: 'grossPrice',
        render(grossPrice: number, record: any) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {record.isToken ? <img alt="coin" src="/static/coin-ico.png" width="15px" /> : '$'}
              {grossPrice.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Commission',
        dataIndex: 'siteCommission',
        render(commission: number) {
          return (
            <span>
              {commission * 100}
              %
            </span>
          );
        }
      },
      {
        title: 'NET',
        dataIndex: 'netPrice',
        render(netPrice: number, record: any) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {record.isToken ? <img alt="coin" src="/static/coin-ico.png" width="15px" /> : '$'}
              {(netPrice || 0).toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span style={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</span>;
        }
      }
    ] : [
      {
        title: 'User',
        dataIndex: 'userInfo',
        render(userInfo) {
          return (
            <span>
              {userInfo?.name || userInfo?.username || 'N/A'}
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
              return <Tag color="blue">Monthly</Tag>;
            case 'yearly_subscription':
              return <Tag color="red">Yearly</Tag>;
          }
          return <Tag color="#936dc9">{type}</Tag>;
        }
      },
      {
        title: 'GROSS',
        dataIndex: 'grossPrice',
        render(grossPrice: number, record: any) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {record.isToken ? <img alt="coin" src="/static/coin-ico.png" width="15px" /> : '$'}
              {grossPrice.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Commission',
        dataIndex: 'siteCommission',
        render(commission: number) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {commission * 100}
              %
            </span>
          );
        }
      },
      {
        title: 'NET',
        dataIndex: 'netPrice',
        render(netPrice: number, record: any) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {record.isToken ? <img alt="coin" src="/static/coin-ico.png" width="15px" /> : '$'}
              {(netPrice || 0).toFixed(2)}
            </span>
          );
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
          loading={loading}
          dataSource={dataSource}
          columns={columns}
          rowKey={rowKey}
          pagination={pagination}
          onChange={onChange.bind(this)}
        />
      </div>
    );
  }
}
