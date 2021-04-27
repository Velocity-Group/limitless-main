import { PureComponent } from 'react';
import {
  Layout, Avatar, Badge, message,
  Tooltip, Modal, Drawer, Divider, Switch
} from 'antd';
import { connect } from 'react-redux';
import Link from 'next/link';
import { IUser, StreamSettings } from 'src/interfaces';
import { logout } from '@redux/auth/actions';
import {
  ShoppingCartOutlined, UserOutlined,
  MessageOutlined, GlobalOutlined, FireOutlined,
  DollarOutlined, HistoryOutlined, StarOutlined, ShoppingOutlined,
  HomeOutlined, LogoutOutlined, SearchOutlined,
  UsergroupAddOutlined, VideoCameraAddOutlined,
  HeartOutlined, PlusSquareOutlined, BulbOutlined
} from '@ant-design/icons';
import './header.less';
import { withRouter, Router as RouterEvent } from 'next/router';
import { addCart } from 'src/redux/cart/actions';
import {
  cartService, messageService, authService, streamService
} from 'src/services';
import { Event, SocketContext } from 'src/socket';
import StoryForm from '@components/story/form';
import { addPrivateRequest, accessPrivateRequest } from '@redux/streaming/actions';
import { PrivateCallCard } from '@components/streaming/private-call-request-card';
import { updateUIValue } from 'src/redux/ui/actions';
import SearchBar from './search-bar';

interface IProps {
  updateUIValue: Function;
  currentUser?: IUser;
  logout: Function;
  router: any;
  ui: any;
  cart: any;
  privateRequests: any;
  addCart: Function;
  addPrivateRequest: Function;
  accessPrivateRequest: Function;
  settings: StreamSettings;
}

class Header extends PureComponent<IProps> {
  state = {
    totalNotReadMessage: 0,
    openAddStory: false,
    openSearch: false,
    openProfile: false,
    openCallRequest: false
  };

  async componentDidMount() {
    if (process.browser) {
      const { cart, currentUser, addCart: handleAddCart } = this.props;
      RouterEvent.events.on(
        'routeChangeStart',
        async () => this.setState({
          openProfile: false, openSearch: false, openCallRequest: false, openAddStory: false
        })
      );
      if (!cart || (cart && cart.items.length <= 0)) {
        if (currentUser._id) {
          const existCart = await cartService.getCartByUser(currentUser._id);
          if (existCart && existCart.length > 0) {
            handleAddCart(existCart);
          }
        }
      }
    }
  }

  async componentDidUpdate(prevProps: any) {
    const { currentUser, cart, addCart: handleAddCart } = this.props;
    if (prevProps.currentUser._id !== currentUser._id && currentUser._id) {
      if (!cart || (cart && cart.items.length <= 0)) {
        if (currentUser._id && process.browser) {
          const existCart = await cartService.getCartByUser(currentUser._id);
          if (existCart && existCart.length > 0) {
            handleAddCart(existCart);
          }
        }
      }
      this.handleCountNotificationMessage();
    }
  }

  async handleCountNotificationMessage() {
    try {
      const data = await (await messageService.countTotalNotRead()).data;
      if (data) {
        this.setState({ totalNotReadMessage: data.total });
      }
    } catch (e) {
      console.log(e);
    }
  }

