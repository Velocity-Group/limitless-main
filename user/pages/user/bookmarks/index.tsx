import {
  Layout, message, Tabs, Tooltip
} from 'antd';
import { PureComponent } from 'react';
import PageHeading from '@components/common/page-heading';
import Page from '@components/common/layout/page';
import {
  IUIConfig, IFeed, IUser
} from 'src/interfaces';
import { connect } from 'react-redux';
import {
  feedService, productService, galleryService, videoService, performerService
} from 'src/services';
import Head from 'next/head';
import UserPerformerBookmarks from '@components/user/bookmarks/performer-bookmarks';
import { ScrollListProduct } from '@components/product/scroll-list-item';
import ScrollListFeed from '@components/post/scroll-list';
import { ScrollListVideo } from '@components/video/scroll-list-item';
import { ScrollListGallery } from '@components/gallery/scroll-list-gallery';
import {
  FireOutlined, VideoCameraOutlined, PictureOutlined, ShopOutlined, StarOutlined, BookOutlined
} from '@ant-design/icons';
import '../index.less';

interface IProps {
  ui: IUIConfig;
  user: IUser;
}
interface IStates {
  loading: boolean;
  feeds: any[];
  totalFeeds: number;
  currentPage: {
    feed: number;
    gallery: number;
    performer: number;
    video: number;
    product: number;
  };
  limit: number;
  videos: any[];
  totalVideos: number;
  galleries: any[];
  totalGalleries: number;
  performers: any[];
  totalPerformers: number;
  products: any[];
  totalProducts: number;
  tab: string;
}

const initialState = {
  loading: false,
  feeds: [],
  totalFeeds: 0,
  currentPage: {
    feed: 0,
    gallery: 0,
    performer: 0,
    video: 0,
    product: 0
  },
  limit: 12,
  videos: [],
  totalVideos: 0,
  galleries: [],
  totalGalleries: 0,
  performers: [],
  totalPerformers: 0,
  products: [],
  totalProducts: 0,
  tab: 'feeds'
};

class FavouriteVideoPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  state = initialState;

  componentDidMount() {
    this.getBookmarkedPosts();
  }

  async handlePagechange(
    key: 'feeds' | 'videos' | 'galleries' | 'products' | 'performers'
  ) {
    const { currentPage } = this.state;
    this.setState({
      currentPage: { ...currentPage, [key]: currentPage[key] + 1 }
    });

    if (key === 'feeds') {
      this.getBookmarkedPosts();
    }
    if (key === 'videos') {
      this.getBookmarkedVideos();
    }
    if (key === 'galleries') {
      this.getBookmarkedGalleries();
    }
    if (key === 'products') {
      this.getBookmarkedProducts();
    }
    if (key === 'performers') {
      this.getBookmarkedPerformers();
    }
  }

  async onTabsChange(key: string) {
    await this.setState({ ...initialState, tab: key });
    this.loadData(key);
  }

  async onDeleteFeed(feed: IFeed) {
    const { user } = this.props;
    const { feeds } = this.state;
    if (user._id !== feed.fromSourceId) return;
    if (!window.confirm('Are you sure to delete this post?')) return;
    try {
      await feedService.delete(feed._id);
      feeds.filter((f) => f._id !== feed._id);
      message.success('Removed successfully');
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Something went wrong, please try again later');
    }
  }

  async getBookmarkedPosts() {
    const { currentPage, limit, feeds } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await feedService.getBookmark({
        limit,
        offset: currentPage.feed * limit
      });
      this.setState({
        feeds: [...feeds, ...resp.data.data],
        totalFeeds: resp.data.total
      });
    } catch (error) {
      message.error('Server error');
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedVideos() {
    const { currentPage, limit, videos } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await videoService.getBookmarks({
        limit,
        offset: currentPage.video * limit
      });
      this.setState({
        videos: [...videos, ...resp.data.data],
        totalVideos: resp.data.total
      });
    } catch (error) {
      message.error('Server error');
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedGalleries() {
    const { currentPage, limit, galleries } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await galleryService.getBookmarks({
        limit,
        offset: currentPage.gallery * limit
      });
      this.setState({
        galleries: [...galleries, ...resp.data.data],
        totalGalleries: resp.data.total
      });
    } catch (error) {
      message.error('Server error');
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedProducts() {
    const { currentPage, limit, products } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await productService.getBookmarked({
        limit,
        offset: currentPage.product * limit
      });
      this.setState({
        products: [...products, ...resp.data.data],
        totalProducts: resp.data.total
      });
    } catch (error) {
      message.error('Server error');
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedPerformers() {
    const { currentPage, limit, performers } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await performerService.getBookmarked({
        limit,
        offset: currentPage.performer * limit
      });

      this.setState({
        performers: [...performers, ...resp.data.data],
        totalPerformers: resp.data.total
      });
    } catch (error) {
      message.error('Server error');
    } finally {
      this.setState({ loading: false });
    }
  }

  async loadData(key: string) {
    if (key === 'feeds' || undefined) {
      await this.getBookmarkedPosts();
    }
    if (key === 'videos') {
      await this.getBookmarkedVideos();
    }
    if (key === 'galleries') {
      await this.getBookmarkedGalleries();
    }
    if (key === 'products') {
      await this.getBookmarkedProducts();
    }
    if (key === 'performers') {
      await this.getBookmarkedPerformers();
    }
  }

  render() {
    const {
      loading,
      feeds,
      totalFeeds,
      videos,
      totalVideos,
      galleries,
      totalGalleries,
      performers,
      totalPerformers,
      products,
      totalProducts,
      tab
    } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Bookmarks
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <PageHeading title="BookMarks" icon={<BookOutlined />} />
            <div style={{ marginBottom: 25 }} />
            <Tabs
              defaultActiveKey={tab || 'feeds'}
              size="large"
              onChange={this.onTabsChange.bind(this)}
            >
              <Tabs.TabPane tab={<Tooltip title="Feeds"><FireOutlined /></Tooltip>} key="feeds">
                <ScrollListFeed
                  isGrid
                  items={feeds.map((f) => f.objectInfo)}
                  loading={loading}
                  canLoadmore={totalFeeds > feeds.length}
                  onDelete={this.onDeleteFeed.bind(this)}
                  loadMore={this.handlePagechange.bind(this, 'feeds')}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<Tooltip title="Videos"><VideoCameraOutlined /></Tooltip>} key="videos">
                <ScrollListVideo
                  items={videos.map((f) => f.objectInfo)}
                  loading={loading}
                  canLoadmore={totalVideos > videos.length}
                  loadMore={this.handlePagechange.bind(this, 'videos')}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<Tooltip title="Galleries"><PictureOutlined /></Tooltip>} key="galleries">
                <ScrollListGallery
                  items={galleries.map((f) => f.objectInfo)}
                  loading={loading}
                  canLoadmore={totalGalleries > galleries.length}
                  loadMore={this.handlePagechange.bind(this, 'galleries')}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<Tooltip title="Shop"><ShopOutlined /></Tooltip>} key="products">
                <ScrollListProduct
                  loading={loading}
                  items={products.map((p) => p.objectInfo)}
                  canLoadmore={totalProducts > products.length}
                  loadMore={this.handlePagechange.bind(
                    this,
                    'products'
                  )}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<Tooltip title="Models"><StarOutlined /></Tooltip>} key="performers">
                <UserPerformerBookmarks
                  loading={loading}
                  performers={performers.map((p) => p.objectInfo)}
                  total={totalPerformers}
                  loadMore={this.handlePagechange.bind(
                    this,
                    'performers'
                  )}
                />
              </Tabs.TabPane>
            </Tabs>
          </Page>
        </div>
      </Layout>
    );
  }
}
const mapState = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});
export default connect(mapState)(FavouriteVideoPage);
