/* eslint-disable react/no-did-update-set-state */
import { PureComponent } from 'react';
import {
  message, Tabs, Badge, Tooltip
} from 'antd';
import {
  UserOutlined, HistoryOutlined, GlobalOutlined, FireOutlined, ShopOutlined
} from '@ant-design/icons';
import {
  performerService, productService, feedService, blogService, storyService
} from '@services/index';
import Head from 'next/head';
import { connect } from 'react-redux';
import { ScrollListPerformer } from '@components/performer/scroll-list';
import ScrollListFeed from '@components/post/scroll-list';
import { ScrollListProduct } from '@components/product/scroll-list-item';
import ScrollListBlog from '@components/blog/scroll-list';
import ScrollListStory from '@components/story/scroll-list';
import {
  IUIConfig, IFeed, IUser, IStory, IBlog
} from '@interfaces/index';
import { omit } from 'lodash';
import './index.less';

const { TabPane } = Tabs;

interface IProps {
  ui: IUIConfig;
  currentUser: IUser;
  keyword: string;
  result: any;
  type: string;
}

const initialState = {
  limit: 12,
  performers: {
    data: [],
    total: 0,
    offset: 0
  },
  blogs: {
    data: [],
    total: 0,
    offset: 0
  },
  products: {
    data: [],
    total: 0,
    offset: 0
  },
  stories: {
    data: [],
    total: 0,
    offset: 0
  },
  feeds: {
    data: [],
    total: 0,
    offset: 0
  },
  keyword: '',
  type: 'performer',
  result: {
    totalPerformer: 0,
    totalStory: 0,
    totalProduct: 0,
    totalFeed: 0,
    totalBlog: 0
  },
  searching: false
};

class PageSearch extends PureComponent<IProps> {
  static authenticate = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = { ...initialState }

  async componentDidMount() {
    const { keyword, result, type } = this.props;
    this.setState({ keyword: keyword || '', type: type || 'performer', result: result ? JSON.parse(result) : initialState.result }, () => {
      this.initialSearch(type);
    });
  }

  async componentDidUpdate(prevProps) {
    const { keyword, result, type } = this.props;
    if (prevProps.keyword !== keyword || prevProps.type !== type) {
      this.setState({
        ...initialState,
        ...{
          type,
          keyword,
          result: result ? JSON.parse(result) : initialState.result
        }
      }, () => {
        this.initialSearch(type);
      });
    }
  }

  async handleDeleteFeed(feed: IFeed) {
    const { currentUser } = this.props;
    const { feeds } = this.state;
    if (currentUser._id !== feed.fromSourceId) {
      return message.error('Permission denied');
    }
    if (!window.confirm('Are you sure to delete this post?')) return undefined;
    try {
      await feedService.delete(feed._id);
      message.success('Deleted the post successfully');
      const index = feeds.data.findIndex((f) => f._id === feed._id);
      this.setState({ feeds: { ...feeds, data: feeds.data.splice(index, 1) } });
    } catch {
      message.error('Something went wrong, please try again later');
    }
    return undefined;
  }

  async handleDeleteStory(story: IStory) {
    const { currentUser } = this.props;
    const { stories } = this.state;
    if (currentUser._id !== story.fromSourceId) {
      message.error('Permission denied');
      return;
    }
    if (!window.confirm('Are you sure to delete this story?')) return;
    try {
      await storyService.delete(story._id);
      message.success('Deleted the story successfully');
      const index = stories.data.findIndex((f) => f._id === story._id);
      this.setState({ feeds: { ...stories, data: stories.data.splice(index, 1) } });
    } catch {
      message.error('Something went wrong, please try again later');
    }
  }

  async handleDeleteBlog(blog: IBlog) {
    const { currentUser } = this.props;
    const { blogs } = this.state;
    if (currentUser._id !== blog.fromSourceId) {
      message.error('Permission denied');
      return;
    }
    if (!window.confirm('Are you sure to delete this blog?')) return;
    try {
      await blogService.delete(blog._id);
      message.success('Deleted the blog successfully');
      const index = blogs.data.findIndex((f) => f._id === blog._id);
      this.setState({ blogs: { ...blogs, data: blogs.data.splice(index, 1) } });
    } catch {
      message.error('Something went wrong, please try again later');
    }
  }

  async onLoadMore() {
    const {
      type, performers, feeds, stories, blogs, products
    } = this.state;
    switch (type) {
      case 'performer':
        this.setState({ performers: { ...performers, offset: performers.offset + 1 } }, () => this.searchPerformer());
        break;
      case 'feed':
        this.setState({ feeds: { ...feeds, offset: feeds.offset + 1 } }, () => this.searchFeed());
        break;
      case 'story':
        this.setState({ stories: { ...stories, offset: stories.offset + 1 } }, () => this.searchStory());
        break;
      case 'blog':
        this.setState({ blogs: { ...blogs, offset: blogs.offset + 1 } }, () => this.searchBlog());
        break;
      case 'product':
        this.setState({ products: { ...products, offset: products.offset + 1 } }, () => this.searchProduct());
        break;
      default: break;
    }
  }

