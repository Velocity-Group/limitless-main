/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { PureComponent, Fragment } from 'react';
import { Layout, Menu, Avatar } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import Link from 'next/link';
import './header.less';
import { IUser } from 'src/interfaces';

interface IProps {
  collapsed?: boolean;
  onCollapseChange?: Function;
  currentUser?: IUser;
}

class Header extends PureComponent<IProps> {
  handleClickMenu() {}

  render() {
    const { collapsed, onCollapseChange, currentUser } = this.props;

    const rightContent = [
      <Menu key="user" mode="horizontal" onClick={this.handleClickMenu}>
        <Menu.SubMenu
          title={(
            <>
              <span style={{ color: '#999', marginRight: 4 }}>
                <span>Hi,</span>
              </span>
              {currentUser.firstName && currentUser.lastName ? <span>{`${currentUser.firstName} ${currentUser.lastName}`}</span>
                : <span>{currentUser.name}</span>}
              <Avatar style={{ marginLeft: 8 }} src={currentUser.avatar} />
            </>
          )}
        >
          <Menu.Item key="settings">
            <Link href="/account/settings">
              <a>Update profile</a>
            </Link>
          </Menu.Item>
          <Menu.Item key="SignOut">
            <Link href="/auth/logout">
              <a>Log out</a>
            </Link>
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>
    ];

    return (
      <Layout.Header className="header" id="layoutHeader">
        <div
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
export default connect(mapState)(Header);
