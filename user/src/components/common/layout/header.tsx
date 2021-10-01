import { PureComponent } from 'react';
import {
  Layout, Badge, message, Drawer, Divider, Avatar
} from 'antd';
import { connect } from 'react-redux';
import Link from 'next/link';
import { IUser, StreamSettings } from 'src/interfaces';
import { logout } from '@redux/auth/actions';
import {
  ShoppingCartOutlined, UserOutlined, HistoryOutlined, CreditCardOutlined,
  VideoCameraOutlined, FireOutlined, NotificationOutlined, BookOutlined,
  DollarOutlined, PictureOutlined, StarOutlined, ShoppingOutlined, BankOutlined,
  LogoutOutlined, HeartOutlined, BlockOutlined, PlusCircleOutlined
} from '@ant-design/icons';
import {
  HomeIcon, ModelIcon, PlusIcon, MessageIcon, UserIcon
} from 'src/icons';
import Router, { withRouter, Router as RouterEvent } from 'next/router';
import {
  messageService, authService, streamService
} from 'src/services';
import { Event, SocketContext } from 'src/socket';
import { addPrivateRequest, accessPrivateRequest } from '@redux/streaming/actions';
// import { PrivateCallCard } from '@components/streaming/private-call-request-card';
import { updateUIValue } from 'src/redux/ui/actions';
import { updateBalance } from '@redux/user/actions';
import './header.less';

interface IProps {
  updateBalance: Function;
  updateUIValue: Function;
  currentUser?: IUser;
  logout: Function;
  router: any;
  ui: any;
  privateRequests: any;
  addPrivateRequest: Function;
  accessPrivateRequest: Function;
  settings: StreamSettings;
}

class Header extends PureComponent<IProps> {
  state = {
    totalNotReadMessage: 0,
    openProfile: false,
    openCallRequest: false
  };

  async componentDidMount() {
    RouterEvent.events.on(
      'routeChangeStart',
      async () => this.setState({
        openProfile: false, openCallRequest: false
      })
    );
  }

  async componentDidUpdate(prevProps: any) {
    const { currentUser } = this.props;
    if (currentUser._id && prevProps.currentUser._id !== currentUser._id) {
      this.handleCountNotificationMessage();
    }
  }

  handleMessage = async (event) => {
    event && this.setState({ totalNotReadMessage: event.total });
  };

  async handleCountNotificationMessage() {
    const data = await (await messageService.countTotalNotRead()).data;
    if (data) {
      this.setState({ totalNotReadMessage: data.total });
    }
  }

  handlePrivateChat(data: { conversationId: string; user: IUser }) {
    const { addPrivateRequest: _addPrivateRequest } = this.props;
    message.success(`${data?.user?.name || data?.user?.username}'ve sent you a private call request`, 10);
    _addPrivateRequest({ ...data });
    this.setState({ openCallRequest: true });
  }

  async handleDeclineCall(conversationId: string) {
    const { accessPrivateRequest: handleRemoveRequest } = this.props;
    try {
      await streamService.declinePrivateChat(conversationId);
      handleRemoveRequest(conversationId);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    }
  }

  async handleUpdateBalance(event) {
    const { currentUser, updateBalance: handleUpdateBalance } = this.props;
    if (currentUser.isPerformer) {
      handleUpdateBalance({ token: event.token });
    }
  }

