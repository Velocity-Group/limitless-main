import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import Head from 'next/head';
import { UserAddOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { TableListSubscription } from '@components/subscription/user-table-list-subscription';
import { ISubscription, IUIConfig } from 'src/interfaces';
import { subscriptionService } from '@services/subscription.service';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { injectIntl, IntlShape } from 'react-intl';
import SearchFilter from '@components/common/search-filter';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}
interface IStates {
  subscriptionList: ISubscription[];
  loading: boolean;
  pagination: {
    pageSize: number;
    current: number;
    total: number;
  };
  sort: string;
  sortBy: string;
  filter: {};
}

class SubscriberPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  constructor(props: IProps) {
    super(props);
    this.state = {
      subscriptionList: [],
      loading: false,
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      sort: 'desc',
      sortBy: 'updatedAt',
      filter: {}
    };
  }

  componentDidMount() {
    this.getData();
  }

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.getData();
  }

  async handleTabChange(data) {
    const { pagination } = this.state;
    await this.setState({
      pagination: { ...pagination, current: data.current }
    });
    this.getData();
  }

  async getData() {
    const { intl } = this.props;
    try {
      const {
        filter, sort, sortBy, pagination
      } = this.state;
      this.setState({ loading: true });
      const resp = await subscriptionService.search({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      });
      this.setState({
        subscriptionList: resp.data.data,
        pagination: { ...pagination, total: resp.data.total }
      });
    } catch (error) {
      message.error(
        getResponseError(await error)
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { subscriptionList, pagination, loading } = this.state;
    const { ui, intl } = this.props;
    const statuses = [
      {
        key: '',
        text: `${intl.formatMessage({ id: 'allStatuses', defaultMessage: 'All Statuses' })}`
      },
      {
        key: 'active',
        text: `${intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}`
      },
      {
        key: 'deactivated',
        text: `${intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}`
      }
    ];
    const types = [
      {
        key: '',
        text: `${intl.formatMessage({ id: 'allTypes', defaultMessage: 'All Types' })}`
      },
      {
        key: 'free',
        text: `${intl.formatMessage({ id: 'freeSubscriptio', defaultMessage: 'Free Subscriptio' })}`
      },
      {
        key: 'monthly',
        text: `${intl.formatMessage({ id: 'monthlySubscription', defaultMessage: 'Monthly Subscription' })}`
      },
      {
        key: 'yearly',
        text: `${intl.formatMessage({ id: 'yearlySubscription', defaultMessage: 'Yearly Subscription' })}`
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
              id: 'mySubscribers',
              defaultMessage: 'My Subscribers'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'mySubscribers',
              defaultMessage: 'My Subscribers'
            })}
            icon={<UserAddOutlined />}
          />
          <SearchFilter
            subscriptionTypes={types}
            statuses={statuses}
            dateRange
            onSubmit={this.handleFilter.bind(this)}
          />
          <div className="table-responsive">
            <TableListSubscription
              dataSource={subscriptionList}
              pagination={pagination}
              loading={loading}
              onChange={this.handleTabChange.bind(this)}
              rowKey="_id"
            />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({ ui: state.ui });
export default injectIntl(connect(mapState)(SubscriberPage));
