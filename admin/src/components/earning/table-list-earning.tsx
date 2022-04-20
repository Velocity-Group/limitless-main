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
        title: 'GROSS',
        dataIndex: 'grossPrice',
        render(grossPrice) {
          return (
            <span>
              <Statistic
                prefix="$"
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
                prefix="$"
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
                prefix="$"
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
            case 'monthly_subscription':
              return <Tag color="blue">Monthly Sub</Tag>;
            case 'yearly_subscription':
              return <Tag color="red">Yearly Sub</Tag>;
            default: return <Tag color="#00dcff">{type}</Tag>;
          }
        }
      },
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
