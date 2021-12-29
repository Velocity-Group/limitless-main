import { PureComponent } from 'react';
import {
  Table, Button, Tag, Tooltip
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import Link from 'next/link';
import { ImageProduct } from '@components/product/image-product';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  deleteProduct?: Function;
}

export class TableListProduct extends PureComponent<IProps> {
  render() {
    const {
      dataSource,
      rowKey,
      loading,
      pagination,
      onChange,
      deleteProduct
    } = this.props;
    const columns = [
      {
        title: 'Thumbnail',
        dataIndex: 'image',
        render(data, record) {
          return (
            <Link
              href={{ pathname: '/store', query: { id: record.slug || record._id } }}
              as={`/store/${record.slug || record._id}`}
            >
              <a><ImageProduct product={record} /></a>
            </Link>
          );
        }
      },
      {
        title: 'Name',
        dataIndex: 'name',
        render(name: string, record: any) {
          return (
            <Tooltip title={name}>
              <div style={{
                maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}
              >
                <Link href={{ pathname: '/store', query: { id: record.slug || record._id } }} as={`/store/${record.slug || record._id}`}>
                  <a>{name}</a>
                </Link>
              </div>
            </Tooltip>
          );
        }
      },
      {
        title: 'Tokens',
        dataIndex: 'price',
        render(price: number) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              <img alt="token" src="/static/coin-ico.png" height="20px" />
              {' '}
              {(price && price.toFixed(2)) || 0}
            </span>
          );
        }
      },
      {
        title: 'Stock',
        dataIndex: 'stock',
        render(stock: number, record) {
          return <span>{(record.type === 'physical' && stock) || ''}</span>;
        }
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
            case 'physical':
              return <Tag color="#007bff">Physical</Tag>;
            case 'digital':
              return <Tag color="#ff0066">Digital</Tag>;
            default:
              break;
          }
          return <Tag color="orange">{type}</Tag>;
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status: string) {
          switch (status) {
            case 'active':
              return <Tag color="success">Active</Tag>;
            case 'inactive':
              return <Tag color="orange">Inactive</Tag>;
            default:
              break;
          }
          return <Tag color="default">{status}</Tag>;
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
          <div style={{ whiteSpace: 'nowrap' }}>
            <Button className="info">
              <Link
                href={{
                  pathname: '/model/my-store/update',
                  query: { id }
                }}
                as={`/model/my-store/update?id=${id}`}
              >
                <a>
                  <EditOutlined />
                </a>
              </Link>
            </Button>
            <Button
              className="danger"
              onClick={() => deleteProduct(id)}
            >
              <DeleteOutlined />
            </Button>
          </div>
        )
      }
    ];
    return (
      <div className="table-responsive">
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey={rowKey}
          loading={loading}
          pagination={pagination}
          onChange={onChange.bind(this)}
        />
      </div>
    );
  }
}
