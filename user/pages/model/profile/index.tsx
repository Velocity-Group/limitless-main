/* eslint-disable no-nested-ternary */
import {
  Layout, Collapse, Tabs, Button,
  message, Modal, Tooltip
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getVideos, moreVideo } from '@redux/video/actions';
import { getFeeds, moreFeeds, removeFeedSuccess } from '@redux/feed/actions';
import { listProducts, moreProduct } from '@redux/product/actions';
import { moreGalleries, getGalleries } from '@redux/gallery/actions';
import { updateBalance } from '@redux/user/actions';
import {
  performerService, paymentService, feedService, reactionService
} from 'src/services';
import Head from 'next/head';
import {
  CheckCircleOutlined, ArrowDownOutlined, ArrowLeftOutlined, FireOutlined,
  UsergroupAddOutlined, VideoCameraOutlined, PictureOutlined, ShopOutlined,
  HeartOutlined, DollarOutlined, MessageOutlined, EditOutlined, BookOutlined
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

const { Panel } = Collapse;
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
    isSubscribed: false,
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
      this.setState({ isBookMarked: performer.isBookMarked || false, isSubscribed: performer.isSubscribed });
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
      return message.error('Permission denied');
    }
    if (!window.confirm('Are you sure to delete this post?')) return undefined;
    try {
      await feedService.delete(feed._id);
      message.success('Deleted the post successfully');
      handleRemoveFeed({ feed });
    } catch {
      message.error('Something went wrong, please try again later');
    }
    return undefined;
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
      await this.setState({ requesting: false });
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
    const { performer, currentUser, updateBalance: handleUpdateBalance } = this.props;
    const price = this.subscriptionType === 'monthly' ? performer.monthlyPrice : performer.yearlyPrice;
    if (currentUser.balance < price) {
      message.error('Your balance token is not enough');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await paymentService.subscribe({ type: this.subscriptionType, performerId: performer._id });
      this.setState({ isSubscribed: true, openSubscriptionModal: false });
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
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
      await paymentService.tipPerformer({ performerId: performer?._id, price });
      message.info('Thank you for the tip');
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      await this.setState({ submiting: false });
    }
  }

  checkBlock() {
    const { error, redirectToErrorPage: handleRedirect } = this.props;
    if (error && process.browser) {
      return handleRedirect({
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
    return undefined;
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
    return undefined;
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
      isSubscribed,
      isBookMarked,
      openSubscriptionModal,
      requesting,
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
        <div
          className="top-profile"
          style={{ backgroundImage: (currentUser._id === performer._id && `url('${currentUser?.cover || '/static/banner-image.jpg'}')`) || `url('${performer?.cover || '/static/banner-image.jpg'}')` || "url('/static/banner-image.jpg')" }}
        >
          <div className="main-container bg-2nd">
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
          </div>
        </div>
        <div className="main-profile">
          <div className="main-container">
            <div className="fl-col">
              <img
                alt="main-avt"
                src={
                    performer && performer?.avatar
                      ? performer?.avatar
                      : '/static/no-avatar.png'
                  }
              />
              {currentUser?._id !== performer._id && <span className={performer.isOnline ? 'online-status' : 'online-status off'} />}
              <div className="m-user-name">
                <h4>
                  {performer?.name}
                    &nbsp;
                  {currentUser._id === performer._id ? <Link href="/model/account"><a><EditOutlined className="primary-color" /></a></Link> : (
                    <>
                      {performer?.verifiedAccount && (
                        <CheckCircleOutlined className="theme-color" />
                      )}
                    </>
                  )}
                </h4>
                <h5 style={{ textTransform: 'none' }}>
                  @
                  {performer?.username}
                </h5>
              </div>
            </div>
            {currentUser._id
              && !currentUser.isPerformer
              && currentUser._id !== ((performer?._id) || '') && (
                <div className="btn-grp">
                  <div style={{ marginBottom: '4px' }}>
                    {/* <button disabled={requesting} type="button" className={isBookMarked ? 'primary' : 'normal custom'} onClick={this.handleBookmark.bind(this)}>
                      <BookOutlined />
                      {' '}
                      {isBookMarked ? 'Remove from Bookmarks' : 'Add to Bookmarks'}
                    </button> */}
                    <button
                      type="button"
                      className="normal"
                      onClick={() => this.setState({ openTipModal: true })}
                    >
                      <span>
                        <DollarOutlined />
                        {' '}
                        Send Tip
                      </span>
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
                        <span>
                          <MessageOutlined />
                          {' '}
                          Message
                        </span>
                      </Link>
                    </button>
                  </div>
                  {/* {isSubscribed && (
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
                <Collapse
                  expandIconPosition="right"
                  bordered={false}
                  expandIcon={({ isActive }) => (
                    <ArrowDownOutlined rotate={isActive ? 180 : 0} />
                  )}
                  defaultActiveKey={['1']}
                  className="site-collapse-custom-collapse"
                >
                  <Panel
                    header="More info"
                    key="1"
                    className="site-collapse-custom-panel"
                  >
                    <PerformerInfo countries={ui?.countries || []} performer={performer} />
                  </Panel>
                </Collapse>
              </div>
            </div>
            {performer?.isFreeSubscription && !isSubscribed && (
              <div className="subscription-bl">
                <h5>Free Subscription</h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={submiting && this.subscriptionType === 'free'}
                  onClick={() => {
                    this.subscriptionType = 'free';
                    this.setState({ openSubscriptionModal: true });
                  }}
                >
                  FOLLOW FOR FREE
                </button>
              </div>
            )}
            {!performer?.isFreeSubscription && !isSubscribed && (
              <div className="subscription-bl">
                <h5>Yearly Subscription</h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={submiting && this.subscriptionType === 'yearly'}
                  onClick={() => {
                    this.subscriptionType = 'yearly';
                    this.setState({ openSubscriptionModal: true });
                  }}
                >
                  SUBSCRIBE FOR
                  {' '}
                  <img alt="coin" src="/static/coin-ico.png" width="20px" />
                  {performer?.yearlyPrice.toFixed(2)}
                </button>
              </div>
            )}
            {!performer?.isFreeSubscription && !isSubscribed && (
              <div className="subscription-bl">
                <h5>Monthly Subscription</h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={submiting && this.subscriptionType === 'monthly'}
                  onClick={() => {
                    this.subscriptionType = 'monthly';
                    this.setState({ openSubscriptionModal: true });
                  }}
                >
                  SUBSCRIBE FOR
                  {' '}
                  <img alt="coin" src="/static/coin-ico.png" width="20px" />
                  {performer && performer?.monthlyPrice.toFixed(2)}
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
            user={currentUser}
            performer={performer}
            submiting={submiting}
            onFinish={this.sendTip.bind(this)}
          />
        </Modal>
        <Modal
          key="subscribe_performer"
          className="subscription-modal"
          width={350}
          title={null}
          visible={openSubscriptionModal}
          footer={null}
          onCancel={() => this.setState({ openSubscriptionModal: false })}
        >
          <ConfirmSubscriptionPerformerForm
            user={currentUser}
            type={this.subscriptionType || 'monthly'}
            performer={performer}
            submiting={submiting}
            onFinish={this.subscribe.bind(this)}
          />
        </Modal>
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
