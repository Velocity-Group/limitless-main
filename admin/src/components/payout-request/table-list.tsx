import { PureComponent } from 'react';
import {
  Table, Tag, Button
} from 'antd';
import {
  EyeOutlined, DeleteOutlined
} from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { IPayoutRequest } from 'src/interfaces';
import Link from 'next/link';

interface IProps {
  dataSource: any[];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  onDelete: Function;
}

export class RequestPayoutTable extends PureComponent<IProps> {
  render() {
    const {
      dataSource, rowKey, loading, pagination, onChange, onDelete
    } = this.props;
    const columns = [
      {
        title: 'Performer',
        dataIndex: 'performerId',
        key: 'performerId',
        render(data, record: IPayoutRequest) {
          return (
            <span>
              {record?.sourceInfo?.name || record?.sourceInfo?.username || 'N/A'}
            </span>
          );
        }
      },
      {
        title: 'Request Tokens',
        dataIndex: 'requestTokens',
        key: 'requestTokens'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render(status: string) {
          switch (status) {
            case 'approved': return <Tag color="blue">Approved</Tag>;
            case 'pending': return <Tag color="warning">Pending</Tag>;
            case 'rejected': return <Tag color="volcano">Rejected</Tag>;
            case 'done': return <Tag color="green">Done</Tag>;
            default: return <Tag color="green">{status}</Tag>;
          }
        }
      },
      {
        title: 'Created at',
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },

      {
        title: 'Updated at',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Actions',
        dataIndex: '_id',
        render(id: string, record) {
          return [
            <Link key="view" href={{ pathname: '/payout-request/detail', query: { id } }} as={`/payout-request/detail?id=${id}`}><Button><EyeOutlined /></Button></Link>,
            <Button style={{ margin: '0 5px' }} disabled={['done', 'rejected'].includes(record.status)} key="delete" onClick={() => onDelete(record)}><DeleteOutlined /></Button>
          ];
        }
      }
    ];
    return (
      <Table
        dataSource={dataSource}
        columns={columns as any}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        onChange={onChange.bind(this)}
      />
    );
  }
}
