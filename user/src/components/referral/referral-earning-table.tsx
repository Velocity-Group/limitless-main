import { IReferral } from '@interfaces/referral';
import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  dataSource: IReferral[];
  loading: boolean;
  rowKey: string;
  onChange: Function;
  pagination: { total, pageSize}
}

function TableListReferralEarning({
  dataSource, loading, rowKey, onChange, pagination
}: IProps) {
  const intl: IntlShape = useIntl();
  const columns = [
    {
      title: intl.formatMessage({ id: 'grossPrice', defaultMessage: 'Gross price' }),
      render(data, record) {
        return (
          <span>
            $
            {record?.grossPrice}
          </span>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'commissionRate', defaultMessage: 'Commission Rate' }),
      render(data, record) {
        return (
          <span>
            {(record?.referralCommission || 0) * 100}
            %
          </span>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'commission', defaultMessage: 'Commission' }),
      dataIndex: 'netPrice',
      render(netPrice: number) {
        return (
          <Tag color="green">
            +
            $
            {(netPrice || 0).toFixed(2)}
          </Tag>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'name', defaultMessage: 'Name' }),
      render(data, record) {
        return (
          <span>{record?.registerInfo?.name}</span>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'role', defaultMessage: 'Role' }),
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
      title: intl.formatMessage({ id: 'updatedOn', defaultMessage: 'Updated On' }),
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        onChange={onChange.bind(this)}
        pagination={pagination.total <= pagination.pageSize ? false : pagination}
      />
    </div>
  );
}

export default TableListReferralEarning;
