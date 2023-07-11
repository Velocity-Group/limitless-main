import { PureComponent } from 'react';
import Head from 'next/head';
import { message, Layout } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { orderService } from '@services/index';
import OrderSearchFilter from '@components/order/search-filter';
import OrderTableList from '@components/order/table-list';
import { connect } from 'react-redux';
import { IUIConfig, IUser } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  user: IUser;
  intl: IntlShape;
}

class UserOrderPage extends PureComponent<IProps> {
  static authenticate = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc'
  };

  async componentDidMount() {
    this.search();
  }

  handleTableChange = async (pagination, filters, sorter) => {
    const { pagination: paginationState } = this.state;
    const pager = { ...paginationState };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'createdAt',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order
        ? sorter.order === 'descend'
          ? 'desc'
          : 'asc'
        : 'desc'
    });
    this.search(pager.current);
  };

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.search();
  }

  async search(page = 1) {
    const { intl } = this.props;
    try {
      const {
        filter, limit, sort, sortBy, pagination
      } = this.state;
      await this.setState({ searching: true });
      const resp = await orderService.userSearch({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total,
          pageSize: limit
        }
      });
    } catch (e) {
      message.error(
        intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
      this.setState({ searching: false });
    }
  }

  render() {
    const { list, searching, pagination } = this.state;
    const { ui, user, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'myOrders',
              defaultMessage: 'My Orders'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'myOrders',
              defaultMessage: 'My Orders'
            })}
            icon={<ShoppingCartOutlined />}
          />
          <OrderSearchFilter onSubmit={this.handleFilter.bind(this)} />
          <OrderTableList
            user={user}
            dataSource={list}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
          />
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui,
  user: { ...state.user.current }
});
export default injectIntl(connect(mapStates)(UserOrderPage));
