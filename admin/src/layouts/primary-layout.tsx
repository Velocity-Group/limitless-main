import { PureComponent } from 'react';
import { Layout, Drawer, BackTop } from 'antd';
import { enquireScreen, unenquireScreen } from 'enquire-js';
import { connect } from 'react-redux';
import { updateUIValue, loadUIValue } from 'src/redux/ui/actions';
import Sider from '@components/common/layout/sider';
import { IUIConfig } from 'src/interfaces/ui-config';
import {
  PieChartOutlined, ContainerOutlined, UserOutlined, WomanOutlined,
  VideoCameraOutlined, CameraOutlined, StopOutlined, FileImageOutlined,
  SkinOutlined, DollarOutlined, HeartOutlined, MenuOutlined,
  FireOutlined, MailOutlined, NotificationOutlined,
  TranslationOutlined, SecurityScanOutlined, UsergroupAddOutlined
} from '@ant-design/icons';
import Header from '@components/common/layout/header';
import { Router as RouterEvent } from 'next/router';
import Loader from '@components/common/base/loader';
import './primary-layout.less';
import { ROLE_SUB_ADMIN } from 'src/constants';
import { IUser } from 'src/interfaces';

interface DefaultProps extends IUIConfig {
  children: any;
  config: IUIConfig;
  updateUIValue: Function;
  loadUIValue: Function;
  user: IUser
}

class PrimaryLayout extends PureComponent<DefaultProps> {
  state = {
    isMobile: false,
    routerChange: false
  };

  enquireHandler: any;

