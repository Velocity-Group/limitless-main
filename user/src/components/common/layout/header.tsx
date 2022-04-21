import { PureComponent } from 'react';
import {
  Layout, Badge, Drawer, Divider, Avatar, Modal, Button
} from 'antd';
import { connect } from 'react-redux';
import Link from 'next/link';
import { IUser, IUIConfig, StreamSettings } from 'src/interfaces';
import { logout } from '@redux/auth/actions';
import {
  ShoppingCartOutlined, UserOutlined, HistoryOutlined, CreditCardOutlined,
  VideoCameraOutlined, FireOutlined, NotificationOutlined, BookOutlined,
  DollarOutlined, PictureOutlined, StarOutlined, ShoppingOutlined, BankOutlined,
  LogoutOutlined, HeartOutlined, BlockOutlined, PlusCircleOutlined, StopOutlined
} from '@ant-design/icons';
import {
  HomeIcon, ModelIcon, PlusIcon, MessageIcon, UserIcon, LiveIcon
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
import { SubscribePerformerModal } from 'src/components/subscription/subscribe-performer-modal';

interface IProps {
  updateBalance: Function;
  updateUIValue: Function;
  user: IUser;
  logout: Function;
  router: any;
  ui: IUIConfig;
  privateRequests: any;
  addPrivateRequest: Function;
  accessPrivateRequest: Function;
  settings: StreamSettings;
}

class Header extends PureComponent<IProps> {
  state = {
    totalNotReadMessage: 0,
    openProfile: false,
    openStripeAlert: false
  };

  async componentDidMount() {
    RouterEvent.events.on('routeChangeStart', this.handleChangeRoute);
    const { user, router } = this.props;
    if (user._id) {
      this.handleCountNotificationMessage();
      if ((router.pathname !== '/model/banking' && user.isPerformer && !user?.stripeAccount?.payoutsEnabled)
        || (router.pathname !== '/model/banking' && user.isPerformer && !user?.stripeAccount?.detailsSubmitted)) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ openStripeAlert: true });
      }
    }
  }

  async componentDidUpdate(prevProps: any) {
    const { user, router } = this.props;
    const { openStripeAlert } = this.state;
    if (user._id && prevProps.user._id !== user._id) {
      this.handleCountNotificationMessage();
      if ((router.pathname !== '/model/banking' && user.isPerformer && !user?.stripeAccount?.payoutsEnabled)
        || (router.pathname !== '/model/banking' && user.isPerformer && !user?.stripeAccount?.detailsSubmitted)) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ openStripeAlert: true });
      }
    }
    // eslint-disable-next-line react/no-did-update-set-state
    if (openStripeAlert && router.pathname === '/model/banking') this.setState({ openStripeAlert: false });
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
  }

  handleMessage = async (event) => {
    event && this.setState({ totalNotReadMessage: event.total });
  };

  handleSubscribe = (username) => {
    Router.push(
      { pathname: '/streaming/details', query: { username } },
      `/streaming/${username}`
    );
  };

  async handleCountNotificationMessage() {
    const data = await (await messageService.countTotalNotRead()).data;
    if (data) {
      this.setState({ totalNotReadMessage: data.total });
    }
  }

  // handlePrivateChat(data: { conversationId: string; user: IUser }) {
  //   const { addPrivateRequest: _addPrivateRequest } = this.props;
  //   message.success(`${data?.user?.name || data?.user?.username}'ve sent you a private call request`, 10);
  //   _addPrivateRequest({ ...data });
  //   this.setState({ openCallRequest: true });
  // }

  // async handleDeclineCall(conversationId: string) {
  //   const { accessPrivateRequest: handleRemoveRequest } = this.props;
  //   try {
  //     await streamService.declinePrivateChat(conversationId);
  //     handleRemoveRequest(conversationId);
  //   } catch (e) {
  //     const err = await e;
  //     message.error(err?.message || 'Error occured, please try again later');
  //   }
  // }

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

  // onThemeChange = (theme: string) => {
  //   const { updateUIValue: handleUpdateUI } = this.props;
  //   handleUpdateUI({ theme });
  // };

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
      user, router, ui, settings
    } = this.props;
    const {
      totalNotReadMessage, openProfile, openStripeAlert
    } = this.state;

    return (
      <div className="main-header">
        <Event
          event="nofify_read_messages_in_conversation"
          handler={this.handleMessage.bind(this)}
        />
        {/* <Event
          event="private-chat-request"
          handler={this.handlePrivateChat.bind(this)}
        /> */}
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
                  <li key="login" className={router.pathname === '/' ? 'active' : ''}>
                    <Link href="/">
                      <a>Log In</a>
                    </Link>
                  </li>,
                  <li key="signup" className={router.pathname === '/auth/register' ? 'active' : ''}>
                    <Link href="/auth/register">
                      <a>Sign Up</a>
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
                    {user?.name || 'N/A'}
                    <span className="sub-name">
                      @
                      {user?.username || 'n/a'}
                    </span>
                  </span>
                </div>
                <div className="sub-info">
                  <a aria-hidden className="user-balance" onClick={() => !user?.isPerformer && Router.push('/token-package')}>
                    <img src="/static/coin-ico.png" alt="gem" />
                    {(user?.balance || 0).toFixed(2)}
                    {!user?.isPerformer && <PlusCircleOutlined />}
                  </a>
                  {user.isPerformer ? (
                    <Link href="/model/my-subscriber">
                      <a>
                        <StarOutlined />
                        {' '}
                        {shortenLargeNumber(user?.stats?.subscribers || 0)}
                        {' '}
                        Followers
                      </a>

                    </Link>
                  ) : (
                    <Link href="/user/my-subscription">
                      <a>
                        <HeartOutlined />
                        {' '}
                        {shortenLargeNumber(user?.stats?.totalSubscriptions || 0)}
                        {' '}
                        Following
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
                    Go Live
                  </div>
                </Link>
                )}
                <Divider />
                <Link href={{ pathname: '/model/profile', query: { username: user.username || user._id } }} as={`/${user.username || user._id}`}>
                  <div className={router.asPath === `/${user.username || user._id}` ? 'menu-item active' : 'menu-item'}>
                    <HomeIcon />
                    {' '}
                    My Profile
                  </div>
                </Link>
                <Link href="/model/account" as="/model/account">
                  <div className={router.pathname === '/model/account' ? 'menu-item active' : 'menu-item'}>
                    <UserOutlined />
                    {' '}
                    Edit Profile
                  </div>
                </Link>
                <Link href={{ pathname: '/model/block-user' }} as="/model/block-user">
                  <div className={router.pathname === '/model/block-user' ? 'menu-item active' : 'menu-item'}>
                    <BlockOutlined />
                    {' '}
                    Blacklist
                  </div>
                </Link>
                <Link href={{ pathname: '/model/block-countries' }} as="/model/block-countries">
                  <div className={router.pathname === '/model/block-countries' ? 'menu-item active' : 'menu-item'}>
                    <StopOutlined />
                    {' '}
                    Block Countries
                  </div>
                </Link>
                <Link href={{ pathname: '/model/banking' }} as="/model/banking">
                  <div className={router.pathname === '/model/banking' ? 'menu-item active' : 'menu-item'}>
                    <BankOutlined />
                    {' '}
                    Banking (to earn)
                  </div>
                </Link>
                <Divider />
                <Link href="/model/my-post" as="/model/my-post">
                  <div className={router.pathname === '/model/my-post' ? 'menu-item active' : 'menu-item'}>
                    <FireOutlined />
                    {' '}
                    My Feeds
                  </div>
                </Link>
                <Link href="/model/my-video" as="/model/my-video">
                  <div className={router.pathname === '/model/my-video' ? 'menu-item active' : 'menu-item'}>
                    <VideoCameraOutlined />
                    {' '}
                    My Videos
                  </div>
                </Link>
                <Link href="/model/my-store" as="/model/my-store">
                  <div className={router.pathname === '/model/my-store' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingOutlined />
                    {' '}
                    My Products
                  </div>
                </Link>
                <Link href="/model/my-gallery" as="/model/my-gallery">
                  <div className={router.pathname === '/model/my-gallery' ? 'menu-item active' : 'menu-item'}>
                    <PictureOutlined />
                    {' '}
                    My Galleries
                  </div>
                </Link>
                <Divider />
                <Link href={{ pathname: '/model/my-order' }} as="/model/my-order">
                  <div className={router.pathname === '/model/my-order' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    Order History
                  </div>
                </Link>
                <Link href="/model/earning" as="/model/earning">
                  <div className={router.pathname === '/model/earning' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    Earning History
                  </div>
                </Link>
                <Link href="/model/payout-request" as="/model/payout-request">
                  <div className={router.pathname === '/model/payout-request' ? 'menu-item active' : 'menu-item'}>
                    <NotificationOutlined />
                    {' '}
                    Payout Requests
                  </div>
                </Link>
                <Divider />
                <div aria-hidden className="menu-item" onClick={() => this.beforeLogout()}>
                  <LogoutOutlined />
                  {' '}
                  Sign Out
                </div>
              </div>
            )}
            {!user.isPerformer && (
              <div className="profile-menu-item">
                <Link href="/user/account" as="/user/account">
                  <div className={router.pathname === '/user/account' ? 'menu-item active' : 'menu-item'}>
                    <UserOutlined />
                    {' '}
                    Edit Profile
                  </div>
                </Link>
                <Link href="/user/cards" as="/user/cards">
                  <div className={router.pathname === '/user/cards' ? 'menu-item active' : 'menu-item'}>
                    <CreditCardOutlined />
                    {' '}
                    Add Card
                  </div>
                </Link>
                <Link href="/user/bookmarks" as="/user/bookmarks">
                  <div className={router.pathname === '/user/bookmarks' ? 'menu-item active' : 'menu-item'}>
                    <BookOutlined />
                    {' '}
                    Bookmarks
                  </div>
                </Link>
                <Link href="/user/my-subscription" as="/user/my-subscription">
                  <div className={router.pathname === '/user/my-subscriptions' ? 'menu-item active' : 'menu-item'}>
                    <HeartOutlined />
                    {' '}
                    Subscriptions
                  </div>
                </Link>
                <Divider />
                <Link href="/user/orders" as="/user/orders">
                  <div className={router.pathname === '/user/orders' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    Order History
                  </div>
                </Link>
                <Link href="/user/payment-history" as="/user/payment-history">
                  <div className={router.pathname === '/user/payment-history' ? 'menu-item active' : 'menu-item'}>
                    <HistoryOutlined />
                    {' '}
                    Payment History
                  </div>
                </Link>
                <Link href="/user/token-transaction" as="/user/token-transaction">
                  <div className={router.pathname === '/user/token-transaction' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    Token Transactions
                  </div>
                </Link>
                <Divider />
                <div className="menu-item" aria-hidden onClick={() => this.beforeLogout()}>
                  <LogoutOutlined />
                  {' '}
                  Sign Out
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
          <Modal
            title={null}
            footer={null}
            width={500}
            maskClosable={false}
            visible={openStripeAlert}
          >
            <div className="confirm-subscription-form">
              <div className="text-center">
                <h2 className="secondary-color">
                  Hi
                  {' '}
                  {user?.name || user?.username || 'there'}
                </h2>
                <h3 className="secondary-color">
                  You have not connected with stripe. You cannot post any content until it&apos;s configured. Please complete
                  the onboarding process & start earning money!
                </h3>
              </div>
              <div>
                <Button className="primary" onClick={() => Router.push('/model/banking')}>Okay, take me there</Button>
                &nbsp;
                <Button className="secondary" onClick={() => this.setState({ openStripeAlert: false })}>No, i will connect later</Button>
              </div>
            </div>
          </Modal>
          <SubscribePerformerModal onSubscribed={this.handleSubscribe} />
        </div>
      </div>
    );
  }
}

Header.contextType = SocketContext;

const mapState = (state: any) => ({
  user: state.user.current,
  ui: state.ui,
  ...state.streaming
});
const mapDispatch = {
  logout, addPrivateRequest, accessPrivateRequest, updateUIValue, updateBalance
};
export default withRouter(connect(mapState, mapDispatch)(Header)) as any;
