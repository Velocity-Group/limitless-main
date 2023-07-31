/* eslint-disable react/destructuring-assignment */
import {
  Table, Tag, Tooltip, Button
} from 'antd';
import {
  AudioOutlined, FileImageOutlined, VideoCameraOutlined, DeleteOutlined,
  EditOutlined, PushpinOutlined, PushpinFilled
} from '@ant-design/icons';
import Link from 'next/link';
import { IFeed } from 'src/interfaces';
import { formatDate } from 'src/lib';
import { useIntl } from 'react-intl';

interface IProps {
  feeds: IFeed[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange: Function;
  onDelete: Function;
  onPin: Function;
}

const FeedList = ({
  feeds,
  searching,
  total,
  pageSize,
  onChange,
  onDelete,
  onPin
}: IProps) => {
  const intl = useIntl();

  const columns = [
    {
      title: intl.formatMessage({ id: 'postType', defaultMessage: 'Post Type' }),
      key: 'id',
      render: (record) => {
        const images = record.files && record.files.filter((f) => f.type === 'feed-photo');
        return (
          <Link
            href={{
              pathname: '/post',
              query: {
                id: record.slug || record._id
              }
            }}
            as={`/post/${record.slug || record._id}`}
          >
            <a style={{ fontSize: 16 }}>
              {record.type === 'photo' && (
                <span>
                  {images.length || 1}
                  {' '}
                  <FileImageOutlined />
                  {' '}
                </span>
              )}
              {record.type === 'video' && (
                <span>
                  <VideoCameraOutlined />
                </span>
              )}
              {record.type === 'audio' && (
                <span>
                  <AudioOutlined />
                </span>
              )}
              {record.type === 'text' && (
                <span>
                  Aa
                </span>
              )}
            </a>
          </Link>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'description', defaultMessage: 'Description' }),
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => (
        <Tooltip title={text}>
          <div style={{
            width: 150, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
          }}
          >
            {text}
          </div>
        </Tooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'pinned', defaultMessage: 'Pinned' }),
      dataIndex: 'isPinned',
      key: 'isPinned',
      render: (isPinned: boolean) => {
        switch (isPinned) {
          case true:
            return <Tag color="blue">Y</Tag>;
          case false:
            return <Tag color="red">N</Tag>;
          default: return <Tag color="blue">{isPinned}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'status', defaultMessage: 'Status' }),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        switch (status) {
          case 'active':
            return <Tag color="green">{intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}</Tag>;
          case 'inactive':
            return <Tag color="orange">{intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}</Tag>;
          default: return <Tag color="blue">{status}</Tag>;
        }
      }
    },
    {
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      key: 'updatedAt',
      dataIndex: 'updatedAt',
      render: (updatedAt: Date) => <span>{formatDate(updatedAt)}</span>,
      sorter: true
    },
    {
      title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
      key: 'details',
      render: (record: IFeed) => [
        <Button className="secondary-custom" key="pin" onClick={() => onPin(record)}>
          {record.isPinned ? <PushpinFilled /> : <PushpinOutlined />}
        </Button>,
        <Button className="info" key="edit">
          <Link
            key="edit"
            href={{ pathname: '/model/my-post/edit', query: { id: record._id } }}
          >
            <a>
              <EditOutlined />
            </a>
          </Link>
        </Button>,
        <Button
          key="status"
          className="danger"
          onClick={() => onDelete(record)}
        >
          <DeleteOutlined />
        </Button>
      ]
    }
  ];
  const dataSource = feeds.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      rowKey="_id"
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange.bind(this)}
    />
  );
};
FeedList.defaultProps = {};
export default FeedList;