  componentDidMount() {
    const { loadUIValue: handleLoadUI } = this.props;
    handleLoadUI();
    this.enquireHandler = enquireScreen((mobile) => {
      const { isMobile } = this.state;
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile
        });
      }
    });

    process.browser && this.handleStateChange();
  }

  componentWillUnmount() {
    unenquireScreen(this.enquireHandler);
  }

  handleStateChange() {
    RouterEvent.events.on('routeChangeStart', async () => this.setState({ routerChange: true }));
    RouterEvent.events.on('routeChangeComplete', async () => this.setState({ routerChange: false }));
  }

  onCollapseChange = (collapsed) => {
    const { updateUIValue: handleUpdateUI } = this.props;
    handleUpdateUI({ collapsed });
  };

  onThemeChange = (theme: string) => {
    const { updateUIValue: handleUpdateUI } = this.props;
    handleUpdateUI({ theme });
  };

  render() {
    const {
      children, collapsed, fixedHeader, logo, siteName, theme, user
    } = this.props;
    const { isMobile, routerChange } = this.state;
    const headerProps = {
      collapsed,
      theme,
      onCollapseChange: this.onCollapseChange
    };

    const sliderMenusAdmin = [
      {
        id: 'blockCountry',
        name: 'Block Countries',
        icon: <StopOutlined />,
        children: [
          {
            id: 'blockCountry',
            name: 'List countries',
            route: '/block-countries'
          }
        ]
      },
      {
        id: 'email-template',
        name: 'Email Templates',
        icon: <MailOutlined />,
        children: [
          {
            id: 'email-templates-listing',
            name: 'All email templates',
            route: '/email-templates'
          }
        ]
      },
      {
        id: 'posts',
        name: 'Posts',
        icon: <ContainerOutlined />,
        children: [
          {
            id: 'post-page',
            name: 'All posts',
            route: '/posts?type=page'
          },
          {
            id: 'page-create',
            name: 'Create new',
            route: '/posts/create?type=page'
          }
        ]
      },
      {
        id: 'menu',
        name: 'Existing Menu Options',
        icon: <MenuOutlined />,
        children: [
          {
            id: 'menu-listing',
            name: 'All menu options',
            route: '/menu'
          },
          {
            name: 'Create new',
            id: 'create-menu',
            route: '/menu/create'
          }
        ]
      },
      {
        id: 'coupon',
        name: 'Coupons',
        icon: <DollarOutlined />,
        children: [
          {
            id: 'coupon-listing',
            name: 'All coupons',
            route: '/coupon'
          },
          {
            name: 'Create new',
            id: 'create-coupon',
            route: '/coupon/create'
          }
        ]
      },
      {
        id: 'banner',
        name: 'Banners',
        icon: <FileImageOutlined />,
        children: [
          {
            id: 'banner-listing',
            name: 'All banners',
            route: '/banners'
          },
          {
            name: 'Upload new',
            id: 'upload-banner',
            route: '/banners/upload'
          }
        ]
      },
      {
        id: 'sub-admin',
        name: 'Sub Admins',
        icon: <SecurityScanOutlined />,
        children: [
          {
            name: 'All sub admins',
            id: 'all-sub-admins',
            route: '/sub-admins'
          },
          {
            name: 'Create new',
            id: 'sub-admins-create',
            route: '/sub-admins/create'
          }
        ]
      },
      {
        id: 'accounts',
        name: 'Users',
        icon: <UserOutlined />,
        children: [
          {
            name: 'All users',
            id: 'users',
            route: '/users'
          },
          {
            name: 'Create new',
            id: 'users-create',
            route: '/users/create'
          }
        ]
      },
      {
        id: 'performers',
        name: 'Models',
        icon: <WomanOutlined />,
        children: [
          {
            name: 'All models',
            id: 'performers',
            route: '/model'
          },
          {
            name: 'Create new',
            id: 'create-performers',
            route: '/model/create'
          }
        ]
      },
      {
        id: 'referrals',
        name: 'Referrals',
        icon: <UsergroupAddOutlined />,
        children: [
          {
            id: 'referrals',
            name: 'All referrals',
            route: '/referral'
          },
          {
            id: 'referral-earning',
            name: 'Referral earnings',
            route: '/referral/referral-earning'
          }
        ]
      },
      {
        id: 'feed',
        name: 'Feed Posts',
        icon: <FireOutlined />,
        children: [
          {
            id: 'posts',
            name: 'All posts',
            route: '/feed'
          },
          // {
          //   id: 'video_posts',
          //   name: 'Video Posts',
          //   route: '/feed?type=video'
          // },
          // {
          //   id: 'photo_posts',
          //   name: 'Photo Posts',
          //   route: '/feed?type=photo'
          // },
          {
            id: 'create_post',
            name: 'Create new',
            route: '/feed/create'
          }
        ]
      },
      {
        id: 'videos',
        name: 'Videos',
        icon: <VideoCameraOutlined />,
        children: [
          {
            id: 'video-listing',
            name: 'All videos',
            route: '/video'
          },
          {
            id: 'video-upload',
            name: 'Upload new',
            route: '/video/upload'
          },
          {
            id: 'video-bulk-upload',
            name: 'Bulk upload',
            route: '/video/bulk-upload'
          }
        ]
      },
      {
        id: 'performers-photos',
        name: 'Galleries',
        icon: <CameraOutlined />,
        children: [
          {
            id: 'gallery-listing',
            name: 'All galleries',
            route: '/gallery'
          },
          {
            name: 'Create new gallery',
            id: 'create-galleries',
            route: '/gallery/create'
          },
          // {
          //   id: 'photo-listing',
          //   name: 'Photos',
          //   route: '/photos'
          // },
          {
            name: 'Upload new photo',
            id: 'upload-photo',
            route: '/gallery/photos/upload'
          },
          {
            name: 'Bulk upload',
            id: 'bulk-upload-photo',
            route: '/gallery/photos/bulk-upload'
          }
        ]
      },
      {
        id: 'performers-products',
        name: 'Products',
        icon: <SkinOutlined />,
        children: [
          {
            id: 'product-listing',
            name: 'All products',
            route: '/product'
          },
          {
            name: 'Create new',
            id: 'create-product',
            route: '/product/create'
          }
        ]
      },
      {
        id: 'report',
        name: 'Reports',
        icon: <NotificationOutlined />,
        children: [
          {
            id: 'Report',
            name: 'All reports',
            route: '/report'
          }
        ]
      },
      // {
      //   id: 'token-package',
      //   name: 'Token Packages',
      //   icon: <LinkOutlined />,
      //   children: [
      //     {
      //       id: 'token-package',
      //       name: 'All token packages',
      //       route: '/token-package'
      //     },
      //     {
      //       id: 'new-token-package',
      //       name: 'Create new',
      //       route: '/token-package/create'
      //     }
      //   ]
      // },
      {
        id: 'order',
        name: 'Order History',
        icon: <ContainerOutlined />,
        children: [
          {
            id: 'order',
            name: 'All orders',
            route: '/order'
          }
        ]
      },
      {
        id: 'earning',
        name: 'Earning History',
        icon: <DollarOutlined />,
        children: [
          {
            id: 'earning-money',
            name: 'Earnings',
            route: '/earnings'
          }
        ]
      },
      {
        id: 'subscription',
        name: 'Subscriptions',
        icon: <HeartOutlined />,
        children: [
          {
            name: 'All subscriptions',
            id: 'subscription',
            route: '/subscription'
          },
          {
            name: 'Create new',
            id: 'create-subscription',
            route: '/subscription/create'
          }
        ]
      },
      {
        id: 'payments',
        name: 'Payment History',
        icon: <DollarOutlined />,
        children: [
          {
            id: 'payment',
            name: 'All cash payments',
            route: '/cash-payments'
          }
        ]
      },
      {
        id: 'transactions',
        name: 'Wallet Transactions',
        icon: <DollarOutlined />,
        children: [
          {
            id: 'transactions',
            name: 'All wallet transactions',
            route: '/wallet-transactions'
          }
        ]
      },
      {
        id: 'request-payout',
        name: 'Payout Requests',
        icon: <NotificationOutlined />,
        children: [
          {
            id: 'payout',
            name: 'All payout requests',
            route: '/payout-request'
          }
        ]
      },
      {
        id: 'language-setting',
        name: 'Language',
        icon: <TranslationOutlined />,
        children: [
          {
            id: 'language-setting-listing',
            route: '/language',
            name: 'Listing'
          },
          {
            id: 'language-setting-create',
            name: 'Create',
            route: '/language/create'
          }
        ]
      },
      {
        id: 'settings',
        name: 'Settings',
        icon: <PieChartOutlined />,
        children: [
          {
            id: 'system-settings',
            route: '/settings',
            as: '/settings',
            name: 'Settings'
          }
        ]
      }
    ];

    const sliderMenusSubAdmin = user
    && sliderMenusAdmin.filter((slider) => user.pathsAllow?.some((path) => slider.children[0].route.includes(path)));

    const siderProps = {
      collapsed,
      isMobile,
      logo,
      siteName,
      theme,
      menus: user && user.roles?.includes(ROLE_SUB_ADMIN) ? sliderMenusSubAdmin : sliderMenusAdmin,
      onCollapseChange: this.onCollapseChange,
      onThemeChange: this.onThemeChange
    };

    return (
      <>
        <Layout>
          {isMobile ? (
            <Drawer
              maskClosable
              closable={false}
              onClose={this.onCollapseChange.bind(this, !collapsed)}
              visible={!collapsed}
              placement="left"
              width={257}
              style={{
                padding: 0,
                height: '100vh'
              }}
            >
              <Sider {...siderProps} />
            </Drawer>
          ) : (
            <Sider {...siderProps} />
          )}
          <div className="container" style={{ paddingTop: fixedHeader ? 72 : 0 }} id="primaryLayout">
            <Header {...headerProps} />
            <Layout.Content className="content" style={{ position: 'relative' }}>
              {routerChange && <Loader />}
              {/* <Bread routeList={newRouteList} /> */}
              {children}
            </Layout.Content>
            <BackTop className="backTop" target={() => document.querySelector('#primaryLayout') as any} />
          </div>
        </Layout>
      </>
    );
  }
}

const mapStateToProps = (state: any) => ({
  ...state.ui,
  auth: state.auth,
  user: state.user.current
});
const mapDispatchToProps = { updateUIValue, loadUIValue };

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryLayout);
