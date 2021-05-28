/* eslint-disable no-param-reassign */
import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import { paymentService } from 'src/services';
import { IOrder, IUIConfig } from 'src/interfaces';
import { SearchFilter } from '@components/common/search-filter';
import PaymentTableList from '@components/payment/table-list';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';

interface IProps {
  ui: IUIConfig;
}
interface IStates {
  loading: boolean;
  paymentList: IOrder[];
  pagination: {
    total: number;
    pageSize: number;
    current: number;
  };
  sortBy: string;
  sort: string;
  filter: {};
}

class PaymentHistoryPage extends PureComponent<IProps, IStates> {
  state = {
    loading: true,
    paymentList: [],
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1
    },
    sortBy: 'createdAt',
    sort: 'desc',
    filter: {}
  };

  componentDidMount() {
    this.userSearchTransactions();
  }

  handleTableChange = async (pagination, filters, sorter) => {
    const { pagination: paginationVal } = this.state;
    await this.setState({
      pagination: { ...paginationVal, current: pagination.current },
      sortBy: sorter.field || 'createdAt',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order
        ? sorter.order === 'descend'
          ? 'desc'
          : 'asc'
        : 'desc'
    });
    this.userSearchTransactions();
  };

  async handleFilter(filter) {
    if (filter.performerId) {
      filter.sellerId = filter.performerId;
      delete filter.performerId;
    } else {
      delete filter.performerId;
      delete filter.sellerId;
    }
    this.setState({ filter }, () => this.userSearchTransactions());
  }

  async userSearchTransactions() {
    try {
      const {
        filter, sort, sortBy, pagination
      } = this.state;
      const resp = await paymentService.userSearch({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      });
      return await this.setState({
        paymentList: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total
        }
      });
    } catch (error) {
      return message.error(getResponseError(error));
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const {
      loading, paymentList, pagination
    } = this.state;
    const { ui } = this.props;
    const statuses = [
      {
        key: '',
        text: 'Payment Status'
      },
      {
        key: 'success',
        text: 'Success'
      },
      {
        key: 'pending',
        text: 'Pending'
      },
      {
        key: 'fail',
        text: 'Fail'
      },
      {
        key: 'Refunded',
        text: 'refunded'
      }
    ];
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui && ui.siteName}
            {' '}
            | Payment History
            {' '}
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading">Payment History</div>
            <SearchFilter
              statuses={statuses}
              onSubmit={this.handleFilter.bind(this)}
              searchWithPerformer
              dateRange
            />
            <PaymentTableList
              dataSource={paymentList}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
              loading={loading}
              rowKey="_id"
            />
          </Page>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(PaymentHistoryPage);
