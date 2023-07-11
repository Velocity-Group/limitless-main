import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import PageHeading from '@components/common/page-heading';
import { HeartOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { TableListSubscription } from '@components/subscription/table-list-subscription';
import {
  ISubscription, IUIConfig, IUser
} from 'src/interfaces';
import { subscriptionService } from '@services/index';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import SearchFilter from '@components/common/search-filter';
import { setSubscription } from '@redux/subscription/actions';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  setSubscription: Function;
  intl: IntlShape;
}

class SubscriptionPage extends PureComponent<IProps> {
  static authenticate = true;

  state = {
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

  componentDidMount() {
    this.getData();
  }

  async handleFilter(data) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...data } });
    this.handleTabChange({ ...data, current: 1 });
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
      await this.setState({ loading: true });
      const resp = await subscriptionService.userSearch({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      });
      await this.setState({
        subscriptionList: resp.data.data,
        pagination: { ...pagination, total: resp.data.total }
      });
    } catch (error) {
      message.error(
        getResponseError(error)
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async cancelSubscription(subscription: ISubscription) {
    const { intl } = this.props;
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'areYouSureYouWantToCancelThisSubscription',
          defaultMessage: 'Are you sure you want to cancel this subscription!'
        })
      )
    ) { return; }
    try {
      await subscriptionService.cancelSubscription(
        subscription._id,
        subscription.paymentGateway
      );
      message.success(
        intl.formatMessage({
          id: 'subscriptionCancelledSuccessfully',
          defaultMessage: 'Subscription cancelled successfully'
        })
      );
      this.getData();
    } catch (e) {
      const error = await e;
      message.error(
        error?.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    }
  }

  async activeSubscription(subscription: ISubscription) {
    const { currentUser, setSubscription: updateSubscription } = this.props;
    const { performerInfo: performer } = subscription;
    if (currentUser.isPerformer || !performer) return;
    updateSubscription({ showModal: true, performer, subscriptionType: subscription.subscriptionType });
  }

  render() {
    const {
      subscriptionList, pagination, loading
    } = this.state;
    const { ui, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'mySubscriptions',
              defaultMessage: 'My Subscriptions'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'mySubscriptions',
              defaultMessage: 'My Subscriptions'
            })}
            icon={<HeartOutlined />}
          />
          <SearchFilter
            searchWithPerformer
            onSubmit={this.handleFilter.bind(this)}
          />
          <div className="table-responsive">
            <TableListSubscription
              dataSource={subscriptionList}
              pagination={pagination}
              loading={loading}
              onChange={this.handleTabChange.bind(this)}
              rowKey="_id"
              cancelSubscription={this.cancelSubscription.bind(this)}
              activeSubscription={this.activeSubscription.bind(this)}
            />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui },
  currentUser: { ...state.user.current },
  settings: { ...state.settings }
});
const mapDispatch = { setSubscription };
export default injectIntl(connect(mapState, mapDispatch)(SubscriptionPage));
