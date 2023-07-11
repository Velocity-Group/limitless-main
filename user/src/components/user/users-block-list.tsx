import {
  Table, Button, Tooltip, Avatar, Empty
} from 'antd';
import { formatDate } from '@lib/date';
import '../../../pages/model/block-user/index.less';
import { useIntl } from 'react-intl';

interface IProps {
  items: any[];
  searching: boolean;
  total: number;
  pageSize: number;
  onPaginationChange: Function;
  unblockUser: Function;
  submiting: boolean;
}

const UsersBlockList = ({
  items,
  searching,
  total,
  pageSize,
  onPaginationChange,
  unblockUser,
  submiting
}: IProps) => {
  const intl = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'student', defaultMessage: 'Student' }),
      dataIndex: 'targetInfo',
      key: 'targetInfo',
      render: (targetInfo: any) => (
        <span>
          {/* eslint-disable-next-line react/destructuring-assignment */}
          <Avatar src={targetInfo?.avatar || '/static/no-avatar.png'} size={28} />
          {' '}
          {/* eslint-disable-next-line react/destructuring-assignment */}
          {targetInfo?.name || targetInfo?.username || 'N/A'}
        </span>
      )
    },
    {
      title: intl.formatMessage({ id: 'reason', defaultMessage: 'Reason' }),
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: any) => (
        <Tooltip title={reason}>
          <div style={{
            maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}
          >
            {reason}
          </div>
        </Tooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'date', defaultMessage: 'Date' }),
      key: 'createdAt',
      dataIndex: 'createdAt',
      render: (createdAt: Date) => <span>{formatDate(createdAt)}</span>
      // sorter: true
    },
    {
      title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
      key: '_id',
      render: (item) => (
        <Button
          className="unblock-user"
          type="primary"
          disabled={submiting}
          onClick={() => unblockUser(item.targetId)}
        >
          {intl.formatMessage({ id: 'unblock', defaultMessage: 'Unblock' })}
        </Button>
      )
    }
  ];
  const dataSource = items.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      locale={{
        emptyText: <Empty
          description={intl.formatMessage({ id: 'emptyData', defaultMessage: 'No Data' })}
        />
      }}
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      scroll={{ x: true }}
      loading={searching}
      onChange={onPaginationChange.bind(this)}
    />
  );
};
UsersBlockList.defaultProps = {};
export default UsersBlockList;
