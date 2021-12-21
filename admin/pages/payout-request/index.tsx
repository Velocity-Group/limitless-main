import {
  message
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { SearchFilter } from '@components/common/search-filter';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { getResponseError } from 'src/lib/utils';
import { RequestPayoutTable } from '@components/payout-request/table-list';
import { IPayoutRequest } from 'src/interfaces';
import { payoutRequestService } from 'src/services';

interface IProps {}
interface IStates {
  loading: boolean;
  data: IPayoutRequest[];
  pagination: {
    total: number;
    pageSize: number;
  };
  sort: {
    sortBy: string;
    sorter: string;
  };
  filter: any;
  offset: number;
  query?: {};
  status?: string;
}

class PayoutRequestPage extends PureComponent<IProps, IStates> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: true,
      data: [],
      offset: 0,
      pagination: {
        total: 0,
        pageSize: 10
      },
      sort: {
        sortBy: 'updatedAt',
        sorter: 'desc'
      },
      filter: {}
    };
  }

  componentDidMount() {
    this.getList();
  }

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.getList();
  }

  async onHandleTabChange(pagination, filters, sorter) {
    const { sort, pagination: pager } = this.state;
    await this.setState({
      offset: (pagination.current - 1) * pager.pageSize,
      sort: {
        ...sort,
        sortBy: sorter.field,
        sorter: sorter.order === 'ascend' ? 'asc' : 'desc'
      }
    });
    this.getList();
  }

  async onDelete(request: IPayoutRequest) {
    try {
      if (!window.confirm('Are you sure to delete this payout request?')) return;
      if (request.status !== 'pending') {
        message.error('Could not delete if status is not PENDING');
        return;
      }
      await payoutRequestService.delete(request._id);
      this.getList();
    } catch (e) {
      this.showError(e);
    }
  }

  async getList() {
    const {
      filter,
      offset,
      pagination,
      sort,
      query
    } = this.state;
    try {
      const resp = await payoutRequestService.search({
        ...filter,
        ...sort,
        offset,
        ...query,
        limit: pagination.pageSize
      });
      await this.setState({
        data: resp.data.data,
        pagination: { ...pagination, total: resp.data.total }
      });
    } catch (e) {
      this.showError(e);
    } finally {
      this.setState({ loading: false });
    }
  }

  async setDateRanger(_, dateStrings: string[]) {
    if (!dateStrings[0] && !dateStrings[1]) {
      await this.setState({
        query: {},
        sort: { sortBy: 'updatedAt', sorter: 'desc' }
      });
      this.getList();
    }
    if (dateStrings[0] && dateStrings[1]) {
      await this.setState({
        query: { fromDate: dateStrings[0], toDate: dateStrings[1] }
      });
      this.getList();
    }
  }

  async showError(e) {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  }

  render() {
    const { data, loading, pagination } = this.state;
    const statuses = [
      { text: 'All', key: '' },
      { text: 'Pending', key: 'pending' },
      { text: 'Rejected', key: 'rejected' },
      { text: 'Done', key: 'done' }
    ];
    return (
      <>
        <Head>
          <title>Payout Requests</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Payout Requests' }]} />
        <Page>
          <SearchFilter
            statuses={statuses}
            onSubmit={this.handleFilter.bind(this)}
            searchWithPerformer
            dateRange
          />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <RequestPayoutTable
              dataSource={data}
              loading={loading}
              rowKey="_id"
              pagination={pagination}
              onChange={this.onHandleTabChange.bind(this)}
              onDelete={this.onDelete.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}
export default PayoutRequestPage;
