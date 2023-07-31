import { PureComponent } from 'react';
import {
  Layout, Menu, Avatar, Dropdown
} from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import Link from 'next/link';
import { IUser } from 'src/interfaces';
import { logout } from '@redux/auth/actions';
import './header.less';

interface IProps {
  collapsed?: boolean;
  onCollapseChange?: Function;
  currentUser?: IUser;
  logout: Function;
}

class Header extends PureComponent<IProps> {
  render() {
    const {
      collapsed, onCollapseChange, currentUser, logout: handleLogout
    } = this.props;
    const rightContent = (
      <Dropdown overlay={(
        <Menu key="user" mode="horizontal">
          <Menu.Item key="settings">
            <Link href="/account/settings">
              <a>Update profile</a>
            </Link>
          </Menu.Item>
          <Menu.Item key="SignOut">
            <a aria-hidden onClick={() => handleLogout()}>Log out</a>
          </Menu.Item>
        </Menu>
      )}
      >
        <a className="ant-dropdown-link">
          <Avatar style={{ margin: '0 15px' }} src={currentUser?.avatar || '/no-avatar.png'} />
        </a>
      </Dropdown>
    );

    return (
      <Layout.Header className="header" id="layoutHeader">
        <div
          aria-hidden
          className="button"
          onClick={onCollapseChange.bind(this, !collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
        <div className="rightContainer">{rightContent}</div>
      </Layout.Header>
    );
  }
}

const mapState = (state: any) => ({ currentUser: state.user.current });
export default connect(mapState, { logout })(Header);
