import { PureComponent } from 'react';
import { message, Layout, Modal } from 'antd';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import { TableListSubscription } from '@components/subscription/table-list-subscription';
import {
  ISubscription, IUIConfig, IUser
} from 'src/interfaces';
import { purchaseTokenService, subscriptionService } from '@services/index';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { SearchFilter } from '@components/common';
import { updateBalance } from '@redux/user/actions';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  updateBalance: Function;
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
    await this.setState({ filter: data });
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

  async cancelSubscription(subscriptionId: string) {
    try {
      await this.setState({ submiting: true });
      const resp = await (await subscriptionService.cancelSubscription(subscriptionId))
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
    if (currentUser.isPerformer || !performer) {
      message.error('Forbiden!');
      return;
    }
    this.setState({ openSubscriptionModal: true, selectedSubscription: subscription });
  }

  async subscribe() {
    const { currentUser, updateBalance: handleUpdateBalance } = this.props;
    const { selectedSubscription } = this.state;
    const { performerInfo: performer, subscriptionType } = selectedSubscription;
    if (currentUser.isPerformer || !performer) {
      return message.error('Forbiden!');
    }
    if ((subscriptionType === 'monthly' && currentUser.balance < performer.monthlyPrice) || (subscriptionType === 'yearly' && currentUser.balance < performer.monthlyPrice)) {
      return message.error('Your token balance is not enough!');
    }
    try {
      await this.setState({ submiting: true });
      await purchaseTokenService.subscribePerformer({ type: subscriptionType, performerId: performer._id });
      handleUpdateBalance({ token: subscriptionType === 'monthly' ? -performer.monthlyPrice : -performer.yearlyPrice });
      this.getData();
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openSubscriptionModal: false });
    }
    return undefined;
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
          <Page>
            <div className="page-heading">
              <span>My subscriptions</span>
            </div>
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
          </Page>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui },
  currentUser: { ...state.user.current }
});
const mapDispatch = { updateBalance };
export default connect(mapState, mapDispatch)(SubscriptionPage);
