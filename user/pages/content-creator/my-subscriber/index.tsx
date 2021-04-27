import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import Head from 'next/head';
import Page from '@components/common/layout/page';
// import { SearchFilter } from '@components/common/search-filter';
import { TableListSubscription } from '@components/subscription/user-table-list-subscription';
import { ISubscription, IUIConfig, IBlockedByPerformer } from 'src/interfaces';
import { subscriptionService } from '@services/subscription.service';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { performerService } from '@services/performer.service';

interface IProps {
  ui: IUIConfig;
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
  static authenticate: boolean = true;

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
      message.error(
        getResponseError(error) || 'An error occured. Please try again.'
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async blockUser(payload: IBlockedByPerformer) {
    try {
      const { subscriptionList } = this.state;
      await performerService.blockUser(payload);
      const index = subscriptionList.findIndex(
        (element) => element.userId === payload.userId
      );
      if (index > -1) {
        const newArray = [...subscriptionList];
        newArray[index] = {
          ...newArray[index],
          blockedUser: true
        };
        await this.setState({ subscriptionList: newArray });
      }
      message.success('Blocked user');
    } catch (error) {
      message.error(
        getResponseError(error) || 'An error occured. Please try again.'
      );
    }
  }

  async unblockUser(userId: string) {
    try {
      const { subscriptionList } = this.state;
      await performerService.unblockUser(userId);
      const index = subscriptionList.findIndex(
        (element) => element.userId === userId
      );
      if (index > -1) {
        const newArray = [...subscriptionList];
        newArray[index] = {
          ...newArray[index],
          blockedUser: false
        };
        await this.setState({ subscriptionList: newArray });
      }
      message.success('Unblocked user');
    } catch (error) {
      message.error(
        getResponseError(error) || 'An error occured. Please try again.'
      );
    }
  }

  render() {
    const { subscriptionList, pagination, loading } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | My Subscribers
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading">
              <span>My Subscribers</span>
            </div>
            <div className="table-responsive">
              <TableListSubscription
                dataSource={subscriptionList}
                pagination={pagination}
                loading={loading}
                onChange={this.handleTabChange.bind(this)}
                rowKey="_id"
                blockUser={this.blockUser.bind(this)}
                unblockUser={this.unblockUser.bind(this)}
              />
            </div>
          </Page>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({ ui: state.ui });
const mapDispatch = {};
export default connect(mapState, mapDispatch)(SubscriberPage);
