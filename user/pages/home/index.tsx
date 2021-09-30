import {
  Layout, message, Tooltip, Alert, Input
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { HomePerformers } from '@components/performer';
import { Banner } from '@components/common';
import { getBanners } from '@redux/banner/actions';
import { getFeeds, moreFeeds, removeFeedSuccess } from '@redux/feed/actions';
import { performerService, feedService } from '@services/index';
import {
  IFeed, IPerformer, ISettings, IUser
} from 'src/interfaces';
import ScrollListFeed from '@components/post/scroll-list';
import {
  SyncOutlined, TagOutlined, SearchOutlined, CloseOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { debounce } from 'lodash';
import './index.less';

interface IProps {
  ui: any;
  settings: ISettings;
  user: IUser;
  bannerState: any;
  getBanners: Function;
  performers: IPerformer[];
  getFeeds: Function;
  moreFeeds: Function;
  feedState: any;
  removeFeedSuccess: Function;
}

class HomePage extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    itemPerPage: 12,
    feedPage: 0,
    loadingPerformer: false,
    isFreeSubscription: '',
    randomPerformers: [],
    orientation: '',
    keyword: '',
    openSearch: false
  }

  componentDidMount() {
    this.getBanners();
    this.getPerformers();
    this.getFeeds();
  }

  async onGetFreePerformers() {
    const { isFreeSubscription } = this.state;
    await this.setState({ isFreeSubscription: isFreeSubscription ? '' : true });
    this.getPerformers();
  }

  async onDeleteFeed(feed: IFeed) {
    const { removeFeedSuccess: handleRemoveFeed } = this.props;
    if (!window.confirm('Are you sure to delete this post?')) return;
    try {
      await feedService.delete(feed._id);
      message.success('Removed post successfully');
      handleRemoveFeed({ feed });
    } catch (e) {
      message.error('Something went wrong, please try again later');
    }
  }

  async onFilterFeed(value: string) {
    await this.setState({ orientation: value, feedPage: 0 });
    this.getFeeds();
  }

  onSearchFeed = debounce(async (e) => {
    await this.setState({ keyword: e, feedPage: 0 });
    this.getFeeds();
  }, 600)

  async getFeeds() {
    const { getFeeds: handleGetFeeds, user } = this.props;
    const {
      itemPerPage, feedPage, keyword, orientation
    } = this.state;
    handleGetFeeds({
      q: keyword,
      orientation,
      limit: itemPerPage,
      offset: itemPerPage * feedPage,
      isHome: !!user.verifiedEmail
    });
  }

  getBanners() {
    const { getBanners: handleGetBanners } = this.props;
    handleGetBanners({ status: 'active', limit: 99 });
  }

  async getPerformers() {
    const { isFreeSubscription } = this.state;
    try {
      await this.setState({ loadingPerformer: true });
      const performers = await (
        await performerService.randomSearch({ isFreeSubscription })
      ).data.data;
      this.setState({ randomPerformers: performers, loadingPerformer: false });
    } catch {
      this.setState({ loadingPerformer: false });
    }
  }

  async loadmoreFeeds() {
    const { feedState, moreFeeds: handleGetMore, user } = this.props;
    const { items: posts, total: totalFeeds } = feedState;
    const { feedPage, itemPerPage } = this.state;
    if (posts.length >= totalFeeds) return;
    this.setState({ feedPage: feedPage + 1 }, () => {
      handleGetMore({
        limit: itemPerPage,
        offset: (feedPage + 1) * itemPerPage,
        isHome: !!user.verifiedEmail
      });
    });
  }

  render() {
    const {
      ui, feedState, user, bannerState, settings
    } = this.props;
    const { items: banners } = bannerState;
    const { items: feeds, total: totalFeeds, requesting: loadingFeed } = feedState;
    const topBanners = banners && banners.length > 0 && banners.filter((b) => b.position === 'top');
    // const leftBanners = banners && banners.length > 0 && banners.filter(b => b.position === 'left')
    // const rightBanners = banners && banners.length > 0 && banners.filter(b => b.position === 'right')
    // const middleBanners = banners && banners.length > 0 && banners.filter(b => b.position === 'middle')
    // const bottomBanners = banners && banners.length > 0 && banners.filter((b) => b.position === 'bottom');
    const {
      randomPerformers, loadingPerformer, isFreeSubscription, openSearch
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Home
          </title>
        </Head>
        <div className="home-page">
          <Banner banners={topBanners} />
          <div style={{ position: 'relative' }}>
            <div className="main-container">
              <div className="home-heading">
                <h3>HOME</h3>
                <div className="search-bar-feed">
                  <Input
                    className={openSearch ? 'active' : ''}
                    prefix={<SearchOutlined />}
                    placeholder="Type to search here ..."
                    onChange={(e) => {
                      e.persist();
                      this.onSearchFeed(e.target.value);
                    }}
                  />
                  <a aria-hidden className="open-search" onClick={() => this.setState({ openSearch: !openSearch })}>
                    {!openSearch ? <SearchOutlined /> : <CloseOutlined />}
                  </a>
                </div>
              </div>
              <div className="home-container">
                <div className="left-container">
                  {user._id && !user.verifiedEmail && settings.requireEmailVerification && <Link href={user.isPerformer ? '/model/account' : '/user/account'}><a><Alert type="error" style={{ margin: '15px 0', textAlign: 'center' }} message="Please verify your email address, click here to update!" /></a></Link>}
                  <div className="visit-history">
                    <div className="top-story">
                      <a>Suggested Models</a>
                      <a href="/model"><small>View all</small></a>
                    </div>
                    <div className="story-list">
                      {!loadingPerformer && randomPerformers.length > 0 && randomPerformers.map((per) => (
                        <Link key={per._id} href={{ pathname: '/model/profile', query: { username: per?.username || per?._id } }} as={`${per?.username || per?._id}`}>
                          <div className="story-per-card" title={per?.name || per?.username || 'N/A'}>
                            <img className="per-avatar" alt="avatar" src={per?.avatar || '/static/no-avatar.png'} />
                            <Tooltip key={per._id} title={per?.name || per?.username}><div className="per-name">{per?.name || per?.username || 'N/A'}</div></Tooltip>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {!loadingPerformer && !randomPerformers?.length && <p className="text-center">No profile was found</p>}
                  </div>
                  {/* <div className="filter-feed">
                    <FilterOutlined />
                    <Button disabled={loadingFeed} className={orientation === '' ? 'active' : ''} onClick={() => this.onFilterFeed('')}>All</Button>
                    <Button disabled={loadingFeed} className={orientation === 'female' ? 'active' : ''} onClick={() => this.onFilterFeed('female')}>Female</Button>
                    <Button disabled={loadingFeed} className={orientation === 'male' ? 'active' : ''} onClick={() => this.onFilterFeed('male')}>Male</Button>
                    <Button disabled={loadingFeed} className={orientation === 'couple' ? 'active' : ''} onClick={() => this.onFilterFeed('couple')}>Couples</Button>
                    <Button disabled={loadingFeed} className={orientation === 'transgender' ? 'active' : ''} onClick={() => this.onFilterFeed('transgender')}>Trans</Button>
                  </div> */}
                  {!loadingFeed && !totalFeeds && (
                    <div className="main-container custom text-center" style={{ margin: '10px 0' }}>
                      <Alert
                        type="warning"
                        message={(
                          <a href="/model">
                            <SearchOutlined />
                            {' '}
                            Find someone to follow
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
                <div className="right-container">
                  <div className="suggestion-bl">
                    <div className="sug-top">
                      <span style={{ width: '55%' }}>SUGGESTIONS</span>
                      <span style={{ width: '45%', textAlign: randomPerformers.length < 4 ? 'right' : 'left' }}>
                        <a aria-hidden className="free-btn" onClick={this.onGetFreePerformers.bind(this)}><Tooltip title={isFreeSubscription ? 'Show all' : 'Show only free'}><TagOutlined className={isFreeSubscription ? 'active' : ''} /></Tooltip></a>
                        <a aria-hidden className="reload-btn" onClick={this.getPerformers.bind(this)}><Tooltip title="Refresh"><SyncOutlined spin={loadingPerformer} /></Tooltip></a>
                      </span>
                    </div>
                    {!loadingPerformer && randomPerformers && randomPerformers.length > 0 && (
                      <HomePerformers performers={randomPerformers} />
                    )}
                    {!loadingPerformer && !randomPerformers?.length && <p className="text-center">No profile was found</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* {middleBanners && middleBanners.length > 0 && (
                <Banner banners={middleBanners} />
              )}
              {bottomBanners && bottomBanners.length > 0 && (
                <Banner banners={bottomBanners} />
              )} */}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  bannerState: { ...state.banner.listBanners },
  user: { ...state.user.current },
  feedState: { ...state.feed.feeds },
  settings: { ...state.settings }
});

const mapDispatch = {
  getBanners, getFeeds, moreFeeds, removeFeedSuccess
};
export default connect(mapStates, mapDispatch)(HomePage);
