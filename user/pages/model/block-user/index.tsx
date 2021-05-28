import { Layout, Button, message } from 'antd';
import Head from 'next/head';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { IUIConfig } from 'src/interfaces';
import { SelectUserDropdown } from '@components/user/select-users-dropdown';
import { blockService } from 'src/services';
import UsersBlockList from '@components/user/users-block-list';
import Router from 'next/router';
import './index.less';


interface IProps {
  ui: IUIConfig;
}

class blockPage extends PureComponent<IProps> {
  static onlyPerformer = true;
  static authenticate = true;

  state = {
    loading: false,
    submiting: false,
    limit: 10,
    offset: 0,
    blockUserId: '',
    userBlockedList: [],
    totalBlockedUsers: 0,
  }

  componentDidMount() {
    this.getBlockList();
  }

  async handleTabChange(data) {
    await this.setState({ offset: data.current -1 })
    this.getBlockList();
  }

  async getBlockList() {
    const { limit, offset } = this.state;
    try {
      await this.setState({ loading: true })
      const kq = await blockService.getBlockListUsers({
        limit,
        offset: offset * limit
      });
      this.setState({
        userBlockedList: kq.data.data,
        totalBlockedUsers: kq.data.total
      })
    } catch (e) {
      message.error('An error occured, please try again later')
      Router.back()
    } finally {
      this.setState({ loading: false })
    }
  }

  async blockUser() {
    const { blockUserId } = this.state;
    if (!blockUserId) {
      message.error('Please select a user')
      return;
    }
    try {
      await this.setState({ submiting: true })
      const resp = await blockService.blockUser({ targetId: blockUserId, target: 'user', reason: 'tao thich' });
      message.success('Blocked success')
      this.getBlockList();
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'An error occured, please try again later')
    } finally {
      this.setState({ submiting: false })
    }
  }
  
  async handleUnblockUser(userId: string) {
    if (!window.confirm('Are you sure to unblock this user')) return;
    try {
      await this.setState({ submiting: true })
      const resp = await blockService.unBlockUser(userId);
      this.getBlockList();
    }
    catch (e) {
      const err = await e;
      message.error(err?.message || 'An error occured. Please try again later')
    }
    finally {
      this.setState({ submiting: false})
    }
  }

  render() {
    const { userBlockedList, totalBlockedUsers, loading, limit, submiting } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title> {ui && ui.siteName}</title>
        </Head>
        <div className="main-container">
          <div className="page-heading">Block Page</div>
          <div className="select-user">
            <p>Please select user you want to block</p>
            <SelectUserDropdown onSelect={(val) => this.setState({ blockUserId: val })} />
            <Button className="block-user" type="primary" onClick={this.blockUser.bind(this)}>
              Block
            </Button>
          </div>
          <div className="users-blocked-list">
            <UsersBlockList
              items={userBlockedList}
              searching={loading}
              total={totalBlockedUsers}
              onChange={this.handleTabChange.bind(this)}
              pageSize={limit}
              submiting={submiting}
              unblockUser={this.handleUnblockUser.bind(this)}
            />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state) => ({
  ui: { ...state.ui }
});
export default connect(mapStates)(blockPage);


