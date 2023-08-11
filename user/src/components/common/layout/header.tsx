import { PureComponent } from 'react';
import {
  Layout, Badge, Drawer, Divider, Avatar
} from 'antd';
import { connect } from 'react-redux';
import Link from 'next/link';
import {
  IUser, StreamSettings, IUIConfig, ISettings
} from 'src/interfaces';
import { logout } from '@redux/auth/actions';
import {
  ShoppingCartOutlined, UserOutlined, HistoryOutlined, CreditCardOutlined,
  VideoCameraOutlined, FireOutlined, NotificationOutlined, BookOutlined, IdcardOutlined,
  DollarOutlined, PictureOutlined, StarOutlined, ShoppingOutlined, BankOutlined,
  LogoutOutlined, HeartOutlined, BlockOutlined, PlusCircleOutlined, StopOutlined,
  TeamOutlined, CommentOutlined, GiftOutlined
} from '@ant-design/icons';
import {
  HomeIcon, ModelIcon, PlusIcon, MessageIcon, UserIcon, LiveIcon, TickIcon, WalletSvg
} from 'src/icons';
import Router, { withRouter, Router as RouterEvent } from 'next/router';
import {
  messageService, authService
} from 'src/services';
import { Event, SocketContext } from 'src/socket';
import { addPrivateRequest, accessPrivateRequest } from '@redux/streaming/actions';
import { updateUIValue } from 'src/redux/ui/actions';
import { updateBalance } from '@redux/user/actions';
import { shortenLargeNumber } from '@lib/number';
import './header.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  updateBalance: Function;
  user: IUser;
  logout: Function;
  router: any;
  ui: IUIConfig;
  settings: StreamSettings;
  intl: IntlShape
  config: ISettings;
}

class Header extends PureComponent<IProps> {
  state = {
    totalNotReadMessage: 0,
    openProfile: false
  };

  componentDidMount() {
    RouterEvent.events.on('routeChangeStart', this.handleChangeRoute);
    const { user } = this.props;
    if (user._id) {
      this.handleCountNotificationMessage();
      this.handleCheckVerifiedDocument();
    }
  }

  componentDidUpdate(prevProps: any) {
    const { user } = this.props;
    if (user._id && prevProps.user._id !== user._id) {
      this.handleCountNotificationMessage();
      this.handleCheckVerifiedDocument();
    }
  }

  componentWillUnmount() {
    RouterEvent.events.off('routeChangeStart', this.handleChangeRoute);
    const token = authService.getToken();
    const socket = this.context;
    token && socket && socket.emit('auth/logout', { token });
  }

  handleChangeRoute = () => {
    this.setState({
      openProfile: false
    });
  };

  handleMessage = async (event) => {
    event && this.setState({ totalNotReadMessage: event.total });
  };

  handleSubscribe = (username) => {
    Router.push(
      { pathname: '/streaming/details', query: { username } },
      `/streaming/${username}`
    );
  };

  handleCheckVerifiedDocument = () => {
    const { user } = this.props;
    if (user._id && user.isPerformer && !user.verifiedDocument && !Router.router.pathname.includes('/id-verification')) {
      Router.push('/id-verification');
    }
  }

  async handleCountNotificationMessage() {
    const data = await (await messageService.countTotalNotRead()).data;
    if (data) {
      this.setState({ totalNotReadMessage: data.total });
    }
  }

  async handleUpdateBalance(event) {
    const { user, updateBalance: handleUpdateBalance } = this.props;
    if (user.isPerformer) {
      handleUpdateBalance({ token: event.token });
    }
  }