  async searchPerformer() {
    const { keyword, performers, limit } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await (await performerService.search({
        q: keyword,
        limit,
        offset: performers.offset * limit
      })).data;
      this.setState({ performers: { ...performers, total: resp.total, data: performers.data.concat(resp.data) } });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ searching: false });
    }
  }

  async searchStory() {
    const { keyword, stories, limit } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await (await storyService.userSearch({
        q: keyword,
        limit,
        offset: stories.offset * limit
      })).data;
      this.setState({ stories: { ...stories, total: resp.total, data: stories.data.concat(resp.data) } });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ searching: false });
    }
  }

  async searchBlog() {
    const { keyword, blogs, limit } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await (await blogService.userSearch({
        q: keyword,
        limit,
        offset: blogs.offset * limit
      })).data;
      this.setState({ blogs: { ...blogs, total: resp.total, data: blogs.data.concat(resp.data) } });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ searching: false });
    }
  }

  async searchProduct() {
    const { keyword, products, limit } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await (await productService.userSearch({
        q: keyword,
        limit,
        offset: products.offset * limit
      })).data;
      this.setState({ products: { ...products, total: resp.total, data: resp.data } });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ searching: false });
    }
  }

  async searchFeed() {
    const { keyword, feeds, limit } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await (await feedService.userSearch({
        q: keyword,
        limit,
        offset: feeds.offset * limit
      })).data;
      this.setState({ feeds: { ...feeds, total: resp.total, data: feeds.data.concat(resp.data) } });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ searching: false });
    }
  }

  async initialSearch(tab: string) {
    if (tab) {
      const nextState = omit(initialState, ['result', 'keyword', 'type']);
      await this.setState({ ...nextState, ...{ type: tab } });
    }
    const { type } = this.state;
    switch (type) {
      case 'performer': this.searchPerformer();
        break;
      case 'story': this.searchStory();
        break;
      case 'blog': this.searchBlog();
        break;
      case 'product': this.searchProduct();
        break;
      case 'feed': this.searchFeed();
        break;
      default: break;
    }
  }

  render() {
    const {
      performers, blogs, stories, products, feeds, type, keyword, result, searching
    } = this.state;
    const {
      totalPerformer = 0, totalFeed = 0, totalStory = 0, totalProduct = 0, totalBlog = 0
    } = result;
    const totalResult = totalPerformer + totalFeed + totalStory + totalProduct + totalBlog;
    const { ui } = this.props;
    return (
      <div>
        <Head>
          <title>
            {`${ui?.siteName} | Search`}
          </title>
        </Head>
        <div className="main-container">
          <div className="model-content">
            {totalResult > 0 && <div className="heading-top">{`${keyword} ${keyword.length ? '-' : ''} ${totalResult} results`}</div>}
            <Tabs size="large" activeKey={type} onTabClick={(tab) => this.initialSearch(tab)}>
              <TabPane
                tab={(
                  <Tooltip title="Posts">
                    <FireOutlined />
                    <Badge count={totalFeed} showZero />
                  </Tooltip>
                )}
                key="feed"
              >
                <div className="main-container custom">
                  <ScrollListFeed items={feeds.data} canLoadmore={feeds.total > feeds.data.length} loadMore={this.onLoadMore.bind(this)} loading={searching} onDelete={this.handleDeleteFeed.bind(this)} />
                </div>
              </TabPane>
              <TabPane
                tab={(
                  <Tooltip title="Stories">
                    <HistoryOutlined />
                    <Badge count={totalStory} showZero />
                  </Tooltip>
                )}
                key="story"
              >
                <div className="main-container custom">
                  <ScrollListStory onDelete={this.handleDeleteStory.bind(this)} items={stories.data} canLoadmore={stories.total > stories.data.length} loadMore={this.onLoadMore.bind(this)} loading={searching} />
                </div>
              </TabPane>
              <TabPane
                tab={(
                  <Tooltip title="Blogs">
                    <GlobalOutlined />
                    <Badge count={totalBlog} showZero />
                  </Tooltip>
                )}
                key="blog"
              >
                <div className="main-container custom">
                  <ScrollListBlog onDelete={this.handleDeleteBlog.bind(this)} items={blogs.data} canLoadmore={blogs.total > blogs.data.length} loadMore={this.onLoadMore.bind(this)} loading={searching} />
                </div>
              </TabPane>
              <TabPane
                tab={(
                  <Tooltip title="Content Creators">
                    <UserOutlined />
                    <Badge count={totalPerformer} showZero />
                  </Tooltip>
                )}
                key="performer"
              >
                <ScrollListPerformer canLoadmore={performers.total > performers.data.length} items={performers.data} loadMore={this.onLoadMore.bind.bind(this)} loading={searching} />
              </TabPane>
              <TabPane
                tab={(
                  <Tooltip title="Product">
                    <ShopOutlined />
                    <Badge count={totalProduct} showZero />
                  </Tooltip>
                )}
                key="product"
              >
                <ScrollListProduct items={products.data} canLoadmore={products.total > products.data.length} loadMore={this.onLoadMore.bind(this)} loading={searching} />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  currentUser: { ...state.user.current }
});
const mapDispatch = {
};

export default connect(mapStates, mapDispatch)(PageSearch);
