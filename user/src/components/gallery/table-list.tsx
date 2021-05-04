/* eslint-disable default-case */
import { PureComponent } from 'react';
import { Table, Tag, Button } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import Link from 'next/link';
import { CoverGallery } from '@components/gallery/cover-gallery';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  deleteGallery?: Function;
}

export class TableListGallery extends PureComponent<IProps> {
  render() {
    const {
      dataSource,
      rowKey,
      loading,
      pagination,
      onChange,
      deleteGallery
    } = this.props;
    const columns = [
      {
        title: '',
        render(data, record) {
          return <CoverGallery gallery={record} />;
        }
      },
      {
        title: 'Title',
        dataIndex: 'title'
      },
      {
        title: 'For sale?',
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
        title: 'Amount of Tokens',
        dataIndex: 'price'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status: string) {
          switch (status) {
            case 'active':
              return <Tag color="green">Active</Tag>;
            case 'inactive':
              return <Tag color="#FFCF00">Inactive</Tag>;
            default: return <Tag color="#FFCF00">{status}</Tag>;
          }
        }
      },
      {
        title: 'Last update',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Actions',
        dataIndex: '_id',
        render: (data, record) => (
          <div>
            <Button className="secondary-custom">
              <Link
                href={{
                  pathname: '/model/my-photo/upload',
                  query: {
                    galleryId: record._id
                  }
                }}
              >
                <a>
                  <PlusOutlined />
                  {' '}
                  Add photos
                </a>
              </Link>
            </Button>
            <Button className="info">
              <Link
                href={{
                  pathname: '/model/my-gallery/update',
                  query: { id: record._id }
                }}
              >
                <a>
                  <EditOutlined />
                  {' '}
                  Edit
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
