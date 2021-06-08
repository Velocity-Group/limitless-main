/* eslint-disable no-restricted-globals */
import Head from 'next/head';
import { PureComponent } from 'react';
import {
  message, Layout
} from 'antd';
import { feedService } from '@services/index';
import { SearchFilter } from '@components/common/search-filter';
import Page from '@components/common/layout/page';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IUIConfig, IUser } from '@interfaces/index';
import ScrollListFeed from '@components/post/scroll-list';
import { PlusCircleOutlined, FireOutlined } from '@ant-design/icons';

interface IProps {
  ui: IUIConfig;
  user: IUser;
}

class PostListing extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    canLoadMore: false,
    list: [] as any,
    limit: 10,
    currentPage: 1,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc',
    loading: false
  };

  componentDidMount() {
    this.search(1);
  }

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
  }

  async search(page = 1) {
    const {
      filter, limit, sortBy, sort
    } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await feedService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      await this.setState({
        list: resp.data.data,
        currentPage: page,
        canLoadMore: resp.data.total > resp.data.data * page
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ loading: false });
    }
  }

  async loadMore() {
    const {
      currentPage
    } = this.state;
    await this.setState({ currentPage: currentPage + 1 });
    this.search(currentPage);
  }

  async deleteFeed(feed) {
    const { list } = this.state;
    if (!confirm('Are you sure you want to delete this video?')) {
      return false;
    }
    try {
      await feedService.delete(feed._id);
      const newList = list.filter((f) => f._id !== feed._id);
      await this.setState({ list: newList });
      message.success('Deleted post successfully!');
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
    return undefined;
  }

  render() {
    const { list, loading, canLoadMore } = this.state;
    const { ui } = this.props;
    const type = [
      {
        key: '',
        text: 'All posts'
      },
      {
        key: 'text',
        text: 'Text posts'
      },
      {
        key: 'video',
        text: 'Video posts'
      },
      {
        key: 'photo',
        text: 'Photo posts'
      }
    ];
    return (
      <Layout>
        <Head>
          <title>
            { ui?.siteName }
            {' '}
            | My Posts
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <FireOutlined />
                {' '}
                My Posts
              </span>
              <Link href="/model/my-post/create">
                <a>
                  {' '}
                  <PlusCircleOutlined />
                  {' '}
                  New Post
                </a>
              </Link>
            </div>
            <div>
              <SearchFilter
                onSubmit={this.handleFilter.bind(this)}
                type={type}
                searchWithKeyword
              />
            </div>
            <div className="main-container custom">
              <ScrollListFeed
                items={list}
                loading={loading}
                canLoadmore={canLoadMore}
                loadMore={this.loadMore.bind(this)}
                onDelete={this.deleteFeed.bind(this)}
              />
            </div>

          </Page>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});
export default connect(mapStates)(PostListing);
