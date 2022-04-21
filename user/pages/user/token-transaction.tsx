import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import Head from 'next/head';
import { HistoryOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { tokenTransctionService } from 'src/services';
import { ITransaction, IUIConfig } from 'src/interfaces';
import { SearchFilter } from '@components/common/search-filter';
import PaymentTableList from '@components/user/payment-token-history-table';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';

interface IProps {
  ui: IUIConfig;
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
      const resp = await tokenTransctionService.userSearch({
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
    const {
      loading, paymentList, pagination
    } = this.state;
    const { ui } = this.props;
    const type = [
      {
        key: '',
        text: 'All types'
      },
      {
        key: 'feed',
        text: 'Post'
      },
      {
        key: 'product',
        text: 'Product'
      },
      {
        key: 'gallery',
        text: 'Gallery'
      },
      {
        key: 'video',
        text: 'Video'
      },
      {
        key: 'tip',
        text: 'Model Tip'
      },
      {
        key: 'stream_tip',
        text: 'Streaming Tip'
      },
      {
        key: 'public_chat',
        text: 'Paid Streaming'
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
          <PageHeading title="Token Transactions" icon={<HistoryOutlined />} />
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
export default connect(mapStates)(PurchasedItemHistoryPage);
