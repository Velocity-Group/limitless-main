/* eslint-disable no-nested-ternary */
import {
  Layout, Tabs, Button, Menu,
  message, Modal, Tooltip, Dropdown
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getVideos, moreVideo } from '@redux/video/actions';
import { getFeeds, moreFeeds, removeFeedSuccess } from '@redux/feed/actions';
import { listProducts, moreProduct } from '@redux/product/actions';
import { moreGalleries, getGalleries } from '@redux/gallery/actions';
import { updateBalance } from '@redux/user/actions';
import {
  performerService, purchaseTokenService, feedService, reactionService, paymentService
} from 'src/services';
import Head from 'next/head';
import {
  CheckCircleOutlined, ArrowLeftOutlined, FireOutlined,
  UsergroupAddOutlined, VideoCameraOutlined, PictureOutlined, ShopOutlined, MoreOutlined,
  HeartOutlined, DollarOutlined, MessageOutlined, EditOutlined, ShareAltOutlined, BookOutlined
} from '@ant-design/icons';
import { ScrollListProduct } from '@components/product/scroll-list-item';
import ScrollListFeed from '@components/post/scroll-list';
import { ScrollListVideo } from '@components/video/scroll-list-item';
import { ScrollListGallery } from '@components/gallery/scroll-list-gallery';
import { PerformerInfo } from '@components/performer/table-info';
import Link from 'next/link';
import Router from 'next/router';
import { redirectToErrorPage } from '@redux/system/actions';
import { TipPerformerForm } from '@components/performer/tip-form';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import SearchPostBar from '@components/post/search-bar';
import Loader from '@components/common/base/loader';
import {
  IPerformer, IUser, IUIConfig, IFeed, StreamSettings
} from '../../../src/interfaces';
import '@components/performer/performer.less';

interface IProps {
  ui: IUIConfig;
  currentUser: IUser;
  performer: IPerformer;
  query: any;
  listProducts: Function;
  getVideos: Function;
  moreVideo: Function;
  moreProduct: Function;
  videoState: any;
  productState: any;
  getGalleries: Function;
  moreGalleries: Function;
  galleryState: any;
  error: any;
  redirectToErrorPage: Function;
  feedState: any;
  getFeeds: Function;
  moreFeeds: Function;
  removeFeedSuccess: Function;
  updateBalance: Function;
  settings: StreamSettings;
}

const { TabPane } = Tabs;
const initialFilter = {
  q: '',
  fromDate: '',
  toDate: ''
};

