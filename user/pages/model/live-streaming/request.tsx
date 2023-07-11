import { DropdownAction } from '@components/common';
import PageHeading from '@components/common/page-heading';
import { getResponseError } from '@lib/utils';
import { streamRequestService } from '@services/stream-request.service';
import {
  Layout, message, Table, TablePaginationConfig
} from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IntlShape, useIntl } from 'react-intl';

function MyLiveStreamingScheduleListing() {
  const [filterQuery, setFilterQuery] = useState({
    limit: 10,
    offset: 0
  });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    total: 0,
    pageSize: 10
  });
  const [requests, setRequests] = useState([]);
  const intl: IntlShape = useIntl();

  const search = async () => {
    try {
      const resp = await streamRequestService.searchByPerformer(filterQuery);
      setPagination((values) => ({ ...values, total: resp.data.total }));
      setRequests(resp.data.data);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  const onChange = (data: TablePaginationConfig) => {
    setPagination(data);
    setFilterQuery((query) => ({
      ...query,
      offset: (data.current - 1) * data.pageSize
    }));
  };

  const approve = async (record: any) => {
    try {
      await streamRequestService.approve(record._id);
      setRequests((values) => values.map((value) => {
        if (value._id === record._id) {
          return {
            ...value,
            status: 'approved'
          };
        }

        return value;
      }));
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  const reject = async (record: any) => {
    try {
      await streamRequestService.reject(record._id);
      setRequests((values) => values.map((value) => {
        if (value._id === record._id) {
          return {
            ...value,
            status: 'rejected'
          };
        }

        return value;
      }));
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  useEffect(() => {
    search();
  }, [filterQuery]);

  const columns = [
    {
      title: intl.formatMessage({ id: 'username', defaultMessage: 'Username' }),
      render: (record: any) => record?.userInfo?.username,
      key: 'username'
    },
    {
      title: intl.formatMessage({ id: 'balance', defaultMessage: 'Balance' }),
      render: (record: any) => record?.userInfo?.balance,
      key: 'balance'
    },
    {
      title: intl.formatMessage({ id: 'date', defaultMessage: 'Date' }),
      dataIndex: 'startAt',
      key: 'startAt'
    },
    {
      title: intl.formatMessage({ id: 'timezone', defaultMessage: 'Timezone' }),
      dataIndex: 'timezone',
      key: 'timezone'
    },
    {
      title: intl.formatMessage({ id: 'status', defaultMessage: 'Status' }),
      dataIndex: 'status',
      key: 'status'
    },
    {
      title: '#',
      key: 'action',
      render: (record) => (
        <DropdownAction
          menuOptions={[
            {
              key: 'start-request',
              name: intl.formatMessage({ id: 'startRequest', defaultMessage: 'Start Request' }),
              children: (
                <Link
                  href={{
                    pathname: '/model/live/private',
                    query: {
                      key: record._id
                    }
                  }}
                  as={`/model/live/private?key=${record._id}`}
                >
                  <a>
                    {intl.formatMessage({ id: 'start', defaultMessage: 'Start' })}
                  </a>
                </Link>
              )
            },
            {
              key: 'approve-request',
              name: intl.formatMessage({ id: 'approveRequest', defaultMessage: 'Approve Request' }),
              children: (
                <>
                  <a
                    href="#"
                    onClick={() => {
                      approve(record);
                    }}
                  >
                    {intl.formatMessage({ id: 'approve', defaultMessage: 'Approve' })}
                  </a>
                </>
              )
            },
            {
              key: 'reject-request',
              name: intl.formatMessage({ id: 'rejectRequest', defaultMessage: 'Reject Request' }),
              children: (
                <>
                  <a
                    href="#"
                    onClick={() => {
                      reject(record);
                    }}
                  >
                    {intl.formatMessage({ id: 'reject', defaultMessage: 'Reject' })}
                  </a>
                </>
              )
            }
          ]}
        />
      )
    }
  ];

  return (
    <Layout>
      <div className="main-container">
        <PageHeading title={intl.formatMessage({ id: 'liveStreamingSchedule', defaultMessage: 'Live Streaming Schedule' })} />
        <Table
          rowKey="_id"
          dataSource={requests}
          columns={columns}
          pagination={pagination}
          onChange={onChange}
        />
      </div>
    </Layout>
  );
}

MyLiveStreamingScheduleListing.authenticate = true;
MyLiveStreamingScheduleListing.onlyPerformer = true;

export default MyLiveStreamingScheduleListing;
