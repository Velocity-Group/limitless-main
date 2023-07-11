import { PureComponent } from 'react';
import {
  Table, Button, Tag, Tooltip, Empty
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import Link from 'next/link';
import { ImageProduct } from '@components/product/image-product';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  deleteProduct?: Function;
  intl: IntlShape
}

class TableListProduct extends PureComponent<IProps> {
  render() {
    const {
      dataSource,
      rowKey,
      loading,
      pagination,
      onChange,
      deleteProduct,
      intl
    } = this.props;
    const columns = [
      {
        title: intl.formatMessage({ id: 'thumbnail', defaultMessage: 'Thumbnail' }),
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
        title: intl.formatMessage({ id: 'name', defaultMessage: 'Name' }),
        dataIndex: 'name',
        render(name: string, record: any) {
          return (
            <Tooltip title={intl.formatMessage({ id: 'name', defaultMessage: 'Name' })}>
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
        title: intl.formatMessage({ id: 'price', defaultMessage: 'Price' }),
        dataIndex: 'price',
        render(price: number) {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              $
              {(price && price.toFixed(2)) || 0}
            </span>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'stock', defaultMessage: 'Stock' }),
        dataIndex: 'stock',
        render(stock: number, record) {
          return <span>{(record.type === 'physical' && intl.formatMessage({ id: 'stock', defaultMessage: 'Stock' })) || ''}</span>;
        }
      },
      {
        title: intl.formatMessage({ id: 'type', defaultMessage: 'Type' }),
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
            case 'physical':
              return <Tag color="#007bff">{intl.formatMessage({ id: 'physical', defaultMessage: 'Physical' })}</Tag>;
            case 'digital':
              return <Tag color="#ff0066">{intl.formatMessage({ id: 'digital', defaultMessage: 'Digital' })}</Tag>;
            default:
              break;
          }
          return <Tag color="orange">{type}</Tag>;
        }
      },
      {
        title: intl.formatMessage({ id: 'status', defaultMessage: 'Status' }),
        dataIndex: 'status',
        render(status: string) {
          switch (status) {
            case 'active':
              return <Tag color="success">{intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}</Tag>;
            case 'inactive':
              return <Tag color="orange">{intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}</Tag>;
            default:
              break;
          }
          return <Tag color="default">{status}</Tag>;
        }
      },
      {
        title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
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
          locale={{
            emptyText: <Empty
              description={intl.formatMessage({ id: 'emptyData', defaultMessage: 'No Data' })}
            />
          }}
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

export default injectIntl(TableListProduct);
