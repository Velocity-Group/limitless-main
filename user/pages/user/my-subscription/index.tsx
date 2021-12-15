import { PureComponent } from 'react';
import { message, Layout, Modal } from 'antd';
import PageHeading from '@components/common/page-heading';
import { HeartOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { TableListSubscription } from '@components/subscription/table-list-subscription';
import {
  ISubscription, IUIConfig, IUser
} from 'src/interfaces';
import { paymentService, subscriptionService } from '@services/index';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { SearchFilter } from '@components/common';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import Loader from '@components/common/base/loader';
import Router from 'next/router';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
}
interface IStates {
  subscriptionList: ISubscription[];
  loading: boolean;
  submiting: boolean;
  pagination: {
    pageSize: number;
    current: number;
    total: number;
  };
  sort: string;
  sortBy: string;
  filter: any;
  openSubscriptionModal: boolean;
  selectedSubscription: ISubscription;
}

class SubscriptionPage extends PureComponent<IProps, IStates> {
  static authenticate: boolean = true;

  state = {
    subscriptionList: [],
    loading: false,
    submiting: false,
    pagination: {
      pageSize: 10,
      current: 1,
      total: 0
    },
    sort: 'desc',
    sortBy: 'updatedAt',
    filter: {},
    openSubscriptionModal: false,
    selectedSubscription: null
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
        getResponseError(error) || 'An error occured. Please try again.'
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async cancelSubscription(subscription: ISubscription) {
    try {
      await this.setState({ submiting: true });
      const resp = await (await subscriptionService.cancelSubscription(subscription._id, subscription.paymentGateway))
        .data;
      resp.success && message.success('Cancel subscription success');
      this.getData();
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  async activeSubscription(subscription: ISubscription) {
    const { currentUser } = this.props;
    const { performerInfo: performer } = subscription;
    if (currentUser.isPerformer || !performer) return;
    this.setState({ openSubscriptionModal: true, selectedSubscription: subscription });
  }

  async subscribe() {
    const { selectedSubscription } = this.state;
    const { performerInfo: performer, subscriptionType } = selectedSubscription;
    const { currentUser } = this.props;
    if (!currentUser._id) {
      message.error('Please log in');
      Router.push('/auth/login');
      return;
    }
    if (!currentUser.stripeCardIds || !currentUser.stripeCardIds.length) {
      message.error('Please add payment card');
      Router.push('/user/cards');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await paymentService.subscribePerformer({
        type: subscriptionType,
        performerId: performer._id,
        paymentGateway: 'stripe',
        stripeCardId: currentUser.stripeCardIds[0]
      });
      this.setState({ openSubscriptionModal: false });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
      this.setState({ submiting: false, openSubscriptionModal: false });
    }
  }

  render() {
    const {
      subscriptionList, pagination, loading, submiting, openSubscriptionModal, selectedSubscription
    } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | My Subscriptions
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="My Subscriptions" icon={<HeartOutlined />} />
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
          <Modal
            key="subscribe_performer"
            title={`Confirm ${selectedSubscription?.subscriptionType} subscription ${selectedSubscription?.performerInfo?.name}`}
            visible={openSubscriptionModal}
            confirmLoading={submiting}
            footer={null}
            onCancel={() => this.setState({ openSubscriptionModal: false })}
          >
            <ConfirmSubscriptionPerformerForm
              type={selectedSubscription?.subscriptionType || 'monthly'}
              performer={selectedSubscription?.performerInfo}
              submiting={submiting}
              onFinish={this.subscribe.bind(this)}
            />
          </Modal>
          {submiting && <Loader customText="Your payment is on processing, do not reload page until its done" />}
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui },
  currentUser: { ...state.user.current }
});
const mapDispatch = { };
export default connect(mapState, mapDispatch)(SubscriptionPage);