  async handlePaymentStatusCallback({ redirectUrl }) {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  onThemeChange = (theme: string) => {
    const { updateUIValue: handleUpdateUI } = this.props;
    handleUpdateUI({ theme });
  };

  async beforeLogout() {
    const { logout: handleLogout } = this.props;
    const token = authService.getToken();
    const socket = this.context;
    token && socket && await socket.emit('auth/logout', {
      token
    });
    socket && socket.close();
    handleLogout();
  }

  render() {
    const {
      currentUser, router, ui, privateRequests, settings
    } = this.props;
    const {
      totalNotReadMessage, openProfile, openCallRequest
    } = this.state;

    return (
      <div className="main-header">
        <Event
          event="nofify_read_messages_in_conversation"
          handler={this.handleMessage.bind(this)}
        />
        <Event
          event="private-chat-request"
          handler={this.handlePrivateChat.bind(this)}
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
              <ul className={currentUser._id ? 'nav-icons' : 'nav-icons custom'}>
                {currentUser._id && currentUser.isPerformer && (
                  <li className={router.asPath === `/${currentUser.username || currentUser._id}` ? 'active' : ''}>
                    <Link
                      href={{
                        pathname: '/model/profile',
                        query: { username: currentUser.username || currentUser._id }
                      }}
                      as={`/${currentUser.username || currentUser._id}`}
                    >
                      <a>
                        <HomeIcon />
                      </a>
                    </Link>
                  </li>
                )}
                {currentUser._id && !currentUser.isPerformer && (
                  <li className={router.pathname === '/home' ? 'active' : ''}>
                    <Link href="/home">
                      <a>
                        <HomeIcon />
                      </a>
                    </Link>
                  </li>
                )}
                {currentUser && currentUser._id && currentUser.isPerformer && (
                  <>
                    {/* <Tooltip key="live" title="Go Live">
                      <li className={router.pathname === '/model/live' ? 'active' : ''}>
                        <Link href="/home" as="/home">
                          <a>
                            <VideoCameraAddOutlined />
                          </a>
                        </Link>
                      </li>
                    </Tooltip> */}
                    <li className={router.pathname === '/model/my-post/create' ? 'active' : ''}>
                      <Link href="/model/my-post/create">
                        <a>
                          <PlusIcon />
                        </a>
                      </Link>
                    </li>
                  </>
                )}
                {currentUser._id && !currentUser.isPerformer && (
                  <li key="model" className={router.pathname === '/model' ? 'active' : ''}>
                    <Link href="/model">
                      <a>
                        <ModelIcon />
                      </a>
                    </Link>
                  </li>
                )}
                {currentUser._id && (
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
                {!currentUser._id && [
                  <li key="logo" className="logo-nav">
                    <Link href="/">
                      <a>{ui.logo ? <img src={ui.logo} alt="logo" /> : `${ui.siteName}`}</a>
                    </Link>
                  </li>,
                  <li key="login" className={router.pathname === '/' ? 'active' : ''}>
                    <Link href="/">
                      <a>Login</a>
                    </Link>
                  </li>,
                  <li key="signup" className={router.pathname === '/auth/register' ? 'active' : ''}>
                    <Link href="/auth/register">
                      <a>Sign Up</a>
                    </Link>
                  </li>
                ]}
                {currentUser._id && (
                  <li key="avatar" aria-hidden onClick={() => this.setState({ openProfile: true })}>
                    {currentUser?.avatar ? <Avatar src={currentUser?.avatar || '/static/no-avatar.png'} /> : <UserIcon />}
                  </li>
                )}
              </ul>
            </div>
          </Layout.Header>
          {/* <Drawer
            title="Private Call Requests"
            closable
            onClose={() => this.setState({ openCallRequest: false })}
            visible={openCallRequest}
            key="private-call-drawer"
            className={ui.theme === 'light' ? 'profile-drawer' : 'profile-drawer dark'}
            width={280}
          >
            {privateRequests.length > 0 ? privateRequests.map((request) => (
              <PrivateCallCard key={request.conversationId} request={request} settings={settings} onDecline={this.handleDeclineCall.bind(this)} />
            )) : <p className="text-center">No Call Request</p>}
          </Drawer> */}
          <Drawer
            title={(
              <div className="profile-user">
                <img className="avatar" src={currentUser?.avatar || '/static/no-avatar.png'} alt="avatar" />
                <span className="profile-name">
                  {currentUser?.name || 'N/A'}
                  <span className="sub-name">
                    @
                    {currentUser?.username || 'n/a'}
                  </span>
                  <a aria-hidden className="user-balance" onClick={() => !currentUser?.isPerformer && Router.push('/token-package')}>
                    <img src="/static/coin-ico.png" alt="gem" />
                    {(currentUser?.balance || 0).toFixed(2)}
                    {!currentUser?.isPerformer && <PlusCircleOutlined />}
                  </a>
                </span>
              </div>
            )}
            closable
            onClose={() => this.setState({ openProfile: false })}
            visible={openProfile}
            key="profile-drawer"
            className={ui.theme === 'light' ? 'profile-drawer' : 'profile-drawer dark'}
            width={280}
          >
            {currentUser.isPerformer && (
              <div className="profile-menu-item">
                <Link href="/model/account" as="/model/account">
                  <div className={router.pathname === '/model/account' ? 'menu-item active' : 'menu-item'}>
                    <UserOutlined />
                    {' '}
                    Edit Profile
                  </div>
                </Link>
                <Link href={{ pathname: '/model/my-subscriber' }} as="/model/my-subscriber">
                  <div className={router.pathname === '/model/my-subscriber' ? 'menu-item active' : 'menu-item'}>
                    <StarOutlined />
                    {' '}
                    Subscribers
                  </div>
                </Link>
                <Link href={{ pathname: '/model/block-user' }} as="/model/block-user">
                  <div className={router.pathname === '/model/block-user' ? 'menu-item active' : 'menu-item'}>
                    <BlockOutlined />
                    {' '}
                    Black List
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
                    Feeds
                  </div>
                </Link>
                <Link href="/model/my-video" as="/model/my-video">
                  <div className={router.pathname === '/model/my-video' ? 'menu-item active' : 'menu-item'}>
                    <VideoCameraOutlined />
                    {' '}
                    Videos
                  </div>
                </Link>
                <Link href="/model/my-store" as="/model/my-store">
                  <div className={router.pathname === '/model/my-store' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingOutlined />
                    {' '}
                    Store
                  </div>
                </Link>
                <Link href="/model/my-gallery" as="/model/my-gallery">
                  <div className={router.pathname === '/model/my-gallery' ? 'menu-item active' : 'menu-item'}>
                    <PictureOutlined />
                    {' '}
                    Galleries
                  </div>
                </Link>
                <Divider />
                <Link href={{ pathname: '/model/my-order' }} as="/model/my-order">
                  <div className={router.pathname === '/model/my-order' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    Orders
                  </div>
                </Link>
                <Link href="/model/earning" as="/model/earning">
                  <div className={router.pathname === '/model/earning' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    Earnings
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
            {!currentUser.isPerformer && (
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
                <Divider />
                <Link href="/user/bookmarks" as="/user/bookmarks">
                  <div className={router.pathname === '/model/account' ? 'menu-item active' : 'menu-item'}>
                    <BookOutlined />
                    {' '}
                    Bookmarks
                  </div>
                </Link>
                <Link href="/user/my-subscription" as="/user/my-subscription">
                  <div className={router.pathname === '/user/my-subscription' ? 'menu-item active' : 'menu-item'}>
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
                    Orders
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
        </div>
      </div>
    );
  }
}

Header.contextType = SocketContext;

const mapState = (state: any) => ({
  currentUser: { ...state.user.current },
  ui: { ...state.ui },
  ...state.streaming
});
const mapDispatch = {
  logout, addPrivateRequest, accessPrivateRequest, updateUIValue, updateBalance
};
export default withRouter(connect(mapState, mapDispatch)(Header)) as any;
