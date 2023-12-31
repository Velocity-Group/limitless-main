import {
  Layout,
  Tabs,
  Button,
  message,
  Modal,
  Image,
  Popover,
  Tooltip
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getVideos, moreVideo } from '@redux/video/actions';
import { getFeeds, moreFeeds, removeFeedSuccess } from '@redux/feed/actions';
import { setSubscription } from '@redux/subscription/actions';
import { listProducts, moreProduct } from '@redux/product/actions';
import { moreGalleries, getGalleries } from '@redux/gallery/actions';
import { updateBalance } from '@redux/user/actions';
import {
  performerService, tokenTransactionService, feedService, reactionService,
  utilsService, followService
} from 'src/services';
import Head from 'next/head';
import {
  ArrowLeftOutlined, FireOutlined, EditOutlined, HeartOutlined, DollarOutlined, HeartFilled,
  UsergroupAddOutlined, VideoCameraOutlined, PictureOutlined, ShoppingOutlined, BookOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { TickIcon, ShareIcon, MessageIcon } from 'src/icons';
import ScrollListProduct from '@components/product/scroll-list-item';
import ScrollListFeed from '@components/post/scroll-list';
import ScrollListVideo from '@components/video/scroll-list-item';
import ScrollListGallery from '@components/gallery/scroll-list-gallery';
import PerformerInfo from '@components/performer/table-info';
import TipPerformerForm from '@components/performer/tip-form';
import ShareButtons from '@components/performer/share-profile';
import SearchPostBar from '@components/post/search-bar';
import { VideoPlayer } from '@components/common';
import {
  IPerformer, IUser, IUIConfig, IFeed, ICountry, ISettings
} from 'src/interfaces';
import { shortenLargeNumber } from '@lib/index';
import Link from 'next/link';
import Router from 'next/router';
import Error from 'next/error';
import '@components/performer/performer.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  error: any;
  user: IUser;
  performer: IPerformer;
  listProducts: Function;
  getVideos: Function;
  moreVideo: Function;
  moreProduct: Function;
  videoState: any;
  productState: any;
  getGalleries: Function;
  moreGalleries: Function;
  galleryState: any;
  feedState: any;
  getFeeds: Function;
  moreFeeds: Function;
  removeFeedSuccess: Function;
  updateBalance: Function;
  countries: ICountry[];
  intl: IntlShape;
  settings: ISettings;
  setSubscription: Function;
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

  state = {
    itemPerPage: 12,
    videoPage: 0,
    productPage: 0,
    feedPage: 0,
    galleryPage: 0,
    showWelcomVideo: false,
    openTipModal: false,
    submiting: false,
    isBookMarked: false,
    requesting: false,
    tab: 'post',
    filter: initialFilter,
    isGrid: false,
    isFollowed: false
  };

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const [performer, countries] = await Promise.all([
        performerService.findOne(query.username, {
          Authorization: ctx.token || ''
        }),
        utilsService.countriesList()
      ]);
      return {
        performer: performer?.data,
        countries: countries?.data || []
      };
    } catch (e) {
      const error = await Promise.resolve(e);
      return { error };
    }
  }

  componentDidMount() {
    const { performer } = this.props;
    if (performer) {
      const notShownWelcomeVideos = localStorage.getItem('notShownWelcomeVideos');
      const showWelcomVideo = !notShownWelcomeVideos || (notShownWelcomeVideos && !notShownWelcomeVideos.includes(performer._id));
      this.setState({ isBookMarked: performer.isBookMarked, showWelcomVideo, isFollowed: !!performer.isFollowed });
      this.loadItems();
    }
  }

  // eslint-disable-next-line react/sort-comp
  handleViewWelcomeVideo() {
    const { performer } = this.props;
    const notShownWelcomeVideos = localStorage.getItem('notShownWelcomeVideos');
    if (!notShownWelcomeVideos?.includes(performer._id)) {
      const Ids = JSON.parse(notShownWelcomeVideos || '[]');
      const values = Array.isArray(Ids)
        ? Ids.concat([performer._id])
        : [performer._id];
      localStorage.setItem('notShownWelcomeVideos', JSON.stringify(values));
    }
    this.setState({ showWelcomVideo: false });
  }

  async handleDeleteFeed(feed: IFeed) {
    const { intl, user, removeFeedSuccess: handleRemoveFeed } = this.props;
    if (user._id !== feed.fromSourceId) {
      message.error(
        intl.formatMessage({
          id: 'permissionDenied',
          defaultMessage: 'Permission denied'
        })
      );
      return;
    }
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
      handleRemoveFeed({ feed });
    } catch {
      message.error(
        intl.formatMessage({
          id: 'somethingWentWrong',
          defaultMessage: 'Something went wrong, please try again!'
        })
      );
    }
  }

  handleFollow = async () => {
    const { performer, user } = this.props;
    const { isFollowed, requesting, tab } = this.state;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    if (requesting || user.isPerformer) return;
    try {
      this.setState({ requesting: true });
      if (!isFollowed) {
        await followService.create(performer?._id);
        this.setState({ isFollowed: true, requesting: false });
      } else {
        await followService.delete(performer?._id);
        this.setState({ isFollowed: false, requesting: false });
      }
      if (tab === 'post') {
        this.loadItems();
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  }

  async handleBookmark() {
    const { performer, user, intl } = this.props;
    const { isBookMarked, requesting } = this.state;
    if (requesting || user.isPerformer) return;
    try {
      await this.setState({ requesting: true });
      if (!isBookMarked) {
        await reactionService.create({
          objectId: performer?._id,
          action: 'book_mark',
          objectType: 'performer'
        });
        this.setState({ isBookMarked: true, requesting: false });
      } else {
        await reactionService.delete({
          objectId: performer?._id,
          action: 'book_mark',
          objectType: 'performer'
        });
        this.setState({ isBookMarked: false, requesting: false });
      }
    } catch (e) {
      const error = await e;
      message.error(
        error.message
        || intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
      this.setState({ requesting: false });
    }
  }

  async handleFilterSearch(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.loadItems();
  }

  handleJoinStream = () => {
    const { user, performer, intl } = this.props;
    if (!user._id) {
      message.error(
        intl.formatMessage({
          id: 'pleaseLoginOrRegister',
          defaultMessage: 'Please login or register!'
        })
      );
      return;
    }
    if (user.isPerformer) return;
    if (!performer?.isSubscribed) {
      message.error(
        intl.formatMessage({
          id: 'pleaseSubscribeToThisModel',
          defaultMessage: 'Please subscribe to this model!'
        })
      );
      return;
    }
    Router.push(
      {
        pathname: '/streaming/details',
        query: {
          performer: JSON.stringify(performer),
          username: performer?.username || performer?._id
        }
      },
      `/streaming/${performer?.username || performer?._id}`
    );
  };

  async loadItems() {
    const {
      performer,
      getGalleries: handleGetGalleries,
      getVideos: handleGetVids,
      getFeeds: handleGetFeeds,
      listProducts: handleGetProducts
    } = this.props;
    const { itemPerPage, filter, tab } = this.state;
    const query = {
      limit: itemPerPage,
      offset: 0,
      performerId: performer?._id,
      q: filter.q || '',
      fromDate: filter.fromDate || '',
      toDate: filter.toDate || ''
    };
    switch (tab) {
      case 'post':
        this.setState({ feedPage: 0 }, () => handleGetFeeds({
          ...query
        }));
        break;
      case 'photo':
        this.setState({ galleryPage: 0 }, () => handleGetGalleries({
          ...query
        }));
        break;
      case 'video':
        this.setState({ videoPage: 0 }, () => handleGetVids({
          ...query
        }));
        break;
      case 'store':
        this.setState({ productPage: 0 }, () => handleGetProducts({
          ...query
        }));
        break;
      default:
        break;
    }
  }

  async sendTip(price: number) {
    const {
      performer, user, updateBalance: handleUpdateBalance, intl
    } = this.props;
    if (user.balance < price) {
      message.error(
        intl.formatMessage({
          id: 'youHaveAnInsufficientTokenBalance',
          defaultMessage:
            'You have an insufficient token balance. Please top up.'
        })
      );
      Router.push('/wallet');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await tokenTransactionService.sendTip(performer?._id, {
        performerId: performer?._id,
        price
      });
      message.success(
        intl.formatMessage({
          id: 'thankYouForTheTip',
          defaultMessage: 'Thank you for the tip'
        })
      );
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(
        err.message
        || intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
    } finally {
      this.setState({ requesting: false, openTipModal: false });
    }
  }

  async loadMoreItem() {
    const {
      feedPage,
      videoPage,
      productPage,
      itemPerPage,
      galleryPage,
      tab,
      filter
    } = this.state;
    const {
      moreFeeds: getMoreFeed,
      moreVideo: getMoreVids,
      moreProduct: getMoreProd,
      moreGalleries: getMoreGallery,
      performer
    } = this.props;
    const query = {
      limit: itemPerPage,
      performerId: performer._id,
      q: filter.q || '',
      fromDate: filter.fromDate || '',
      toDate: filter.toDate || ''
    };
    if (tab === 'post') {
      this.setState(
        {
          feedPage: feedPage + 1
        },
        () => getMoreFeed({
          ...query,
          offset: (feedPage + 1) * itemPerPage
        })
      );
    }
    if (tab === 'video') {
      this.setState(
        {
          videoPage: videoPage + 1
        },
        () => getMoreVids({
          ...query,
          offset: (videoPage + 1) * itemPerPage
        })
      );
    }
    if (tab === 'photo') {
      await this.setState(
        {
          galleryPage: galleryPage + 1
        },
        () => {
          getMoreGallery({
            ...query,
            offset: (galleryPage + 1) * itemPerPage
          });
        }
      );
    }
    if (tab === 'store') {
      this.setState(
        {
          productPage: productPage + 1
        },
        () => getMoreProd({
          ...query,
          offset: (productPage + 1) * itemPerPage
        })
      );
    }
  }

  render() {
    const {
      error,
      performer,
      ui,
      user,
      feedState,
      videoState,
      productState,
      galleryState,
      countries,
      settings,
      setSubscription: updateSubscription,
      intl
    } = this.props;
    if (error) {
      return (
        <Error
          statusCode={error?.statusCode || 404}
          title={
            error?.message
            || intl.formatMessage({
              id: 'cannotFindThisPage',
              defaultMessage: 'Sorry, we can\'t find this page'
            })
          }
        />
      );
    }
    const {
      items: feeds = [],
      total: totalFeed = 0,
      requesting: loadingFeed
    } = feedState;
    const {
      items: videos = [],
      total: totalVideos = 0,
      requesting: loadingVideo
    } = videoState;
    const {
      items: products = [],
      total: totalProducts = 0,
      requesting: loadingPrd
    } = productState;
    const {
      items: galleries = [],
      total: totalGalleries = 0,
      requesting: loadingGallery
    } = galleryState;
    const {
      showWelcomVideo,
      openTipModal,
      submiting,
      isBookMarked,
      tab,
      isGrid,
      isFollowed
    } = this.state;

    const haveContent = performer?.stats?.totalFeeds || performer?.stats?.totalVideos || performer?.stats?.totalPhotos || performer?.stats?.totalProducts > 0;

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
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content={`${ui?.siteName} | ${performer?.name || performer?.username
            }`}
          />
          <meta
            property="og:image"
            content={performer?.avatar || '/static/no-avatar.png'}
          />
          <meta property="og:description" content={performer?.bio} />
          <meta name="twitter:card" content="summary" />
          <meta
            name="twitter:title"
            content={`${ui?.siteName} | ${performer?.name || performer?.username
            }`}
          />
          <meta
            name="twitter:image"
            content={performer?.avatar || '/static/no-avatar.png'}
          />
          <meta name="twitter:description" content={performer?.bio} />
        </Head>
        <div className="main-container">
          <div
            className="top-profile"
            style={{
              backgroundImage: `url('${performer?.cover || '/static/banner-image.jpg'
              }')`
            }}
          >
            <div className="bg-2nd">
              <div className="top-banner">
                <a
                  aria-hidden
                  className="arrow-back"
                  onClick={() => Router.back()}
                >
                  <ArrowLeftOutlined />
                </a>
                <div className="stats-row">
                  <div className="tab-stat">
                    <div className="tab-item">
                      <span>
                        {shortenLargeNumber(performer?.stats?.totalFeeds || 0)}
                        {' '}
                        <FireOutlined />
                      </span>
                    </div>
                    <div className="tab-item">
                      <span>
                        {shortenLargeNumber(performer?.stats?.totalVideos || 0)}
                        {' '}
                        <VideoCameraOutlined />
                      </span>
                    </div>
                    <div className="tab-item">
                      <span>
                        {shortenLargeNumber(performer?.stats?.totalPhotos || 0)}
                        {' '}
                        <PictureOutlined />
                      </span>
                    </div>
                    <div className="tab-item">
                      <span>
                        {shortenLargeNumber(
                          performer?.stats?.totalProducts || 0
                        )}
                        {' '}
                        <ShoppingOutlined />
                      </span>
                    </div>
                    <div className="tab-item">
                      <span>
                        {shortenLargeNumber(performer?.stats?.likes || 0)}
                        {' '}
                        <HeartOutlined />
                      </span>
                    </div>
                    <div className="tab-item">
                      <span>
                        {shortenLargeNumber(performer?.stats?.subscribers || 0)}
                        {' '}
                        <UsergroupAddOutlined />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="main-profile">
          <div className="main-container">
            <div className="fl-col">
              <Image
                alt="main-avt"
                src={performer?.avatar || '/static/no-avatar.png'}
                fallback="/static/no-avatar.png"
              />
              {user?._id !== performer?._id && <span className={performer?.isOnline > 0 ? 'online-status' : 'online-status off'} />}
              <div className="m-user-name">
                <h4>
                  {performer?.name || 'N/A'}
                  &nbsp;
                  {performer?.verifiedAccount && <TickIcon />}
                  &nbsp;
                  {performer?.live > 0 && user?._id !== performer?._id && <a aria-hidden onClick={this.handleJoinStream} className="live-status">Live</a>}
                  {user?._id === performer?._id && <Link href="/model/account"><a><EditOutlined className="primary-color" /></a></Link>}
                </h4>
                <h5 style={{ textTransform: 'none' }}>
                  @
                  {performer?.username || 'n/a'}
                </h5>
              </div>
            </div>
            <div className="btn-grp">
              <Tooltip title={isFollowed ? intl.formatMessage({
                id: 'following',
                defaultMessage: 'Following'
              }) : intl.formatMessage({
                id: 'follow',
                defaultMessage: 'Follow'
              })}
              >
                <Button
                  disabled={!user._id || user.isPerformer}
                  className={isBookMarked ? 'active' : ''}
                  onClick={() => this.handleFollow()}
                >
                  {isFollowed ? <HeartFilled /> : <HeartOutlined />}
                </Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: 'oneOneLiveStreaming', defaultMessage: '1-1 Live Streaming' })}>
                <Button
                  disabled={!user._id || user.isPerformer}
                  className="normal"
                  onClick={() => Router.push({
                    pathname: '/schedule/live-streaming',
                    query: {
                      performerId: performer._id
                    }
                  }, `/schedule/live-streaming?performerId=${performer._id}`)}
                >
                  <TeamOutlined />
                </Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({
                id: 'sendTip',
                defaultMessage: 'Send Tip'
              })}
              >
                <Button
                  disabled={!user._id || user.isPerformer}
                  onClick={() => this.setState({ openTipModal: true })}
                >
                  <DollarOutlined />
                </Button>
              </Tooltip>
              <Tooltip title={intl.formatMessage({
                id: 'sendMessage',
                defaultMessage: 'Send Message'
              })}
              >
                <Button
                  disabled={!user._id || user.isPerformer}
                  onClick={() => Router.push({
                    pathname: '/messages',
                    query: {
                      toSource: 'performer',
                      toId: (performer?._id) || ''
                    }
                  })}
                >
                  <MessageIcon />
                </Button>
              </Tooltip>
              <Tooltip title={isBookMarked ? intl.formatMessage({
                id: 'removeFromBookmarks',
                defaultMessage: 'Remove from Bookmarks'
              }) : intl.formatMessage({
                id: 'addToBookmarks',
                defaultMessage: 'Add to Bookmarks'
              })}
              >
                <Button
                  disabled={!user._id || user.isPerformer}
                  className={isBookMarked ? 'active' : ''}
                  onClick={() => this.handleBookmark()}
                >
                  <BookOutlined />
                </Button>
              </Tooltip>
              <Popover
                title={intl.formatMessage({
                  id: 'shareToSocialNetwork',
                  defaultMessage: 'Share to social network'
                })}
                content={<ShareButtons siteName={ui.siteName} performer={performer} />}
              >
                <Button className="normal">
                  <ShareIcon />
                </Button>
              </Popover>
            </div>
            <div className={user.isPerformer ? 'mar-0 pro-desc' : 'pro-desc'}>
              <PerformerInfo countries={countries} performer={performer} />
            </div>
            {!performer?.isSubscribed && !user.isPerformer && haveContent && (
              <div className="subscription-bl">
                <h5>
                  {intl.formatMessage({
                    id: 'monthlySubscription',
                    defaultMessage: 'Monthly Subscription'
                  })}
                </h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={submiting}
                  onClick={() => {
                    updateSubscription({ showModal: true, performer, subscriptionType: 'monthly' });
                  }}
                  style={{ textTransform: 'uppercase' }}
                >
                  {intl.formatMessage({
                    id: 'monthlySubscriptionFor',
                    defaultMessage: 'Monthly Subscription For'
                  })}
                  {' '}
                  $
                  {performer && performer?.monthlyPrice.toFixed(2)}
                </button>
              </div>
            )}
            {!performer?.isSubscribed && !user.isPerformer && haveContent && (
              <div className="subscription-bl">
                <h5>
                  {intl.formatMessage({
                    id: 'yearlySubscription',
                    defaultMessage: 'Yearly Subscription'
                  })}
                </h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={submiting}
                  onClick={() => {
                    updateSubscription({ showModal: true, performer, subscriptionType: 'yearly' });
                  }}
                  style={{ textTransform: 'uppercase' }}
                >
                  {intl.formatMessage({
                    id: 'yearlySubscriptionFor',
                    defaultMessage: 'Yearly Subscription For'
                  })}
                  {' '}
                  $
                  {performer?.yearlyPrice.toFixed(2)}
                </button>
              </div>
            )}
            {performer?.isFreeSubscription && !performer?.isSubscribed && !user.isPerformer && haveContent && (
              <div className="subscription-bl">
                <h5>
                  {intl.formatMessage({
                    id: 'freeSubscription',
                    defaultMessage: 'Free Subscription'
                  })}
                </h5>
                <button
                  type="button"
                  className="sub-btn"
                  disabled={submiting}
                  onClick={() => {
                    updateSubscription({ showModal: true, performer, subscriptionType: 'free' });
                  }}
                  style={{ textTransform: 'uppercase' }}
                >
                  {intl.formatMessage({
                    id: 'subscribeForFreeFor',
                    defaultMessage: 'Subscribe For Free For'
                  })}
                  {' '}
                  {performer?.durationFreeSubscriptionDays || 1}
                  {' '}
                  {performer?.durationFreeSubscriptionDays > 1 ? intl.formatMessage({
                    id: 'days',
                    defaultMessage: 'DAYS'
                  }) : intl.formatMessage({
                    id: 'day',
                    defaultMessage: 'DAY'
                  })}
                  {settings.paymentGateway === 'stripe' && ` ${intl.formatMessage({
                    id: 'then',
                    defaultMessage: 'THEN'
                  })} ${performer?.monthlyPrice.toFixed(2)} ${intl.formatMessage({
                    id: 'thenMonth',
                    defaultMessage: 'PER MONTH'
                  })}`}
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
                this.setState(
                  { tab: t, filter: initialFilter, isGrid: false },
                  () => this.loadItems()
                );
              }}
            >
              <TabPane tab={<FireOutlined />} key="post">
                <div className="heading-tab">
                  <h4>
                    {totalFeed > 0 && totalFeed}
                    {' '}
                    {totalFeed > 1
                      ? intl.formatMessage({
                        id: 'posts',
                        defaultMessage: 'Posts'
                      })
                      : intl.formatMessage({
                        id: 'post',
                        defaultMessage: 'Post'
                      })}
                  </h4>
                  <SearchPostBar
                    searching={loadingFeed}
                    tab={tab}
                    handleSearch={this.handleFilterSearch.bind(this)}
                    handleViewGrid={(val) => this.setState({ isGrid: val })}
                  />
                </div>
                <div
                  className={
                    isGrid ? 'main-container' : 'main-container custom'
                  }
                >
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
              <TabPane tab={<VideoCameraOutlined />} key="video">
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
                  <SearchPostBar
                    searching={loadingVideo}
                    tab={tab}
                    handleSearch={this.handleFilterSearch.bind(this)}
                    handleViewGrid={(val) => this.setState({ isGrid: val })}
                  />
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
              <TabPane tab={<PictureOutlined />} key="photo">
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
                  <SearchPostBar
                    searching={loadingGallery}
                    tab={tab}
                    handleSearch={this.handleFilterSearch.bind(this)}
                    handleViewGrid={(val) => this.setState({ isGrid: val })}
                  />
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
              <TabPane tab={<ShoppingOutlined />} key="store">
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
                  <SearchPostBar
                    searching={loadingPrd}
                    tab={tab}
                    handleSearch={this.handleFilterSearch.bind(this)}
                  />
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
              className="welcome-video"
              destroyOnClose
              closable={false}
              maskClosable={false}
              width={767}
              visible={showWelcomVideo}
              title={null}
              centered
              onCancel={() => this.setState({ showWelcomVideo: false })}
              footer={[
                <Button
                  key="close"
                  className="secondary"
                  onClick={() => this.setState({ showWelcomVideo: false })}
                >
                  {intl.formatMessage({ id: 'close', defaultMessage: 'Close' })}
                </Button>,
                <Button
                  key="not-show"
                  className="primary"
                  onClick={this.handleViewWelcomeVideo.bind(this)}
                >
                  {intl.formatMessage({ id: 'dontShowThisAgain', defaultMessage: 'Don\'t show this again' })}
                </Button>
              ]}
            >
              <VideoPlayer
                {...{
                  key: `${performer._id}`,
                  controls: true,
                  playsinline: true,
                  sources: [
                    {
                      src: performer?.welcomeVideoPath,
                      type: 'video/mp4'
                    }
                  ]
                }}
              />
            </Modal>
        )}
        <Modal
          key="tip_performer"
          className="subscription-modal"
          visible={openTipModal}
          centered
          onOk={() => this.setState({ openTipModal: false })}
          footer={null}
          width={600}
          title={null}
          onCancel={() => this.setState({ openTipModal: false })}
        >
          <TipPerformerForm
            performer={performer}
            submiting={submiting}
            onFinish={this.sendTip.bind(this)}
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
  user: { ...state.user.current },
  settings: { ...state.settings }
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
  removeFeedSuccess,
  updateBalance,
  setSubscription
};
export default injectIntl(connect(mapStates, mapDispatch)(PerformerProfile));
