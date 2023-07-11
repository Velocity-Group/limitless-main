import { Layout, message, Tabs } from 'antd';
import { PureComponent } from 'react';
import PageHeading from '@components/common/page-heading';
import {
  IUIConfig, IFeed, IUser, ICountry
} from 'src/interfaces';
import { connect } from 'react-redux';
import {
  feedService, productService, galleryService, videoService, performerService, utilsService
} from 'src/services';
import Head from 'next/head';
import ScrollListPerformers from '@components/performer/scroll-list';
import ScrollListProduct from '@components/product/scroll-list-item';
import ScrollListFeed from '@components/post/scroll-list';
import ScrollListVideo from '@components/video/scroll-list-item';
import ScrollListGallery from '@components/gallery/scroll-list-gallery';
import {
  FireOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  ShopOutlined,
  BookOutlined
} from '@ant-design/icons';
import { ModelIcon } from 'src/icons';
import '../index.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  user: IUser;
  intl: IntlShape;
  countries: ICountry[];
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

  static async getInitialProps() {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return {
      countries: countries?.data || []
    };
  }

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
    const { user, intl } = this.props;
    const { feeds } = this.state;
    if (user._id !== feed.fromSourceId) return;
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'allEarningsRelatedToThisPostWillBeRefunded',
          defaultMessage:
            'All earnings related to this post will be refunded. Are you sure to remove it?'
        })
      )
    ) { return; }
    try {
      await feedService.delete(feed._id);
      feeds.filter((f) => f._id !== feed._id);
      message.success(
        intl.formatMessage({
          id: 'postDeletedSuccessfully',
          defaultMessage: 'Post deleted successfully'
        })
      );
    } catch (e) {
      const error = await e;
      message.error(
        error?.message
        || intl.formatMessage({
          id: 'somethingWentWrong',
          defaultMessage: 'Something went wrong, please try again!'
        })
      );
    }
  }

  async getBookmarkedPosts() {
    const { intl } = this.props;
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
      message.error(
        error?.message
        || intl.formatMessage({
          id: 'serverError',
          defaultMessage: 'Server error'
        })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedVideos() {
    const { intl } = this.props;
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
      message.error(
        intl.formatMessage({
          id: 'serverError',
          defaultMessage: 'Server error'
        })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedGalleries() {
    const { intl } = this.props;
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
      message.error(
        intl.formatMessage({
          id: 'serverError',
          defaultMessage: 'Server error'
        })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedProducts() {
    const { intl } = this.props;
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
      message.error(
        intl.formatMessage({
          id: 'serverError',
          defaultMessage: 'Server error'
        })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async getBookmarkedPerformers() {
    const { intl } = this.props;
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
      message.error(
        intl.formatMessage({
          id: 'serverError',
          defaultMessage: 'Server error'
        })
      );
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
    const { ui, countries, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'bookmarks',
              defaultMessage: 'Bookmarks'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'bookmarks',
              defaultMessage: 'Bookmarks'
            })}
            icon={<BookOutlined />}
          />
          <div className="user-account">
            <Tabs
              defaultActiveKey={tab || 'feeds'}
              size="large"
              onChange={this.onTabsChange.bind(this)}
            >
              <Tabs.TabPane tab={<FireOutlined />} key="feeds">
                <div className="heading-tab">
                  <h4>
                    {totalFeeds > 0 && totalFeeds}
                    {' '}
                    {totalFeeds > 1
                      ? intl.formatMessage({
                        id: 'posts',
                        defaultMessage: 'Posts'
                      })
                      : intl.formatMessage({
                        id: 'post',
                        defaultMessage: 'Post'
                      })}
                  </h4>
                </div>
                <ScrollListFeed
                  isGrid
                  items={feeds.map((f) => f.objectInfo)}
                  loading={loading}
                  canLoadmore={totalFeeds > feeds.length}
                  onDelete={this.onDeleteFeed.bind(this)}
                  loadMore={this.handlePagechange.bind(this, 'feeds')}
                  notFoundText={intl.formatMessage({
                    id: 'noBookmarkedPostsFound',
                    defaultMessage: 'No bookmarked posts found'
                  })}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<VideoCameraOutlined />} key="videos">
                <div className="heading-tab">
                  <h4>
                    {totalVideos > 0 && totalVideos}
                    {' '}
                    {totalVideos > 1
                      ? intl.formatMessage({
                        id: 'videos',
                        defaultMessage: 'Videos'
                      })
                      : intl.formatMessage({
                        id: 'video',
                        defaultMessage: 'Videos'
                      })}
                  </h4>
                </div>
                <ScrollListVideo
                  items={videos.map((f) => f.objectInfo)}
                  loading={loading}
                  canLoadmore={totalVideos > videos.length}
                  loadMore={this.handlePagechange.bind(this, 'videos')}
                  notFoundText={intl.formatMessage({
                    id: 'noBookmarkedVideosFound',
                    defaultMessage: 'No bookmarked videos found'
                  })}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<PictureOutlined />} key="galleries">
                <div className="heading-tab">
                  <h4>
                    {totalGalleries > 0 && totalGalleries}
                    {' '}
                    {totalGalleries > 1
                      ? intl.formatMessage({
                        id: 'galleries',
                        defaultMessage: 'Galleries'
                      })
                      : intl.formatMessage({
                        id: 'gallery',
                        defaultMessage: 'Gallery'
                      })}
                  </h4>
                </div>
                <ScrollListGallery
                  items={galleries.map((f) => f.objectInfo)}
                  loading={loading}
                  canLoadmore={totalGalleries > galleries.length}
                  loadMore={this.handlePagechange.bind(this, 'galleries')}
                  notFoundText={intl.formatMessage({
                    id: 'noBookmarkedGalleriesFound',
                    defaultMessage: 'No bookmarked galleries found'
                  })}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<ShopOutlined />} key="products">
                <div className="heading-tab">
                  <h4>
                    {totalProducts > 0 && totalProducts}
                    {' '}
                    {totalProducts > 1
                      ? intl.formatMessage({
                        id: 'products',
                        defaultMessage: 'Products'
                      })
                      : intl.formatMessage({
                        id: 'product',
                        defaultMessage: 'Product'
                      })}
                  </h4>
                </div>
                <ScrollListProduct
                  loading={loading}
                  items={products.map((p) => p.objectInfo)}
                  canLoadmore={totalProducts > products.length}
                  loadMore={this.handlePagechange.bind(this, 'products')}
                  notFoundText={intl.formatMessage({
                    id: 'noBookmarkedProductsFound',
                    defaultMessage: 'No bookmarked products found'
                  })}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={<ModelIcon />} key="performers">
                <div className="heading-tab">
                  <h4>
                    {totalPerformers > 0 && totalPerformers}
                    {' '}
                    {totalPerformers > 1
                      ? intl.formatMessage({
                        id: 'models',
                        defaultMessage: 'Models'
                      })
                      : intl.formatMessage({
                        id: 'model',
                        defaultMessage: 'Model'
                      })}
                  </h4>
                </div>
                <ScrollListPerformers
                  loading={loading}
                  performers={performers.map((p) => p.objectInfo)}
                  total={totalPerformers}
                  loadMore={this.handlePagechange.bind(this, 'performers')}
                  notFoundText={intl.formatMessage({
                    id: 'noBookmarkedProfilesFound',
                    defaultMessage: 'No bookmarked profiles found'
                  })}
                  countries={countries}
                />
              </Tabs.TabPane>
            </Tabs>
          </div>
        </div>
      </Layout>
    );
  }
}
const mapState = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});
export default injectIntl(connect(mapState)(FavouriteVideoPage));
