import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import Head from 'next/head';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { purchaseItemService } from 'src/services';
import { IPaymentTokenHistory, IUIConfig } from 'src/interfaces';
import { SearchFilter } from '@components/common/search-filter';
import PaymentTableList from '@components/purchase-item/payment-token-history-table';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { BreadcrumbComponent } from '@components/common';

interface IProps {
  ui: IUIConfig;
}
interface IStates {
  loading: boolean;
  paymentList: IPaymentTokenHistory[];
  searching: boolean;
  pagination: {
    total: number;
    pageSize: number;
    current: number;
  };
  sortBy: string;
  sort: string;
  filter: {};
}

class PurchasedItemHistoryPage extends PureComponent<IProps, IStates> {
  state = {
    loading: true,
    searching: false,
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

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.userSearchTransactions();
  }

  async userSearchTransactions() {
    try {
      const {
        filter, sort, sortBy, pagination
      } = this.state;
      const resp = await purchaseItemService.search({
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
      loading, paymentList, searching, pagination
    } = this.state;
    const { ui } = this.props;
    const type = [
      {
        key: '',
        text: 'All'
      },
      {
        key: 'tip',
        text: 'Tip'
      },
      {
        key: 'feed',
        text: 'Post'
      },
      // {
      //   key: 'gift',
      //   text: 'Gift'
      // },
      // {
      //   key: 'message',
      //   text: 'Message'
      // },
      {
        key: 'public_chat',
        text: 'Public Chat'
      },
      {
        key: 'group_chat',
        text: 'Group Chat'
      },
      {
        key: 'private_chat',
        text: 'Private Chat'
      },
      {
        key: 'video',
        text: 'Video'
      },
      {
        key: 'product',
        text: 'Product'
      },
      {
        key: 'monthly_subscription',
        text: 'Monthly Subscription'
      },
      {
        key: 'yearly_subscription',
        text: 'Yearly Subscription'
      }
    ];
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui && ui.siteName}
            {' '}
            | Token Transactions
          </title>
        </Head>
        <div className="main-container">
          {loading ? (
            <Loader />
          ) : (
            <Page>
              <BreadcrumbComponent breadcrumbs={[{ title: 'Token Transactions' }]} />
              <SearchFilter
                type={type}
                onSubmit={this.handleFilter.bind(this)}
                dateRange
              />
              <div style={{ margin: 20 }} />
              <div className="table-responsive">
                <PaymentTableList
                  dataSource={paymentList}
                  pagination={pagination}
                  onChange={this.handleTableChange.bind(this)}
                  rowKey="_id"
                  loading={searching}
                />
              </div>
            </Page>
          )}
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(PurchasedItemHistoryPage);