  async handlePaymentStatusCallback({ redirectUrl }) {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  async beforeLogout() {
    const { logout: handleLogout } = this.props;
    const token = authService.getToken();
    const socket = this.context;
    token && socket && await socket.emit('auth/logout', {
      token
    });
    handleLogout();
  }

  render() {
    const {
      user, router, ui, settings, config, intl
    } = this.props;
    const {
      totalNotReadMessage, openProfile
    } = this.state;

    return (
      <div className="main-header">
        <Event
          event="nofify_read_messages_in_conversation"
          handler={this.handleMessage.bind(this)}
        />
        <Event
          event="update_balance"
          handler={this.handleUpdateBalance.bind(this)}
        />
        <Event
          event="payment_status_callback"
          handler={this.handlePaymentStatusCallback.bind(this)}
        />
        <div className="main-container">
          <Layout.Header className="header" id="layoutHeader">
            <div className="nav-bar">
              <ul className={user._id ? 'nav-icons' : 'nav-icons custom'}>
                {user._id && (
                  <li className={router.pathname === '/home' ? 'active' : ''}>
                    <Link href="/home">
                      <a>
                        <HomeIcon />
                      </a>
                    </Link>
                  </li>
                )}
                {user._id && (
                  <>
                    {user?.isPerformer && (
                      <li className={router.pathname === '/model/my-post/create' ? 'active' : ''}>
                        <Link href="/model/my-post/create">
                          <a>
                            <PlusIcon />
                          </a>
                        </Link>
                      </li>
                    )}
                  </>
                )}
                {user._id && !user.isPerformer && (
                  <li key="model" className={router.pathname === '/model' ? 'active' : ''}>
                    <Link href="/model">
                      <a>
                        <ModelIcon />
                      </a>
                    </Link>
                  </li>
                )}
                {user._id && (
                  <li key="messenger" className={router.pathname === '/messages' ? 'active' : ''}>
                    <Link href="/messages">
                      <a>
                        <MessageIcon />
                        <Badge
                          className="cart-total"
                          count={totalNotReadMessage}
                          showZero
                        />
                      </a>
                    </Link>
                  </li>
                )}
                {!user._id && [
                  <li key="logo" className="logo-nav">
                    <Link href="/home">
                      <a>{ui.logo ? <img src={ui.logo} alt="logo" /> : `${ui.siteName}`}</a>
                    </Link>
                  </li>,
                  <li key="login" className={router.pathname === '/auth/login' ? 'active' : ''}>
                    <Link href="/auth/login">
                      <a>{intl.formatMessage({ id: 'login', defaultMessage: 'Login' })}</a>
                    </Link>
                  </li>,
                  <li key="signup" className={router.pathname === '/auth/register' ? 'active' : ''}>
                    <Link href="/auth/register">
                      <a>{intl.formatMessage({ id: 'signUp', defaultMessage: 'Sign Up' })}</a>
                    </Link>
                  </li>
                ]}
                {user._id && (
                  <li key="avatar" aria-hidden onClick={() => this.setState({ openProfile: true })}>
                    {user?.avatar ? <Avatar src={user?.avatar || '/static/no-avatar.png'} /> : <UserIcon />}
                  </li>
                )}
              </ul>
            </div>
          </Layout.Header>
          <Drawer
            title={(
              <>
                <div className="profile-user">
                  <img className="avatar" src={user?.avatar || '/static/no-avatar.png'} alt="avatar" />
                  <span className="profile-name">
                    <span>
                      {user?.name || 'N/A'}
                      {' '}
                      <TickIcon />
                    </span>
                    <span className="sub-name">
                      @
                      {user?.username || 'n/a'}
                    </span>
                  </span>
                </div>
                <div className="sub-info">
                  <a aria-hidden className="user-balance" onClick={() => (!user?.isPerformer ? Router.push('/wallet') : Router.push('/model/earning'))}>
                    <WalletSvg />
                    {' '}
                    $
                    {(user?.balance || 0).toFixed(2)}
                    {!user?.isPerformer && <PlusCircleOutlined />}
                  </a>
                  {user.isPerformer ? (
                    <Link href="/model/my-subscriber">
                      <a>
                        <StarOutlined />
                        {intl.formatMessage({ id: 'subscribers', defaultMessage: 'Subscribers' })}
                        {' '}
                        {shortenLargeNumber(user?.stats?.subscribers || 0)}
                      </a>
                    </Link>
                  ) : (
                    <Link href="/user/my-subscription">
                      <a>
                        <HeartOutlined />
                        {intl.formatMessage({ id: 'subscribers', defaultMessage: 'Subscribers' })}
                        {' '}
                        {shortenLargeNumber(user?.stats?.totalSubscriptions || 0)}
                      </a>
                    </Link>
                  )}
                </div>
              </>
            )}
            closable
            onClose={() => this.setState({ openProfile: false })}
            visible={openProfile}
            key="profile-drawer"
            className={ui.theme === 'light' ? 'profile-drawer' : 'profile-drawer dark'}
            width={280}
          >
            {user.isPerformer && (
              <div className="profile-menu-item">
                {settings?.agoraEnable && (
                  <Link href={{ pathname: '/model/live' }} as="/model/live">
                    <div className={router.asPath === '/model/live' ? 'menu-item active' : 'menu-item'}>
                      <LiveIcon />
                      {' '}
                      {intl.formatMessage({ id: 'goLive', defaultMessage: 'Go Live' })}
                    </div>
                  </Link>
                )}
                <Link href={{ pathname: '/model/profile', query: { username: user.username || user._id } }} as={`/${user.username || user._id}`}>
                  <div className={router.asPath === `/${user.username || user._id}` ? 'menu-item active' : 'menu-item'}>
                    <HomeIcon />
                    {' '}
                    {intl.formatMessage({ id: 'myProfile', defaultMessage: 'My Profile' })}
                  </div>
                </Link>
                <Link href="/model/account">
                  <div className={router.pathname === '/model/account' ? 'menu-item active' : 'menu-item'}>
                    <UserOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'editProfile', defaultMessage: 'Edit Profile' })}
                  </div>
                </Link>
                <Link href={{ pathname: '/model/block-user' }} as="/model/block-user">
                  <div className={router.pathname === '/model/block-user' ? 'menu-item active' : 'menu-item'}>
                    <BlockOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'blacklist', defaultMessage: 'Blacklist' })}
                  </div>
                </Link>
                <Link href={{ pathname: '/model/block-countries' }} as="/model/block-countries">
                  <div className={router.pathname === '/model/block-countries' ? 'menu-item active' : 'menu-item'}>
                    <StopOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'blockCountries', defaultMessage: 'Block Countries' })}
                  </div>
                </Link>
                <Link href={{ pathname: '/id-verification' }}>
                  <div className={router.pathname === '/id-verification' ? 'menu-item active' : 'menu-item'}>
                    <IdcardOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'verificationToPost', defaultMessage: 'Verification (to post)' })}
                  </div>
                </Link>
                <Link href={{ pathname: '/model/mass-messages' }} as="/model/mass-messages">
                  <div className={router.pathname === '/model/mass-messages' ? 'menu-item active' : 'menu-item'}>
                    <CommentOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'sendMassMessages', defaultMessage: 'Send Mass Messages' })}
                  </div>
                </Link>
                <Link href={{ pathname: '/banking' }}>
                  <div className={router.pathname === '/banking' ? 'menu-item active' : 'menu-item'}>
                    <BankOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'bankingToEarn', defaultMessage: 'Banking (To Earn)' })}
                  </div>
                </Link>
                <Divider />
                <Link href="/referral" as="/referral">
                  <div className={router.pathname === '/referral' ? 'menu-item active' : 'menu-item'}>
                    <GiftOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'referral', defaultMessage: 'Referral' })}
                  </div>
                </Link>
                <Divider />
                <Link href="/model/my-post" as="/model/my-post">
                  <div className={router.pathname === '/model/my-post' ? 'menu-item active' : 'menu-item'}>
                    <FireOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'myFeeds', defaultMessage: 'My Feeds' })}
                  </div>
                </Link>
                <Link href="/model/my-video" as="/model/my-video">
                  <div className={router.pathname === '/model/my-video' ? 'menu-item active' : 'menu-item'}>
                    <VideoCameraOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'myVideos', defaultMessage: 'My Videos' })}
                  </div>
                </Link>
                <Link href="/model/my-store" as="/model/my-store">
                  <div className={router.pathname === '/model/my-store' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'myProducts', defaultMessage: 'My Products' })}
                  </div>
                </Link>
                <Link href="/model/my-gallery" as="/model/my-gallery">
                  <div className={router.pathname === '/model/my-gallery' ? 'menu-item active' : 'menu-item'}>
                    <PictureOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'myGalleries', defaultMessage: 'My Galleries' })}
                  </div>
                </Link>
                <Link href="/model/live-streaming/request" as="/model/live-streaming/request">
                  <div className={router.pathname === '/model/live-streaming/request' ? 'menu-item active' : 'menu-item'}>
                    <TeamOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'myLiveStreamingRequest', defaultMessage: 'My Live Streaming Request' })}
                  </div>
                </Link>
                <Divider />
                <Link href={{ pathname: '/model/my-order' }} as="/model/my-order">
                  <div className={router.pathname === '/model/my-order' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'orderHistory', defaultMessage: 'Order History' })}
                  </div>
                </Link>
                <Link href="/model/earning" as="/model/earning">
                  <div className={router.pathname === '/model/earning' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'earningHistory', defaultMessage: 'Earning History' })}
                  </div>
                </Link>
                <Link href="/payout-request" as="/payout-request">
                  <div className={router.pathname === '/payout-request' ? 'menu-item active' : 'menu-item'}>
                    <NotificationOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'payoutRequests', defaultMessage: 'Payout Requests' })}
                  </div>
                </Link>
                <Divider />
                <div aria-hidden className="menu-item" onClick={() => this.beforeLogout()}>
                  <LogoutOutlined />
                  {' '}
                  {intl.formatMessage({ id: 'signOut', defaultMessage: 'Sign Out' })}
                </div>
              </div>
            )}
            {!user.isPerformer && (
              <div className="profile-menu-item">
                <Link href="/user/account">
                  <div className={router.pathname === '/user/account' ? 'menu-item active' : 'menu-item'}>
                    <UserOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'editProfile', defaultMessage: 'Edit Profile' })}
                  </div>
                </Link>
                {config.paymentGateway === 'stripe' && (
                <Link href="/user/cards" as="/user/cards">
                  <div className={router.pathname === '/user/cards' ? 'menu-item active' : 'menu-item'}>
                    <CreditCardOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'addCard', defaultMessage: 'Add Card' })}
                  </div>
                </Link>
                )}
                <Link href={{ pathname: '/banking' }} as="/banking">
                  <div className={router.pathname === '/banking' ? 'menu-item active' : 'menu-item'}>
                    <BankOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'bankingToEarn', defaultMessage: 'Banking (To Earn)' })}
                  </div>
                </Link>
                <Link href="/user/bookmarks" as="/user/bookmarks">
                  <div className={router.pathname === '/user/bookmarks' ? 'menu-item active' : 'menu-item'}>
                    <BookOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'bookmarks', defaultMessage: 'Bookmarks' })}
                  </div>
                </Link>
                <Link href="/user/my-subscription" as="/user/my-subscription">
                  <div className={router.pathname === '/user/my-subscription' ? 'menu-item active' : 'menu-item'}>
                    <HeartOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'subscriptions', defaultMessage: 'Subscriptions' })}
                  </div>
                </Link>
                <Link href="/schedule/live-streaming/request" as="/schedule/live-streaming/request">
                  <div className={router.pathname === '/schedule/live-streaming/request' ? 'menu-item active' : 'menu-item'}>
                    <TeamOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'liveStreamingRequest', defaultMessage: 'Live Streaming Request' })}
                  </div>
                </Link>
                <Divider />
                <Link href="/referral" as="/referral">
                  <div className={router.pathname === '/referral' ? 'menu-item active' : 'menu-item'}>
                    <GiftOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'referral', defaultMessage: 'Referral' })}
                  </div>
                </Link>
                <Divider />
                <Link href="/user/orders" as="/user/orders">
                  <div className={router.pathname === '/user/orders' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'orderHistory', defaultMessage: 'Order History' })}
                  </div>
                </Link>
                <Link href="/user/payment-history">
                  <div className={router.pathname === '/user/payment-history' ? 'menu-item active' : 'menu-item'}>
                    <HistoryOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'paymentHistory', defaultMessage: 'Payment History' })}
                  </div>
                </Link>
                <Link href="/user/wallet-transaction">
                  <div className={router.pathname === '/user/wallet-transaction' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    {intl.formatMessage({ id: 'walletTransactions', defaultMessage: 'Wallet Transactions' })}
                  </div>
                </Link>
                <Divider />
                <Link href="/payout-request" as="/payout-request">
                  <div className={router.pathname === '/payout-request' ? 'menu-item active' : 'menu-item'}>
                    <NotificationOutlined />
                    {' '}
                    Payout Requests
                  </div>
                </Link>
                <div className="menu-item" aria-hidden onClick={() => this.beforeLogout()}>
                  <LogoutOutlined />
                  {' '}
                  {intl.formatMessage({ id: 'signOut', defaultMessage: 'Sign Out' })}
                </div>
              </div>
            )}
            {/* <div className="switchTheme">
              <span>
                <BulbOutlined />
                <span>Switch Theme</span>
              </span>
              <Switch
                onChange={this.onThemeChange.bind(this, ui.theme === 'dark' ? 'light' : 'dark')}
                checked={ui.theme === 'dark'}
                checkedChildren="Dark"
                unCheckedChildren="Light"
              />
            </div> */}
          </Drawer>
        </div>
      </div>
    );
  }
}

Header.contextType = SocketContext;

const mapState = (state: any) => ({
  user: { ...state.user.current },
  ui: { ...state.ui },
  config: { ...state.settings },
  ...state.streaming
});
const mapDispatch = {
  logout, addPrivateRequest, accessPrivateRequest, updateUIValue, updateBalance
};
export default injectIntl(withRouter(connect(mapState, mapDispatch)(Header))) as any;
