import React, { PureComponent } from 'react';
import { Layout, Switch } from 'antd';
import Link from 'next/link';
import { getGlobalConfig } from '@services/config';
import ScrollBar from '../base/scroll-bar';
import { SiderMenu } from './menu';
import './sider.less';

interface ISiderProps {
  collapsed?: boolean;
  theme?: string;
  isMobile?: boolean;
  logo?: string;
  siteName?: string;
  onThemeChange?: Function
  menus?: any;
}

class Sider extends PureComponent<ISiderProps> {
  render() {
    const {
      collapsed, theme, isMobile, logo, siteName, onThemeChange, menus
    } = this.props;
    return (
      <Layout.Sider
        width={256}
        // theme={theme}
        breakpoint="lg"
        trigger={null}
        collapsible
        collapsed={collapsed}
        // onBreakpoint={!isMobile && onCollapseChange}
        className="slider"
      >
        <div className="brand">
          <Link href="/">
            <a>
              <div className="logo">
                {logo ? <img alt="logo" src={logo} /> : <h1>{siteName}</h1>}
              </div>
            </a>
          </Link>
        </div>

        <div className="menuContainer">
          <ScrollBar
            options={{
              // Disabled horizontal scrolling, https://github.com/utatti/perfect-scrollbar#options
              suppressScrollX: true
            }}
          >
            <SiderMenu
              menus={menus}
              theme={theme}
              isMobile={isMobile}
              // onCollapseChange={onCollapseChange}
            />
          </ScrollBar>
        </div>
        {!collapsed && (
          <div className="switchTheme">
            <span>
              v
              {getGlobalConfig().NEXT_PUBLIC_BUILD_VERSION}
            </span>
            <Switch
              onChange={onThemeChange && onThemeChange.bind(
                this,
                theme === 'dark' ? 'light' : 'dark'
              )}
              defaultChecked={theme === 'dark'}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
          </div>
        )}
      </Layout.Sider>
    );
  }
}

export default Sider;
