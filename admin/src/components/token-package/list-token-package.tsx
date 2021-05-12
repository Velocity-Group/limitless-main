import { Table, Tag } from 'antd';
import { IToken } from 'src/interfaces/token-package';
// import { formatDate, formatDateNoTime } from '@lib/date';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { DropdownAction } from '@components/common/dropdown-action';

interface IProps {
    dataSource: IToken[];
    pagination: {};
    rowKey: string;
    onChange(): Function;
    loading: boolean;
    deleteToken : Function;
}

export const TableListToken = ({
  dataSource, pagination, rowKey, onChange, loading, deleteToken
}: IProps) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name'
    },
    {
      title: 'Price',
      dataIndex: 'price',
      render(price) {
        return (
          <span>
            $
            {price}
          </span>
        );
      }
    },
    {
      title: 'No of Tokens',
      dataIndex: 'tokens'
    },
    {
      title: 'Ordering',
      dataIndex: 'ordering'
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render(isActive) {
        if (isActive) {
          return <Tag color="green">Active</Tag>;
        }

        return <Tag color="red">Deactived</Tag>;
      }
    },
    {
      title: 'Actions',
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
                    pathname: '/token-package/update',
                    query: { id }
                  }}
                  as={`/token-package/update?id=${id}`}
                >
                  <a>
                    <EditOutlined />
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
                  Delete
                </span>
              ),
              onClick: () => deleteToken && deleteToken(id)
            }
          ]}
        />
      )
    }
  ];
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      pagination={pagination}
      onChange={onChange}
      loading={loading}
    />
  );
};
