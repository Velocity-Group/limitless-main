/* eslint-disable default-case */
import { PureComponent } from 'react';
import { Table, Tag } from 'antd';
import { formatDate } from '@lib/date';
import { IEarning } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  dataSource: IEarning[];
  rowKey: string;
  pagination: {};
  onChange: Function;
  loading: boolean;
  intl: IntlShape
}

class TableListEarning extends PureComponent<IProps> {
  render() {
    const {
      dataSource, rowKey, pagination, onChange, loading, intl
    } = this.props;
    const columns = [
      {
        title: intl.formatMessage({ id: 'user', defaultMessage: 'User' }),
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
        title: intl.formatMessage({ id: 'type', defaultMessage: 'Type' }),
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
            case 'monthly_subscription':
              return <Tag color="red">{intl.formatMessage({ id: 'monthly', defaultMessage: 'Monthly' })}</Tag>;
            case 'yearly_subscription':
              return <Tag color="red">{intl.formatMessage({ id: 'Yearly', defaultMessage: 'Yearly' })}</Tag>;
            case 'public_chat':
              return <Tag color="violet">{intl.formatMessage({ id: 'paidStreaming', defaultMessage: 'Paid streaming' })}</Tag>;
            case 'feed':
              return <Tag color="green">{intl.formatMessage({ id: 'post', defaultMessage: 'Post' })}</Tag>;
            case 'tip':
              return <Tag color="orange">{intl.formatMessage({ id: 'tip', defaultMessage: 'Tip' })}</Tag>;
            case 'gift':
              return <Tag color="orange">{intl.formatMessage({ id: 'gift', defaultMessage: 'Gift' })}</Tag>;
            case 'message':
              return <Tag color="pink">{intl.formatMessage({ id: 'message', defaultMessage: 'Message' })}</Tag>;
            case 'product':
              return <Tag color="blue">{intl.formatMessage({ id: 'product', defaultMessage: 'Product' })}</Tag>;
            case 'gallery':
              return <Tag color="success">{intl.formatMessage({ id: 'gallery', defaultMessage: 'Gallery' })}</Tag>;
            case 'stream_tip':
              return <Tag color="orange">{intl.formatMessage({ id: 'streamingTip', defaultMessage: 'Streaming tip' })}</Tag>;
          }
          return <Tag color="success">{type}</Tag>;
        }
      },
      {
        title: intl.formatMessage({ id: 'gross', defaultMessage: 'GROSS' }),
        dataIndex: 'grossPrice',
        render(grossPrice: number) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              $
              {grossPrice.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'commission', defaultMessage: 'Commission' }),
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
        title: intl.formatMessage({ id: 'net', defaultMessage: 'NET' }),
        dataIndex: 'netPrice',
        render(netPrice: number) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              $
              {(netPrice || 0).toFixed(2)}
            </span>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'date', defaultMessage: 'Date' }),
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span style={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</span>;
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

export default injectIntl(TableListEarning);
