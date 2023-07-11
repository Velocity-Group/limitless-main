import { DropdownAction } from '@components/common';
import PageHeading from '@components/common/page-heading';
import { getResponseError } from '@lib/utils';
import { streamRequestService } from '@services/stream-request.service';
import {
  Layout, message, Table, TablePaginationConfig
} from 'antd';
import { useEffect, useState } from 'react';
import {
  DeleteOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { IntlShape, useIntl } from 'react-intl';

function LiveStreamingScheduleListing() {
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
      const resp = await streamRequestService.searchByUser(filterQuery);
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

  const remove = async (record: any) => {
    try {
      await streamRequestService.delete(record._id);
      const index = requests.findIndex((request) => request._id === record._id);
      const data = [...requests];
      data.splice(index, 1);
      setRequests(data);
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
      title: intl.formatMessage({ id: 'performer', defaultMessage: 'Performer' }),
      render: (record: any) => record?.performerInfo?.username,
      key: 'performer'
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
                    pathname: '/streaming/private',
                    query: {
                      key: record._id
                    }
                  }}
                  as={`/streaming/private/play?key=${record._id}`}
                >
                  <a>
                    {intl.formatMessage({ id: 'start', defaultMessage: 'Start' })}
                  </a>
                </Link>
              )
            },
            {
              key: 'view-photo',
              name: intl.formatMessage({ id: 'delete', defaultMessage: 'Delete' }),
              children: (
                <>
                  <a
                    href="#"
                    onClick={() => {
                      remove(record);
                    }}
                  >
                    <DeleteOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
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

LiveStreamingScheduleListing.authenticate = true;

export default LiveStreamingScheduleListing;