class PerformerProfile extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  subscriptionType = 'monthly';

  state = {
    itemPerPage: 12,
    videoPage: 0,
    productPage: 0,
    feedPage: 0,
    galleryPage: 0,
    viewedVideo: true,
    openTipModal: false,
    submiting: false,
    isBookMarked: false,
    requesting: false,
    openSubscriptionModal: false,
    tab: 'post',
    filter: initialFilter,
    isGrid: false
  };

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const performer = (await (
        await performerService.findOne(query.username, {
          Authorization: ctx.token || ''
        })
      ).data) as IPerformer;
      return {
        performer
      };
    } catch (e) {
      const error = await Promise.resolve(e);
      return { error };
    }
  }

  async componentDidMount() {
    const { performer } = this.props;
    await this.checkBlock();
    if (performer) {
      this.setState({ isBookMarked: performer.isBookMarked || false });
      this.loadItems();
      performerService.increaseView(performer.username);
    }
  }

  handleViewWelcomeVideo() {
    const video = document.getElementById('welcome-video') as HTMLVideoElement;
    video.pause();
    this.setState({ viewedVideo: false });
  }

  async handleDeleteFeed(feed: IFeed) {
    const { currentUser, removeFeedSuccess: handleRemoveFeed } = this.props;
    if (currentUser._id !== feed.fromSourceId) {
      message.error('Permission denied');
      return;
    }
    if (!window.confirm('All earnings are related to this post will be refunded. Are you sure to remove?')) {
      return;
    }
    try {
      await feedService.delete(feed._id);
      message.success('Deleted post success');
      handleRemoveFeed({ feed });
    } catch {
      message.error('Something went wrong, please try again later');
    }
  }

  async handleBookmark() {
    const { performer, currentUser } = this.props;
    const { isBookMarked, requesting } = this.state;
    if (requesting || currentUser.isPerformer) return;
    try {
      await this.setState({ requesting: true });
      if (!isBookMarked) {
        await reactionService.create({
          objectId: performer?._id,
          action: 'book_mark',
          objectType: 'performer'
        });
        this.setState({ isBookMarked: true });
      } else {
        await reactionService.delete({
          objectId: performer?._id,
          action: 'book_mark',
          objectType: 'performer'
        });
        this.setState({ isBookMarked: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    } finally {
      this.setState({ requesting: false });
    }
  }

  async handleFilterSearch(filter) {
    await this.setState({ filter });
    this.loadItems();
  }

  async loadItems() {
    const {
      performer, getGalleries: handleGetGalleries, getVideos: handleGetVids, getFeeds: handleGetFeeds,
      listProducts: handleGetProducts
    } = this.props;
    const {
      itemPerPage, filter, tab
    } = this.state;
    switch (tab) {
      case 'post':
        this.setState({ feedPage: 0 }, () => handleGetFeeds({
          limit: itemPerPage,
          offset: 0,
          performerId: performer?._id,
          q: filter.q || '',
          fromDate: filter.fromDate || '',
          toDate: filter.toDate || ''
        }));
        break;
      case 'photo':
        this.setState({ galleryPage: 0 }, () => handleGetGalleries({
          limit: itemPerPage,
          offset: 0,
          performerId: performer?._id,
          q: filter.q || '',
          fromDate: filter.fromDate || '',
          toDate: filter.toDate || ''
        }));
        break;
      case 'video':
        this.setState({ videoPage: 0 }, () => handleGetVids({
          limit: itemPerPage,
          offset: 0,
          performerId: performer?._id,
          q: filter.q || '',
          fromDate: filter.fromDate || '',
          toDate: filter.toDate || ''
        }));
        break;
      case 'store':
        this.setState({ productPage: 0 }, () => handleGetProducts({
          limit: itemPerPage,
          offset: 0,
          performerId: performer?._id,
          q: filter.q || '',
          fromDate: filter.fromDate || '',
          toDate: filter.toDate || ''
        }));
        break;
      default: break;
    }
  }

  async subscribe() {
    const { performer, currentUser } = this.props;
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
        type: this.subscriptionType,
        performerId: performer._id,
        paymentGateway: 'stripe',
        stripeCardId: currentUser.stripeCardIds[0] // TODO user can choose card
      });
      this.setState({ openSubscriptionModal: false });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
      this.setState({ openSubscriptionModal: false, submiting: false });
    }
  }

  async sendTip(price: number) {
    const { performer, currentUser, updateBalance: handleUpdateBalance } = this.props;
    if (currentUser.balance < price) {
      message.error('Your balance token is not enough');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await purchaseTokenService.sendTip(performer?._id, { performerId: performer?._id, price });
      message.success('Thank you for the tip');
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openTipModal: false });
    }
  }

  checkBlock() {
    const { error, redirectToErrorPage: handleRedirect } = this.props;
    if (error && process.browser) {
      handleRedirect({
        url: '/error',
        error: {
          ...error,
          message:
            error.message === 'BLOCKED_BY_PERFORMER'
              ? 'You have been blocked by this model!'
              : error.message === 'BLOCK_COUNTRY'
                ? 'This model blocked accessbility from your country!'
                : error.message
        }
      });
    }
  }

  async loadMoreItem() {
    const {
      feedPage, videoPage, productPage, itemPerPage, galleryPage,
      tab, filter
    } = this.state;
    const {
      moreFeeds: getMoreFeed,
      moreVideo: getMoreVids,
      moreProduct: getMoreProd,
      moreGalleries: getMoreGallery,
      performer
    } = this.props;
    if (tab === 'post') {
      this.setState({
        feedPage: feedPage + 1
      }, () => getMoreFeed({
        limit: itemPerPage,
        offset: feedPage * itemPerPage,
        performerId: performer._id,
        q: filter.q || '',
        fromDate: filter.fromDate || '',
        toDate: filter.toDate || ''
      }));
    }
    if (tab === 'video') {
      this.setState({
        videoPage: videoPage + 1
      }, () => getMoreVids({
        limit: itemPerPage,
        offset: videoPage * itemPerPage,
        performerId: performer._id,
        q: filter.q || '',
        fromDate: filter.fromDate || '',
        toDate: filter.toDate || ''
      }));
    }
    if (tab === 'photo') {
      await this.setState({
        galleryPage: galleryPage + 1
      }, () => {
        getMoreGallery({
          limit: itemPerPage,
          offset: (galleryPage + 1) * itemPerPage,
          performerId: performer._id,
          q: filter.q || '',
          fromDate: filter.fromDate || '',
          toDate: filter.toDate || ''
        });
      });
    }
    if (tab === 'store') {
      this.setState({
        productPage: productPage + 1
      }, () => getMoreProd({
        limit: itemPerPage,
        offset: productPage * itemPerPage,
        performerId: performer._id,
        q: filter.q || '',
        fromDate: filter.fromDate || '',
        toDate: filter.toDate || ''
      }));
    }
  }

  render() {
    const {
      performer,
      ui,
      currentUser,
      feedState,
      videoState,
      productState,
      galleryState
    } = this.props;
    const { items: feeds = [], total: totalFeed = 0, requesting: loadingFeed } = feedState;
    const { items: videos = [], total: totalVideos = 0, requesting: loadingVideo } = videoState;
    const { items: products = [], total: totalProducts = 0, requesting: loadingPrd } = productState;
    const { items: galleries = [], total: totalGalleries = 0, requesting: loadingGallery } = galleryState;
    const {
      viewedVideo,
      openTipModal,
      submiting,
      isBookMarked,
      openSubscriptionModal,
      tab,
      isGrid
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | ${performer?.name || performer?.username}`}
          </title>
          <meta
            name="keywords"
            content={`${performer?.username}, ${performer?.name}`}
          />
          <meta name="description" content={performer?.bio} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={`${ui?.siteName} | ${performer?.username}`}
            key="title"
          />
          <meta property="og:image" content={performer?.avatar || '/static/no-avatar.png'} />
          <meta
            property="og:keywords"
            content={`${performer?.username}, ${performer?.name}`}
          />
          <meta
            property="og:description"
            content={performer?.bio}
          />
        </Head>
        <div className="top-profile">
          <div className="main-container bg-2nd" style={{ backgroundImage: `url('${performer?.cover || '/static/banner-image.jpg'}')` }}>
            <div className="top-banner">
              <a aria-hidden className="arrow-back" onClick={() => Router.back()}>
                <ArrowLeftOutlined />
              </a>
              <div className="stats-row">
                <div className="t-user-name">
                  {performer?.name || ''}
                  {' '}
                  {performer?.verifiedAccount && (
                    <CheckCircleOutlined className="theme-color" />
                  )}
                </div>
                <div className="tab-stat">
                  <div className="tab-item">
                    <span>
                      {performer?.stats?.totalFeeds || 0}
                      {' '}
                      <FireOutlined />
                    </span>
                  </div>
                  <div className="tab-item">
                    <span>
                      {performer?.stats?.totalVideos || 0}
                      {' '}
                      <VideoCameraOutlined />
                    </span>
                  </div>
                  <div className="tab-item">
                    <span>
                      {performer?.stats?.totalPhotos || 0}
                      {' '}
                      <PictureOutlined />
                    </span>
                  </div>
                  <div className="tab-item">
                    <span>
                      {performer?.stats?.totalProducts || 0}
                      {' '}
                      <ShopOutlined />
                    </span>
                  </div>
                  <div className="tab-item">
                    <span>
                      {performer?.stats?.likes || 0}
                      {' '}
                      <HeartOutlined />
                    </span>
                  </div>
                  <div className="tab-item">
                    <span>
                      {performer?.stats?.subscribers || 0}
                      {' '}
                      <UsergroupAddOutlined />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {!currentUser.isPerformer && (
            <div className="drop-actions">
              <Dropdown overlay={(
                <Menu key="menu_actions">
                  <Menu.Item key="book_mark">
                    <a aria-hidden onClick={this.handleBookmark.bind(this)}>
                      <BookOutlined />
                      {' '}
                      {!isBookMarked ? 'Add to Bookmarks' : 'Remove from Bookmarks'}
                    </a>
                  </Menu.Item>
                </Menu>
              )}
              >
                <a aria-hidden className="dropdown-options" onClick={(e) => e.preventDefault()}>
                  <MoreOutlined />
                </a>
              </Dropdown>
            </div>
            )}
          </div>
        </div>
        <div className="main-profile">
          <div className="main-container">
            <div className="fl-col">
              <img
                alt="main-avt"
                src={performer?.avatar || '/static/no-avatar.png'}
              />
              {currentUser?._id !== performer._id && <span className={performer.isOnline ? 'online-status' : 'online-status off'} />}
              <div className="m-user-name">
                <h4>
                  {performer?.name || 'N/A'}
                    &nbsp;
                  {performer?.verifiedAccount && (
                  <CheckCircleOutlined className="theme-color" />
                  )}
                      &nbsp;
                  {currentUser._id === performer._id && <Link href="/model/account"><a><EditOutlined className="primary-color" /></a></Link>}
                </h4>
                <h5 style={{ textTransform: 'none' }}>
                  @
                  {performer?.username || 'n/a'}
                </h5>
              </div>
            </div>
            {currentUser._id
              && !currentUser.isPerformer
              && currentUser._id !== ((performer?._id) || '') && (
                <div className="btn-grp">
                  <div style={{ marginBottom: '4px' }}>
                    <button
                      type="button"
                      className="normal"
                      onClick={() => this.setState({ openTipModal: true })}
                    >
                      <a title="Send Tip">
                        <DollarOutlined />
                      </a>
                    </button>
                    <button type="button" className="normal">
                      <Link
                        href={{
                          pathname: '/messages',
                          query: {
                            toSource: 'performer',
                            toId: (performer && performer?._id) || ''
                          }
                        }}
                      >
                        <a title="Message">
                          <MessageOutlined />
                        </a>
                      </Link>
                    </button>
                    <button
                      disabled
                      type="button"
                      className="normal"
                    >
                      <a title="Share to social media">
                        <ShareAltOutlined />
                      </a>
                    </button>
                  </div>
                  {/* {performer.isSubscribed && (
                      <div className="stream-btns">
                        <Button
                          type="link"
                          className={performer?.streamingStatus === 'public' ? 'secondary active' : 'secondary'}
                          onClick={() => Router.push(
                            {
                              pathname: '/stream',
                              query: { performer: JSON.stringify(performer) }
                            },
                            `/stream/${performer?.username}`
                          )}
                        >
                          <VideoCameraOutlined />
                          {' '}
                          Public Chat
                        </Button>
                      </div>
                    )} */}
                </div>
            )}
            <div className={currentUser.isPerformer ? 'mar-0 pro-desc' : 'pro-desc'}>
              <div className="show-more">
                {performer.bio && <p>{performer.bio}</p>}
                <PerformerInfo countries={ui?.countries || []} performer={performer} />
              </div>
            </div>
            {!performer.isSubscribed && (
              <div className="subscription-bl">
                <h5>Monthly Subscription</h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={(submiting && this.subscriptionType === 'monthly')}
                  onClick={() => {
                    this.subscriptionType = 'monthly';
                    this.setState({ openSubscriptionModal: true });
                  }}
                >
                  SUBSCRIBE FOR $
                  {' '}
                  {performer && performer?.monthlyPrice.toFixed(2)}
                </button>
              </div>
            )}
            {!performer.isSubscribed && (
              <div className="subscription-bl">
                <h5>Yearly Subscription</h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={(submiting && this.subscriptionType === 'yearly')}
                  onClick={() => {
                    this.subscriptionType = 'yearly';
                    this.setState({ openSubscriptionModal: true });
                  }}
                >
                  SUBSCRIBE FOR $
                  {' '}
                  {performer?.yearlyPrice.toFixed(2)}
                </button>
              </div>
            )}
            {performer?.isFreeSubscription && !performer.isSubscribed && (
              <div className="subscription-bl">
                <h5>Free Subscription</h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={(submiting && this.subscriptionType === 'free')}
                  onClick={() => {
                    this.subscriptionType = 'free';
                    this.setState({ openSubscriptionModal: true });
                  }}
                >
                  SUBSCRIBE FOR FREE IN
                  {' '}
                  {performer.durationFreeSubscriptionDays || 1}
                  {' '}
                  DAYS THEN $
                  {performer.monthlyPrice.toFixed(2)}
                  {' '}
                  MONTHLY LATER
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: '20px' }} />
        <div className="main-container">
          <div className="model-content">
            <Tabs
              defaultActiveKey="post"
              size="large"
              onTabClick={(t: string) => {
                this.setState({ tab: t, filter: initialFilter, isGrid: false }, () => this.loadItems());
              }}
            >
              <TabPane tab={<Tooltip title="Feeds"><FireOutlined /></Tooltip>} key="post">
                <div className="heading-tab">
                  <h4>
                    {totalFeed}
                    {' '}
                    POST
                  </h4>
                  <SearchPostBar searching={loadingFeed} tab={tab} handleSearch={this.handleFilterSearch.bind(this)} handleViewGrid={(val) => this.setState({ isGrid: val })} />
                </div>
                <div className={isGrid ? 'main-container' : 'main-container custom'}>
                  <ScrollListFeed
                    items={feeds}
                    loading={loadingFeed}
                    canLoadmore={feeds && feeds.length < totalFeed}
                    loadMore={this.loadMoreItem.bind(this)}
                    isGrid={isGrid}
                    onDelete={this.handleDeleteFeed.bind(this)}
                  />
                </div>
              </TabPane>
              <TabPane tab={<Tooltip title="Videos"><VideoCameraOutlined /></Tooltip>} key="video">
                <div className="heading-tab">
                  <h4>
                    {totalVideos}
                    {' '}
                    VIDEO
                  </h4>
                  <SearchPostBar searching={loadingVideo} tab={tab} handleSearch={this.handleFilterSearch.bind(this)} handleViewGrid={(val) => this.setState({ isGrid: val })} />
                </div>
                <div className="main-container">
                  <ScrollListVideo
                    items={videos}
                    loading={loadingVideo}
                    canLoadmore={videos && videos.length < totalVideos}
                    loadMore={this.loadMoreItem.bind(this)}
                  />
                </div>
              </TabPane>
              <TabPane tab={<Tooltip title="Galleries"><PictureOutlined /></Tooltip>} key="photo">
                <div className="heading-tab">
                  <h4>
                    {totalGalleries}
                    {' '}
                    GALLERY
                  </h4>
                  <SearchPostBar searching={loadingGallery} tab={tab} handleSearch={this.handleFilterSearch.bind(this)} handleViewGrid={(val) => this.setState({ isGrid: val })} />
                </div>
                <div className="main-container">
                  <ScrollListGallery
                    items={galleries}
                    loading={loadingGallery}
                    canLoadmore={galleries && galleries.length < totalGalleries}
                    loadMore={this.loadMoreItem.bind(this)}
                  />
                </div>
              </TabPane>
              <TabPane tab={<Tooltip title="Shop"><ShopOutlined /></Tooltip>} key="store">
                <div className="heading-tab">
                  <h4>
                    {totalProducts}
                    {' '}
                    PRODUCT
                  </h4>
                  <SearchPostBar searching={loadingPrd} tab={tab} handleSearch={this.handleFilterSearch.bind(this)} />
                </div>
                <ScrollListProduct
                  items={products}
                  loading={loadingPrd}
                  canLoadmore={products && products.length < totalProducts}
                  loadMore={this.loadMoreItem.bind(this)}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
        {performer
          && performer?.welcomeVideoPath
          && performer?.activateWelcomeVideo && (
            <Modal
              key="welcome-video"
              width={768}
              visible={viewedVideo}
              title="Welcome video"
              onOk={this.handleViewWelcomeVideo.bind(this)}
              onCancel={this.handleViewWelcomeVideo.bind(this)}
              footer={(
                <Button
                  type="primary"
                  onClick={this.handleViewWelcomeVideo.bind(this)}
                >
                  Close
                </Button>
              )}
            >
              <video
                autoPlay
                src={performer?.welcomeVideoPath}
                controls
                id="welcome-video"
                style={{ width: '100%' }}
              />
            </Modal>
        )}
        <Modal
          key="tip_performer"
          className="subscription-modal"
          visible={openTipModal}
          onOk={() => this.setState({ openTipModal: false })}
          footer={null}
          width={350}
          title={null}
          onCancel={() => this.setState({ openTipModal: false })}
        >
          <TipPerformerForm
            performer={performer}
            submiting={submiting}
            onFinish={this.sendTip.bind(this)}
          />
        </Modal>
        <Modal
          key="subscribe_performer"
          className="subscription-modal"
          width={500}
          title={null}
          visible={openSubscriptionModal}
          footer={null}
          onCancel={() => this.setState({ openSubscriptionModal: false })}
        >
          <ConfirmSubscriptionPerformerForm
            type={this.subscriptionType || 'monthly'}
            performer={performer}
            submiting={submiting}
            onFinish={this.subscribe.bind(this)}
          />
        </Modal>
        {submiting && <Loader customText="Your payment is on processing, do not reload page until its done" />}
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  videoState: { ...state.video.videos },
  feedState: { ...state.feed.feeds },
  productState: { ...state.product.products },
  galleryState: { ...state.gallery.galleries },
  currentUser: { ...state.user.current },
  ...state.streaming
});

const mapDispatch = {
  getFeeds,
  moreFeeds,
  getVideos,
  moreVideo,
  listProducts,
  moreProduct,
  getGalleries,
  moreGalleries,
  redirectToErrorPage,
  removeFeedSuccess,
  updateBalance
};
export default connect(mapStates, mapDispatch)(PerformerProfile);
