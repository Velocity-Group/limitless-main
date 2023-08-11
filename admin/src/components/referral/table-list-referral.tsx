import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  rowKey: string,
  loading: boolean,
  dataSource: [],
  pagination: {},
  onChange: Function
}

function TableListReferral({
  dataSource, rowKey, loading, pagination, onChange
}: IProps) {
  const columns = [
    {
      title: 'Referred person',
      render(data, record) {
        return <span>{record?.registerInfo.name || record?.registerInfo.username}</span>;
      }
    },
    {
      title: 'Presenter',
      render(data, record) {
        return <span>{record?.referralInfo.name || record?.referralInfo.username}</span>;
      }
    },
    {
      title: 'Role',
      render(data, record) {
        switch (record?.registerSource) {
          case 'performer':
            return <Tag color="cyan">Model</Tag>;
          case 'user':
            return <Tag color="geekblue">Fan</Tag>;
          default: return <Tag color="default">{record?.registerSource}</Tag>;
        }
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    }
  ];
  return (
    <Table
      rowKey={rowKey}
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      pagination={pagination}
      onChange={onChange.bind(this)}
    />
  );
}

export default TableListReferral;
