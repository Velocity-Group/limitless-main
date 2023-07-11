import {
  Layout, message, Tooltip, Alert, Input
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { HomePerformers } from '@components/performer';
import { Banner } from '@components/common';
import HomeFooter from '@components/common/layout/footer';
import { getFeeds, moreFeeds, removeFeedSuccess } from '@redux/feed/actions';
import {
  performerService,
  feedService,
  bannerService,
  utilsService,
  streamService
} from '@services/index';
import {
  IFeed,
  IPerformer,
  ISettings,
  IUser,
  IBanner,
  IUIConfig,
  ICountry,
  IStream
} from 'src/interfaces';
import ScrollListFeed from '@components/post/scroll-list';
import {
  SyncOutlined,
  TagOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Router from 'next/router';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import { injectIntl, IntlShape } from 'react-intl';
import './index.less';

const StreamListItem = dynamic(
  () => import('@components/streaming/stream-list-item'),
  { ssr: false }
);

interface IProps {
  countries: ICountry[];
  banners: IBanner[];
  streams: IStream[];
  ui: IUIConfig;
  settings: ISettings;
  user: IUser;
  performers: IPerformer[];
  getFeeds: Function;
  moreFeeds: Function;
  feedState: any;
  removeFeedSuccess: Function;
  intl: IntlShape;
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  const bodyHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom <= bodyHeight + 250;
}

class HomePage extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps() {
    const [banners, countries, streams] = await Promise.all([
      bannerService.search({ limit: 99 }),
      utilsService.countriesList(),
      streamService.search({ limit: 99 })
    ]);
    return {
      banners: banners?.data?.data || [],
      countries: countries?.data || [],
      streams: streams?.data?.data || []
    };
  }

  state = {
    itemPerPage: 12,
    feedPage: 0,
    loadingPerformer: false,
    isFreeSubscription: '',
    randomPerformers: [],
    orientation: '',
    keyword: '',
    openSearch: false,
    showFooter: false
  };

  componentDidMount() {
    this.getPerformers();
    this.getFeeds();
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  // eslint-disable-next-line react/sort-comp
  handleScroll = () => {
    const footer = document.getElementById('main-footer');
    if (isInViewport(footer)) {
      this.setState({ showFooter: false });
    } else {
      this.setState({ showFooter: true });
    }
  };

  handleClick = (stream: IStream) => {
    const { user, intl } = this.props;
    if (!user._id) {
      message.error(
        intl.formatMessage({
          id: 'pleaseLoginOrRegister',
          defaultMessage: 'Please login or register!'
        }),
        5
      );
      Router.push('/auth/login');
      return;
    }
    if (user.isPerformer) return;
    if (!stream?.isSubscribed) {
      message.error(
        intl.formatMessage({
          id: 'pleaseSubscribeToJoinLiveChat',
          defaultMessage: 'Please subscribe to join live chat!'
        }),
        5
      );
      Router.push(
        {
          pathname: '/model/profile',
          query: {
            username:
              stream?.performerInfo?.username || stream?.performerInfo?._id
          }
        },
        `/${stream?.performerInfo?.username || stream?.performerInfo?._id}`
      );
      return;
    }
    Router.push(
      {
        pathname: '/streaming/details',
        query: {
          username:
            stream?.performerInfo?.username || stream?.performerInfo?._id
        }
      },
      `/streaming/${stream?.performerInfo?.username || stream?.performerInfo?._id
      }`
    );
  };

  async onGetFreePerformers() {
    const { isFreeSubscription } = this.state;
    await this.setState({ isFreeSubscription: isFreeSubscription ? '' : true });
    this.getPerformers();
  }

  async onDeleteFeed(feed: IFeed) {
    const { removeFeedSuccess: handleRemoveFeed, intl } = this.props;
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
      message.success(
        intl.formatMessage({
          id: 'postDeletedSuccessfully',
          defaultMessage: 'Post deleted successfully'
        })
      );
      handleRemoveFeed({ feed });
    } catch (e) {
      message.error(
        intl.formatMessage({
          id: 'somethingWentWrong',
          defaultMessage: 'Something went wrong, please try again!'
        })
      );
    }
  }

  async onFilterFeed(value: string) {
    await this.setState({ orientation: value, feedPage: 0 });
    this.getFeeds();
  }

  onSearchFeed = debounce(async (e) => {
    await this.setState({ keyword: e, feedPage: 0 });
    this.getFeeds();
  }, 600);

  async getFeeds() {
    const { getFeeds: handleGetFeeds } = this.props;
    const {
      itemPerPage, feedPage, keyword, orientation
    } = this.state;
    handleGetFeeds({
      q: keyword,
      orientation,
      limit: itemPerPage,
      offset: itemPerPage * feedPage,
      isHome: true
    });
  }

  async getPerformers() {
    const { isFreeSubscription } = this.state;
    const { user } = this.props;
    try {
      await this.setState({ loadingPerformer: true });
      const performers = await (
        await performerService.randomSearch({ isFreeSubscription })
      ).data.data;
      this.setState({
        randomPerformers: performers.filter((p) => p._id !== user._id),
        loadingPerformer: false
      });
    } catch {
      this.setState({ loadingPerformer: false });
    }
  }

  async loadmoreFeeds() {
    const { feedState, moreFeeds: handleGetMore } = this.props;
    const { items: posts, total: totalFeeds } = feedState;
    const { feedPage, itemPerPage } = this.state;
    if (posts.length >= totalFeeds) return;
    this.setState({ feedPage: feedPage + 1 }, () => {
      handleGetMore({
        limit: itemPerPage,
        offset: (feedPage + 1) * itemPerPage,
        isHome: true
      });
    });
  }

  render() {
    const {
      ui, feedState, user, settings, banners, countries, streams, intl
    } = this.props;
    const {
      items: feeds,
      total: totalFeeds,
      requesting: loadingFeed
    } = feedState;
    const topBanners = banners
      && banners.length > 0
      && banners.filter((b) => b.position === 'top');
    const {
      randomPerformers,
      loadingPerformer,
      isFreeSubscription,
      openSearch,
      showFooter
    } = this.state;
    return (
      <Layout>
        <>
          <Head>
            <title>
              {ui && ui.siteName}
              {' '}
              | Home
            </title>
          </Head>
          <div className="home-page">
            <Banner banners={topBanners} />
            <div className="main-container">
              <div className="home-heading">
                <h3>
                  {intl.formatMessage({
                    id: 'homeUpCase',
                    defaultMessage: 'HOME'
                  })}
                </h3>
                <div className="search-bar-feed">
                  <Input
                    className={openSearch ? 'active' : ''}
                    prefix={<SearchOutlined />}
                    placeholder={intl.formatMessage({
                      id: 'typeToSearchHere',
                      defaultMessage: 'Type to search here ...'
                    })}
                    onChange={(e) => {
                      e.persist();
                      this.onSearchFeed(e.target.value);
                    }}
                  />
                  <a
                    aria-hidden
                    className="open-search"
                    onClick={() => this.setState({ openSearch: !openSearch })}
                  >
                    {!openSearch ? <SearchOutlined /> : <CloseOutlined />}
                  </a>
                </div>
              </div>
              <div className="home-container">
                <div className="left-container">
                  {user._id
                    && !user.verifiedEmail
                    && settings.requireEmailVerification && (
                      <Link
                        href={
                          user.isPerformer ? '/model/account' : '/user/account'
                        }
                      >
                        <a>
                          <Alert
                            type="error"
                            style={{ margin: '15px 0', textAlign: 'center' }}
                            message={intl.formatMessage({
                              id: 'pleaseVerifyYourEmailAddressClickHereToUpdate',
                              defaultMessage:
                                'Please verify your email address, click here to update!'
                            })}
                          />
                        </a>
                      </Link>
                  )}
                  <div className="visit-history">
                    <div className="top-story">
                      <a>
                        {intl.formatMessage({
                          id: 'liveVideos',
                          defaultMessage: 'Live Videos'
                        })}
                      </a>
                      <a href="/model">
                        <small>
                          {intl.formatMessage({
                            id: 'liveVideos',
                            defaultMessage: 'Live Videos'
                          })}
                        </small>
                      </a>
                    </div>
                    <div className="story-list">
                      {streams.length > 0 && streams.map((s) => (
                        <StreamListItem stream={s} user={user} key={s._id} />
                      ))}
                      {/* {!streams?.length && <p className="text-center" style={{ margin: '30px 0' }}>No live for now</p>} */}
                    </div>
                  </div>
                  {!loadingFeed && !totalFeeds && (
                    <div
                      className="main-container custom text-center"
                      style={{ margin: '10px 0' }}
                    >
                      <Alert
                        type="warning"
                        message={(
                          <a href="/model">
                            <SearchOutlined />
                            {' '}
                            {intl.formatMessage({
                              id: 'findSomeoneToFollow',
                              defaultMessage: 'Find someone to follow'
                            })}
                          </a>
                        )}
                      />
                    </div>
                  )}
                  <ScrollListFeed
                    items={feeds}
                    canLoadmore={feeds && feeds.length < totalFeeds}
                    loading={loadingFeed}
                    onDelete={this.onDeleteFeed.bind(this)}
                    loadMore={this.loadmoreFeeds.bind(this)}
                  />
                </div>
                <div className="right-container" id="home-right-container">
                  <div className="suggestion-bl">
                    <div className="sug-top">
                      <span className="sug-text">
                        {intl.formatMessage({
                          id: 'suggestionsUpCase',
                          defaultMessage: 'SUGGESTIONS'
                        })}
                      </span>
                      <span
                        className="btns-grp"
                        style={{
                          textAlign:
                            randomPerformers.length < 5 ? 'right' : 'left'
                        }}
                      >
                        <a
                          aria-hidden
                          className="free-btn"
                          onClick={this.onGetFreePerformers.bind(this)}
                        >
                          <Tooltip
                            title={
                              isFreeSubscription
                                ? intl.formatMessage({
                                  id: 'showAll',
                                  defaultMessage: 'Show all'
                                })
                                : intl.formatMessage({
                                  id: 'showOnlyFree',
                                  defaultMessage: 'Show only free'
                                })
                            }
                          >
                            <TagOutlined
                              className={isFreeSubscription ? 'active' : ''}
                            />
                          </Tooltip>
                        </a>
                        <a
                          aria-hidden
                          className="reload-btn"
                          onClick={this.getPerformers.bind(this)}
                        >
                          <Tooltip title={intl.formatMessage({ id: 'refresh', defaultMessage: 'Refresh' })}>
                            <SyncOutlined spin={loadingPerformer} />
                          </Tooltip>
                        </a>
                      </span>
                    </div>
                    <HomePerformers
                      countries={countries}
                      performers={randomPerformers}
                    />
                    {!loadingPerformer && !randomPerformers?.length && (
                      <p className="text-center">
                        {intl.formatMessage({
                          id: 'noProfileWasFound',
                          defaultMessage: 'No profile was found'
                        })}
                      </p>
                    )}
                    <div
                      className={
                        !showFooter ? 'home-footer' : 'home-footer active'
                      }
                    >
                      <HomeFooter customId="home-footer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  feedState: { ...state.feed.feeds },
  settings: { ...state.settings }
});

const mapDispatch = {
  getFeeds,
  moreFeeds,
  removeFeedSuccess
};
export default injectIntl(connect(mapStates, mapDispatch)(HomePage));
