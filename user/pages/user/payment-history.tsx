/* eslint-disable no-param-reassign */
import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import Head from 'next/head';
import { HistoryOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { paymentService } from 'src/services';
import { IUIConfig } from 'src/interfaces';
import PaymentTableList from '@components/payment/table-list';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { injectIntl, IntlShape } from 'react-intl';
import SearchFilter from '@components/common/search-filter';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

class PaymentHistoryPage extends PureComponent<IProps> {
  state = {
    loading: true,
    paymentList: [],
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1
    },
    sortBy: 'updatedAt',
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
      sortBy: sorter.field || 'updatedAt',
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
    const { filter: values } = this.state;
    await this.setState({ filter: { ...values, ...filter } });
    this.userSearchTransactions();
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
    const statuses = [
      {
        key: '',
        text: intl.formatMessage({
          id: 'allStatus',
          defaultMessage: 'All Status'
        })
      },
      {
        key: 'created',
        text: intl.formatMessage({
          id: 'created',
          defaultMessage: 'Created'
        })
      },
      {
        key: 'processing',
        text: intl.formatMessage({
          id: 'processing',
          defaultMessage: 'Processing'
        })
      },
      {
        key: 'require_authentication',
        text: intl.formatMessage({
          id: 'requireAuthentication',
          defaultMessage: 'Require authentication'
        })
      },
      {
        key: 'fail',
        text: intl.formatMessage({ id: 'fail', defaultMessage: 'Fail' })
      },
      {
        key: 'success',
        text: intl.formatMessage({
          id: 'success',
          defaultMessage: 'Success'
        })
      },
      {
        key: 'canceled',
        text: intl.formatMessage({
          id: 'cancelled',
          defaultMessage: 'Cancelled'
        })
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
              id: 'paymentHistory',
              defaultMessage: 'Payment History'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'paymentHistory',
              defaultMessage: 'Payment History'
            })}
            icon={<HistoryOutlined />}
          />
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
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStates)(PaymentHistoryPage));
