import Head from 'next/head';
import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import { feedService } from '@services/index';
import SearchFilter from '@components/common/search-filter';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IFeed, IUIConfig } from 'src/interfaces/index';
import FeedList from '@components/post/table-list';
import { PlusCircleOutlined } from '@ant-design/icons';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

class PostListing extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    items: [],
    loading: false,
    pagination: {
      pageSize: 10,
      current: 1,
      total: 0
    } as any,
    sort: 'desc',
    sortBy: 'createdAt',
    filter: {}
  };

  componentDidMount() {
    this.getData();
  }

  handleTabChange = async (data) => {
    const { pagination } = this.state;
    await this.setState({
      pagination: { ...pagination, current: data.current }
    });
    this.getData();
  }

  async handleFilter(values) {
    const { pagination, filter } = this.state;
    await this.setState({
      filter: { ...filter, ...values },
      pagination: { ...pagination, current: 1 }
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
      const resp = await feedService.search({
        ...filter,
        sort,
        sortBy,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      });
      await this.setState({
        items: resp.data.data,
        pagination: { ...pagination, total: resp.data.total },
        loading: false
      });
    } catch (error) {
      const err = await error;
      message.error(
        err?.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
      this.setState({ loading: false });
    }
  }

  onPin = async (feed: IFeed) => {
    const { intl } = this.props;
    if (!window.confirm(feed.isPinned
      ? intl.formatMessage({ id: 'unpinThisPostFromYourProfile', defaultMessage: 'Unpin this post from your profile' })
      : `${intl.formatMessage({ id: 'pinThisPostToYourProfile', defaultMessage: 'Pin this post to your profile' })}?`)) {
      return;
    }
    try {
      await feedService.pinFeedProfile(feed._id);
      message.success(`${feed.isPinned ? 'Unpinned' : 'Pinned'} post successfully`);
      this.getData();
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(
        err.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    }
  }

  async deleteFeed(feed) {
    const { intl } = this.props;
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'allEarningsRelatedToThisPostWillBeRefunded',
          defaultMessage:
            'All earnings related to this post will be refunded. Are you sure to remove it?'
        })
      )
    ) {
      return;
    }
    try {
      await feedService.delete(feed._id);
      message.success(
        intl.formatMessage({
          id: 'postDeletedSuccessfully',
          defaultMessage: 'Post deleted successfully'
        })
      );
      this.getData();
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(
        err.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    }
  }

  render() {
    const { items, loading, pagination } = this.state;
    const { ui, intl } = this.props;
    const type = [
      {
        key: '',
        text: `${intl.formatMessage({
          id: 'allType',
          defaultMessage: 'All type'
        })}`
      },
      {
        key: 'text',
        text: `${intl.formatMessage({ id: 'text', defaultMessage: 'Text' })}`
      },
      {
        key: 'video',
        text: `${intl.formatMessage({ id: 'video', defaultMessage: 'Video' })}`
      },
      {
        key: 'photo',
        text: `${intl.formatMessage({ id: 'photo', defaultMessage: 'Photo' })}`
      }
      // {
      //   key: 'audio',
      //   text: 'Audio'
      // }
    ];
    return (
      <Layout>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({ id: 'myPosts', defaultMessage: 'My Posts' })}
          </title>
        </Head>
        <div className="main-container">
          <div
            className="page-heading"
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>
              {intl.formatMessage({
                id: 'myPosts',
                defaultMessage: 'My Posts'
              })}
            </span>
            <Link href="/model/my-post/create">
              <a>
                {' '}
                <PlusCircleOutlined />
                {' '}
                {intl.formatMessage({
                  id: 'newPost',
                  defaultMessage: 'New Post'
                })}
              </a>
            </Link>
          </div>
          <div style={{ marginBottom: 25 }}>
            <SearchFilter
              onSubmit={this.handleFilter}
              type={type}
              searchWithKeyword
              dateRange
            />
          </div>
          <div style={{ marginBottom: 15 }} />
          <FeedList
            feeds={items}
            total={pagination.total}
            pageSize={pagination.pageSize}
            searching={loading}
            onChange={this.handleTabChange}
            onDelete={this.deleteFeed}
            onPin={this.onPin}
          />
        </div>
      </Layout>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui }
});
export default injectIntl(connect(mapStates)(PostListing));
