import { PureComponent } from 'react';
import {
  Table, Tag, Button, Empty
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import Link from 'next/link';
import { CoverGallery } from '@components/gallery/cover-gallery';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  deleteGallery?: Function;
  intl: IntlShape
}

class TableListGallery extends PureComponent<IProps> {
  render() {
    const {
      dataSource,
      rowKey,
      loading,
      pagination,
      onChange,
      deleteGallery,
      intl
    } = this.props;
    const columns = [
      {
        title: `${intl.formatMessage({ id: 'thumbnail', defaultMessage: 'Thumbnail' })}`,
        render(data, record) {
          return (
            <Link
              href={{
                pathname: `/gallery/${record?.slug || record?._id}`,
                query: { id: record._id }
              }}
              as={`/gallery/${record?.slug || record?._id}`}
            >
              <a><CoverGallery gallery={record} /></a>
            </Link>
          );
        }
      },
      {
        title: `${intl.formatMessage({ id: 'title', defaultMessage: 'Title' })}`,
        dataIndex: 'title',
        render(title, record) {
          return (
            <div style={{
              maxWidth: 150, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
            }}
            >
              <Link
                href={{
                  pathname: `/gallery/${record?.slug || record?._id}`,
                  query: { id: record._id }
                }}
                as={`/gallery/${record?.slug || record?._id}`}
              >
                <a>{title}</a>
              </Link>
            </div>
          );
        }
      },
      {
        title: `${intl.formatMessage({ id: 'ppv', defaultMessage: 'PPV' })}`,
        dataIndex: 'isSale',
        render(isSale: boolean) {
          switch (isSale) {
            case true:
              return <Tag color="green">Y</Tag>;
            case false:
              return <Tag color="#FFCF00">N</Tag>;
            default: return <Tag color="#FFCF00">{isSale}</Tag>;
          }
        }
      },
      {
        title: `${intl.formatMessage({ id: 'totalPhotos', defaultMessage: 'Total photos' })}`,
        dataIndex: 'numOfItems'
      },
      {
        title: `${intl.formatMessage({ id: 'status', defaultMessage: 'Status' })}`,
        dataIndex: 'status',
        render(status: string) {
          switch (status) {
            case 'active':
              return <Tag color="green">{intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}</Tag>;
            case 'inactive':
              return <Tag color="orange">{intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}</Tag>;
            default: return <Tag color="#FFCF00">{status}</Tag>;
          }
        }
      },
      {
        title: `${intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' })}`,
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: `${intl.formatMessage({ id: 'action', defaultMessage: 'Action' })}`,
        dataIndex: '_id',
        render: (data, record) => (
          <div style={{ whiteSpace: 'nowrap' }}>
            <Button className="info">
              <Link
                href={{
                  pathname: '/model/my-gallery/update',
                  query: { id: record._id }
                }}
              >
                <a>
                  <EditOutlined />
                </a>
              </Link>
            </Button>
            <Button
              onClick={() => deleteGallery && deleteGallery(record._id)}
              className="danger"
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
          // eslint-disable-next-line react/jsx-no-bind
          onChange={onChange.bind(this)}
        />
      </div>
    );
  }
}

export default injectIntl(TableListGallery);
