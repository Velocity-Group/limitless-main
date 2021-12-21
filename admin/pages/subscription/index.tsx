import { message } from 'antd';
import Head from 'next/head';
import { BreadcrumbComponent } from '@components/common/breadcrumb';
import Page from '@components/common/layout/page';
import { PureComponent } from 'react';
import { SearchFilter } from '@components/common/search-filter';
import { TableListSubscription } from '@components/subscription/table-list-subscription';
import { ISubscription } from 'src/interfaces';
import { subscriptionService } from '@services/subscription.service';
import { getResponseError } from '@lib/utils';
import moment from 'moment';

interface IProps { }
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

class SubscriptionPage extends PureComponent<IProps, IStates> {
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

  async handleTabChange(data) {
    const { pagination } = this.state;
    await this.setState({ pagination: { ...pagination, current: data.current } });
    this.getData();
  }

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.getData();
  }

  async onCancelSubscription(subscription: ISubscription) {
    if (!window.confirm('Are you sure to cancel the subscription?')) {
      return;
    }
    try {
      await subscriptionService.cancelSubscription(subscription._id, subscription.paymentGateway);
      this.getData();
      message.success('The subscription has been cancelled');
    } catch (error) {
      const err = await Promise.resolve(error);
      message.error(getResponseError(err));
    }
  }

  async onRenewSubscription(subscription: ISubscription) {
    if (!window.confirm('Are you sure you want to re-activate this subscription?')) {
      return;
    }
    try {
      const {
        subscriptionType
      } = subscription;
      if (subscriptionType === 'yearly') {
        await subscriptionService.update(subscription._id, {
          expiredAt: moment().add(1, 'y'), subscriptionType, status: 'active'
        });
      } else if (subscriptionType === 'monthly') {
        await subscriptionService.update(subscription._id, {
          expiredAt: moment().add(1, 'M'), subscriptionType, status: 'active'
        });
      } else {
        await subscriptionService.update(subscription._id, {
          expiredAt: moment().add(1, 'd'), subscriptionType, status: 'active'
        });
      }

      this.getData();
      message.success('This subscription have been reactivate');
    } catch (error) {
      const err = await Promise.resolve(error);
      message.error(getResponseError(err));
    }
  }

  async getData() {
    const {
      filter, sort, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await subscriptionService.search({
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
      message.error(getResponseError(error) || 'An error occured. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { subscriptionList, pagination, loading } = this.state;
    return (
      <>
        <Head>
          <title>Subscriptions</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Subscriptions' }]} />
        <Page>
          <SearchFilter searchWithPerformer onSubmit={this.handleFilter.bind(this)} />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <TableListSubscription
              dataSource={subscriptionList}
              pagination={pagination}
              loading={loading}
              onChange={this.handleTabChange.bind(this)}
              rowKey="_id"
              onCancelSubscription={this.onCancelSubscription.bind(this)}
              onRenewSubscription={this.onRenewSubscription.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}

export default SubscriptionPage;
