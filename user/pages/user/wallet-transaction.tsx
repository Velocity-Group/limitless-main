import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import Head from 'next/head';
import { HistoryOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { tokenTransactionService } from 'src/services';
import { ITransaction, IUIConfig } from 'src/interfaces';
import SearchFilter from '@components/common/search-filter';
import PaymentTableList from '@components/user/payment-token-history-table';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}
interface IStates {
  loading: boolean;
  paymentList: ITransaction[];
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
  static authenticate = true;

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

  handleFilter(values) {
    const { filter } = this.state;
    this.setState({ filter: { ...filter, ...values } }, () => this.userSearchTransactions());
  }

  async userSearchTransactions() {
    try {
      const {
        filter, sort, sortBy, pagination
      } = this.state;
      await this.setState({ loading: true });
      const resp = await tokenTransactionService.userSearch({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      });
      this.setState({
        loading: false,
        paymentList: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total
        }
      });
    } catch (error) {
      message.error(getResponseError(await error));
      this.setState({ loading: false });
    }
  }

  render() {
    const { loading, paymentList, pagination } = this.state;
    const { ui, intl } = this.props;
    const type = [
      {
        key: '',
        text: intl.formatMessage({
          id: 'allType',
          defaultMessage: 'All type'
        })
      },
      {
        key: 'feed',
        text: intl.formatMessage({ id: 'post', defaultMessage: 'Post' })
      },
      {
        key: 'product',
        text: intl.formatMessage({ id: 'product', defaultMessage: 'Product' })
      },
      {
        key: 'gallery',
        text: intl.formatMessage({ id: 'gallery', defaultMessage: 'Gallery' })
      },
      {
        key: 'video',
        text: intl.formatMessage({ id: 'video', defaultMessage: 'Video' })
      },
      {
        key: 'message',
        text: intl.formatMessage({ id: 'message', defaultMessage: 'Message' })
      },
      {
        key: 'tip',
        text: intl.formatMessage({ id: 'tip', defaultMessage: 'Tip' })
      },
      {
        key: 'stream_tip',
        text: intl.formatMessage({ id: 'streamingTip', defaultMessage: 'Streaming tip' })
      },
      {
        key: 'public_chat',
        text: intl.formatMessage({ id: 'paidStreaming', defaultMessage: 'Paid streaming' })
      }
    ];
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'walletTransactions',
              defaultMessage: 'Wallet Transactions'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'walletTransactions',
              defaultMessage: 'Wallet Transactions'
            })}
            icon={<HistoryOutlined />}
          />
          <SearchFilter
            type={type}
            searchWithPerformer
            onSubmit={this.handleFilter.bind(this)}
            dateRange
          />
          <PaymentTableList
            dataSource={paymentList}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            rowKey="_id"
            loading={loading}
          />
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStates)(PurchasedItemHistoryPage));
