/* eslint-disable react/destructuring-assignment */
import { Table, Tag } from 'antd';
import { ITokenPackage } from 'src/interfaces/index';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { DropdownAction } from '@components/common/dropdown-action';
import { formatDate } from '@lib/date';

interface IProps {
    dataSource: ITokenPackage[];
    pagination: {};
    rowKey: string;
    onChange: Function;
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
            {price.toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Amount of Tokens',
      dataIndex: 'tokens',
      render(tokens) {
        return (
          <span>
            <img alt="coin" src="/coin-ico.png" width="15px" />
            {tokens}
          </span>
        );
      }
    },
    {
      title: 'Ordering',
      dataIndex: 'ordering',
      sorter: true
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render(isActive) {
        if (isActive) {
          return <Tag color="green">Active</Tag>;
        }

        return <Tag color="red">Inactive</Tag>;
      }
    },
    {
      title: 'Updated On',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date) {
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
      onChange={onChange.bind(this)}
      loading={loading}
    />
  );
};