  handleMessage = async (event) => {
    event && this.setState({ totalNotReadMessage: event.total });
  };

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
      currentUser, router, ui, cart, privateRequests, settings
    } = this.props;
    const {
      totalNotReadMessage, openAddStory, openSearch, openProfile, openCallRequest
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
        <div className="main-container">
          {/* {((currentUser._id && !currentUser.email) || (currentUser._id && !currentUser.username)) && !['/content-creator/account', '/user/account'].includes(router.asPath) && (
            <div className="alert-email">
              Your account is missing email address or username.
              &nbsp;
              <Link href={currentUser.isPerformer ? '/content-creator/account' : '/user/account'} as={currentUser.isPerformer ? '/content-creator/account' : '/user/account'}>
                <a>click here to update.</a>
              </Link>
            </div>
          )} */}
          <Layout.Header className="header" id="layoutHeader">
            <div className="nav-bar">
              <div className={currentUser._id ? 'left-conner hide-mobile' : 'left-conner'}>
                <Link href="/home">
                  <a className="logo-nav">
                    {ui?.logo ? (
                      <img
                        alt="logo"
                        src={ui?.logo}
                        height="60px"
                      />
                    ) : <span>{ui?.siteName}</span>}
                  </a>
                </Link>
                <div className="hide-tablet"><SearchBar /></div>
              </div>
              <div className="mid-conner">
                <ul className="nav-icons">
                  {currentUser
                    && currentUser.isPerformer
                    && router.asPath !== `/${currentUser.username}` && (
                      <Tooltip key="profile" title="Profile">
                        <li
                          className={
                            router.asPath === `/${currentUser.username}`
                              ? 'active'
                              : ''
                          }
                        >
                          <Link
                            href={{
                              pathname: '/content-creator/profile',
                              query: { username: currentUser.username }
                            }}
                            as={`/${currentUser.username}`}
                          >
                            <a>
                              <HomeOutlined />
                            </a>
                          </Link>
                        </li>
                      </Tooltip>
                  )}
                  {currentUser._id && !currentUser.isPerformer && (
                    <Tooltip key="home" title="Home">
                      <li className={router.pathname === '/home' ? 'active' : ''}>
                        <Link href="/home">
                          <a>
                            <HomeOutlined />
                          </a>
                        </Link>
                      </li>
                    </Tooltip>
                  )}
                  {currentUser && currentUser._id && currentUser.isPerformer && (
                    <>
                      <Tooltip key="live" title="Go Live">
                        <li className={router.pathname === '/content-creator/live' ? 'active' : ''}>
                          <Link href="/content-creator/live" as="/content-creator/live">
                            <a>
                              <VideoCameraAddOutlined />
                            </a>
                          </Link>
                        </li>
                      </Tooltip>
                      <Tooltip key="story" title="Add a story">
                        <li
                          aria-hidden
                          onClick={() => {
                            if (!currentUser.verifiedDocument) {
                              message.warning('Your account hasn\'t been verified ID documents yet! You could not post any content right now. If you have any question, please contact our admin to get more information.');
                              return;
                            }
                            this.setState({ openAddStory: true });
                          }}
                        >
                          <a>
                            <HistoryOutlined />
                          </a>
                        </li>
                      </Tooltip>
                      <Tooltip key="new_post" title="Compose new post">
                        <li className={router.pathname === '/content-creator/my-post/create' ? 'active' : ''}>
                          <Link href="/content-creator/my-post/create">
                            <a>
                              <PlusSquareOutlined />
                            </a>
                          </Link>
                        </li>
                      </Tooltip>
                    </>
                  )}
                  {currentUser && currentUser._id && !currentUser.isPerformer && [
                    <Tooltip key="models" title="Content Creators">
                      <li key="models" className={router.pathname === '/content-creator' ? 'active' : ''}>
                        <Link href="/content-creator">
                          <a>
                            <StarOutlined />
                          </a>
                        </Link>
                      </li>
                    </Tooltip>,
                    <Tooltip key="cart" title="Cart">
                      <li key="cart" className={router.pathname === '/cart' ? 'active' : ''}>
                        <Link href="/cart">
                          <a>
                            <ShoppingCartOutlined />
                            <Badge
                              className="cart-total"
                              count={cart.total}
                              showZero
                            />
                          </a>
                        </Link>
                      </li>
                    </Tooltip>
                  ]}
                  {currentUser._id && currentUser.isPerformer && (
                    <Tooltip key="private_call_requests" title={privateRequests.length > 0 ? '' : 'Private chat requests'}>
                      <li
                        onClick={() => this.setState({ openCallRequest: true })}
                        aria-hidden
                        key="private_call"
                        className={router.pathname === `/content-creator/live/${settings.optionForPrivate === 'webrtc'
                          ? 'webrtc/'
                          : ''
                        }privatechat` ? 'active' : ''}
                      >
                        <a>
                          <UsergroupAddOutlined />
                          <Badge className="cart-total" showZero count={privateRequests.length} />
                        </a>
                      </li>
                    </Tooltip>
                  )}
                  {currentUser._id && (
                    <Tooltip key="messenger" title="Messenger">
                      <li key="messenger" className={router.pathname === '/messages' ? 'active' : ''}>
                        <Link href="/messages">
                          <a>
                            <MessageOutlined />
                            <Badge
                              className="cart-total"
                              count={totalNotReadMessage}
                              showZero
                            />
                          </a>
                        </Link>
                      </li>
                    </Tooltip>
                  )}
                  {!currentUser._id && (
                    <li key="search" className="hide-desktop" aria-hidden onClick={() => this.setState({ openSearch: !openSearch })}>
                      <a className="search-mobile"><SearchOutlined /></a>
                    </li>
                  )}
                  {!currentUser._id && [
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
                      <Avatar src={currentUser.avatar || '/static/no-avatar.png'} />
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Layout.Header>
          <Modal
            width={990}
            title="Add a story"
            visible={openAddStory}
            onOk={() => this.setState({ openAddStory: false })}
            onCancel={() => this.setState({ openAddStory: false })}
            footer={null}
          >
            <StoryForm onCloseModal={() => this.setState({ openAddStory: false })} />
          </Modal>
          <Drawer
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
          </Drawer>
          <Drawer
            title={null}
            closable
            onClose={() => this.setState({ openSearch: false })}
            visible={openSearch}
            key="search-drawer"
            className={ui.theme === 'light' ? 'profile-drawer' : 'profile-drawer dark'}
            width={350}
          >
            <SearchBar />
          </Drawer>
          <Drawer
            title={(
              <>
                <div className="profile-user">
                  <img src={currentUser?.avatar || '/static/no-avatar.png'} alt="logo" />
                  <a className="profile-name">
                    {currentUser?.name || 'N/A'}
                    <span>
                      @
                      {currentUser?.username || 'n/a'}
                    </span>
                  </a>
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
            {currentUser.isPerformer && (
              <div className="profile-menu-item">
                <Link href="/content-creator/account" as="/content-creator/account">
                  <div className={router.pathname === '/content-creator/account' ? 'menu-item active' : 'menu-item'}>
                    <UserOutlined />
                    {' '}
                    Edit Profile
                  </div>
                </Link>
                <Link href={{ pathname: '/search/analytics' }} as="/search/analytics">
                  <div className={router.pathname === '/search/analytics' ? 'menu-item active' : 'menu-item'}>
                    <SearchOutlined />
                    {' '}
                    Keywords
                  </div>
                </Link>
                <Link href={{ pathname: '/content-creator/my-subscriber' }} as="/content-creator/my-subscriber">
                  <div className={router.pathname === '/content-creator/my-subscriber' ? 'menu-item active' : 'menu-item'}>
                    <StarOutlined />
                    {' '}
                    Subscribers
                  </div>
                </Link>
                <Divider />
                <Link href="/content-creator/my-post" as="/content-creator/my-post">
                  <div className={router.pathname === '/content-creator/my-post' ? 'menu-item active' : 'menu-item'}>
                    <FireOutlined />
                    {' '}
                    Posts
                  </div>
                </Link>
                <Link href="/content-creator/my-story" as="/content-creator/my-story">
                  <div className={router.pathname === '/content-creator/my-story' ? 'menu-item active' : 'menu-item'}>
                    <HistoryOutlined />
                    {' '}
                    Stories
                  </div>
                </Link>
                <Link href="/content-creator/my-blog" as="/content-creator/my-blog">
                  <div className={router.pathname === '/content-creator/my-blog' ? 'menu-item active' : 'menu-item'}>
                    <GlobalOutlined />
                    {' '}
                    Blogs
                  </div>
                </Link>
                {/* <Link href="/content-creator/my-video" as="/content-creator/my-video">
                  <div className={router.pathname === '/content-creator/my-video' ? 'menu-item active' : 'menu-item'}>
                    <VideoCameraOutlined />
                    {' '}
                    Videos
                  </div>
                </Link>
                <Link href="/content-creator/my-gallery/listing" as="/content-creator/my-gallery/listing">
                  <div className={router.pathname === '/content-creator/my-gallery/listing' ? 'menu-item active' : 'menu-item'}>
                    <PictureOutlined />
                    {' '}
                    Galleries
                  </div>
                </Link> */}
                <Link href="/content-creator/my-store" as="/content-creator/my-store">
                  <div className={router.pathname === '/content-creator/my-store' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingOutlined />
                    {' '}
                    Store
                  </div>
                </Link>
                <Divider />
                <Link href={{ pathname: '/content-creator/my-order' }} as="/content-creator/my-order">
                  <div className={router.pathname === '/content-creator/my-order' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    Orders
                  </div>
                </Link>
                <Link href="/content-creator/earning" as="/content-creator/earning">
                  <div className={router.pathname === '/content-creator/earning' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    Earnings
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
                <Divider />
                <Link href="/user/bookmarks" as="/user/bookmarks">
                  <div className={router.pathname === '/content-creator/account' ? 'menu-item active' : 'menu-item'}>
                    <StarOutlined />
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
                <Link href="/user/orders" as="/user/orders">
                  <div className={router.pathname === '/user/orders' ? 'menu-item active' : 'menu-item'}>
                    <ShoppingCartOutlined />
                    {' '}
                    Orders
                  </div>
                </Link>
                <Link href="/user/payment-history" as="/user/payment-history">
                  <div className={router.pathname === '/user/payment-history' ? 'menu-item active' : 'menu-item'}>
                    <DollarOutlined />
                    {' '}
                    Transactions
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
            <div className="switchTheme">
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
            </div>
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
  cart: { ...state.cart },
  ...state.streaming
});
const mapDispatch = {
  logout, addCart, addPrivateRequest, accessPrivateRequest, updateUIValue
};
export default withRouter(connect(mapState, mapDispatch)(Header)) as any;
