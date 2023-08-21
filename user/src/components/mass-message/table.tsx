import { IMassMessage } from '@interfaces/message';
import {
  Button, Table, Tag
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/dist/client/link';
import { IntlShape, useIntl } from 'react-intl';
import moment from 'moment';

interface IProps {
  dataSource: IMassMessage[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange: Function;
  // eslint-disable-next-line react/require-default-props
  deleteMessage?: Function;
}

export function MassMessageTable({
  dataSource, pagination, rowKey, loading, onChange, deleteMessage
}: IProps) {
  const intl: IntlShape = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'text', defaultMessage: 'Text' }),
      dataIndex: 'text',
      render(text) {
        return (
          <span>
            {text}
          </span>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'status', defaultMessage: 'Status' }),
      dataIndex: 'status',
      render(status: string) {
        switch (status) {
          case 'pending':
            return <Tag color="#FFCF00">{intl.formatMessage({ id: 'pending', defaultMessage: 'Pending' })}</Tag>;
          case 'sent':
            return <Tag color="#00c12c">{intl.formatMessage({ id: 'sent', defaultMessage: 'Sent' })}</Tag>;
          default: return <Tag color="#FFCF00">{status}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'scheduleAt', defaultMessage: 'Schedule At' }),
      dataIndex: 'scheduledAt',
      render(date: Date) {
        return <span>{moment(date).format('DD/MM/YYYY HH:mm')}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{moment(date).format('DD/MM/YYYY HH:mm')}</span>;
      }
    },
    {
      title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
      key: 'details',
      render: (record: IMassMessage) => [
        <Button className="info" key="edit" disabled={record.status === 'sent'}>
          <Link
            key="edit"
            href={{ pathname: '/model/mass-messages/update', query: { id: record._id } }}
          >
            <a>
              <EditOutlined />
            </a>
          </Link>
        </Button>,
        <Button
          key="status"
          className="danger"
          disabled={record.status === 'sent'}
          onClick={() => deleteMessage && deleteMessage(record._id)}
        >
          <DeleteOutlined />
        </Button>
      ]
    }
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      rowKey={rowKey}
      loading={loading}
      onChange={onChange.bind(this)}
    />
  );
}
