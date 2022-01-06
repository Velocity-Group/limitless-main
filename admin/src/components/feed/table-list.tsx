import { PureComponent } from 'react';
import {
  Table, Tag
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import Link from 'next/link';
import { DropdownAction } from '@components/common/dropdown-action';

interface IProps {
    dataSource: [];
    rowKey: string;
    loading: boolean;
    pagination: {};
    onChange: Function;
    deleteFeed?: Function;
}
export class TableListFeed extends PureComponent<IProps> {
  render() {
    const { deleteFeed } = this.props;
    const columns = [
      {
        title: 'Model',
        dataIndex: 'name',
        render(data, record) {
          return <span>{record?.performer?.name || record?.performer?.username || 'N/A'}</span>;
        }
      },
      {
        title: 'Description',
        dataIndex: 'text',
        render(data, record) {
          return (
            <div style={{
              whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '300px'
            }}
            >
              {record.text}
            </div>
          );
        }

      },
      {
        title: 'Type',
        dataIndex: 'type',
        render(type) {
          switch (type) {
            case 'video':
              return <Tag color="blue">Video</Tag>;
            case 'photo':
              return <Tag color="orange">Photo</Tag>;
            case 'text':
              return <Tag color="pink">Text</Tag>;
            default: return <Tag color="#936dc9">{type}</Tag>;
          }
        }
      },
      {
        title: 'PPV',
        dataIndex: 'isSale',
        render(data, record) {
          if (!record.isSale) {
            return <Tag color="red">N</Tag>;
          }
          return <Tag color="green">Y</Tag>;
        }
      },
      {
        title: 'Tokens',
        dataIndex: 'price',
        render(price: number) {
          return (
            <span>
              <img src="/coin-ico.png" alt="coin" width="15px" />
              {price.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status) {
          if (status === 'inactive') {
            return <Tag color="red">Deleted</Tag>;
          }
          return <Tag color="green">Active</Tag>;
        }
      },
      {
        title: 'Updated On',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Action',
        dataIndex: '_id',
        render: (id: string) => (
          <DropdownAction
            menuOptions={[
              {
                key: 'update',
                name: 'Update',
                children: (
                  <Link
                    href={{
                      pathname: '/feed/update',
                      query: { id }
                    }}
                    as={`/feed/update?id=${id}`}
                  >
                    <a>
                      <EditOutlined />
                      {' '}
                      Update
                    </a>
                  </Link>
                )
              },
              {
                key: 'delete',
                name: 'Delete',
                children: (
                  <span>
                    <DeleteOutlined />
                    {' '}
                    Delete
                  </span>
                ),
                onClick: () => deleteFeed(id)
              }
            ]}
          />
        )
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
