import { PureComponent } from 'react';
import {
  Table, Tag, Avatar, Statistic
} from 'antd';
import { formatDate } from '@lib/date';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
}

export class TableListTokenEarning extends PureComponent<IProps> {
  render() {
    const columns = [
      {
        title: 'Model',
        dataIndex: 'performerInfo',
        key: 'performer',
        render(performerInfo) {
          return (
            <div>
              <Avatar src={performerInfo?.avatar || '/no-avatar.png'} />
              {' '}
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
              <Avatar src={userInfo?.avatar || '/no-avatar.png'} />
              {' '}
              {userInfo?.name || userInfo?.username || 'N/A'}
            </div>
          );
        }
      },
      {
        title: 'Total Earnings',
        dataIndex: 'grossPrice',
        render(grossPrice) {
          return (
            <span>
              <Statistic
                prefix={<img alt="coin" src="/coin-ico.png" width="15px" />}
                value={grossPrice || 0}
                valueStyle={{ fontSize: 13 }}
                precision={2}
              />
            </span>
          );
        }
      },
      {
        title: 'Platform Commission %',
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
        title: 'Platform Earning',
        dataIndex: 'siteEarning',
        render(siteEarning) {
          return (
            <span>
              <Statistic
                prefix={<img alt="coin" src="/coin-ico.png" width="15px" />}
                value={siteEarning || 0}
                valueStyle={{ fontSize: 13 }}
                precision={2}
              />
            </span>
          );
        }
      },
      {
        title: 'Model Earnings',
        dataIndex: 'netPrice',
        render(netPrice) {
          return (
            <span>
              <Statistic
                prefix={<img alt="coin" src="/coin-ico.png" width="15px" />}
                value={netPrice || 0}
                valueStyle={{ fontSize: 13 }}
                precision={2}
              />
            </span>
          );
        }
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
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
            case 'stream_tip':
              return <Tag color="red">Streaming Tip</Tag>;
            case 'public_chat':
              return <Tag color="pink">Paid Streaming</Tag>;
            default: return <Tag color="#00dcff">{type}</Tag>;
          }
        }
      },
      // {
      //   title: 'Paid Status',
      //   dataIndex: 'isPaid',
      //   render(isPaid: boolean) {
      //     switch (isPaid) {
      //       case true:
      //         return <Tag color="green">Paid</Tag>;
      //       case false:
      //         return <Tag color="red">Unpaid</Tag>;
      //       default: return null;
      //     }
      //   }
      // },
      {
        title: 'Updated On',
        dataIndex: 'updatedAt',
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
