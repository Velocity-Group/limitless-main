/* eslint-disable react/no-did-update-set-state */
import { PureComponent } from 'react';
import { Layout, Tabs, message } from 'antd';
import Head from 'next/head';
import { connect } from 'react-redux';
import { UserAccountForm, UpdatePaswordForm } from '@components/user';
import { IUser, IUserFormData } from 'src/interfaces/user';
import { authService } from '@services/auth.service';
import { userService } from '@services/user.service';
import { updateUser, updateCurrentUserAvatar, updatePassword } from 'src/redux/user/actions';
import './index.less';
import { IUIConfig } from 'src/interfaces';
import { SocketContext } from 'src/socket';
import { logout } from '@redux/auth/actions';

interface IProps {
  name: string;
  username: string;
  email: string;
  onFinish(): Function;
  user: IUser;
  updating: boolean;
  updateUser: Function;
  updateCurrentUserAvatar: Function;
  updatePassword: Function;
  updateSuccess: boolean;
  error: any;
  ui: IUIConfig;
  logout: Function;
}
interface IState {
  pwUpdating: boolean;
  emailSending: boolean;
  countTime: number;
}

class UserAccountSettingPage extends PureComponent<IProps, IState> {
  static authenticate: boolean = true;

  _intervalCountdown: any;

  constructor(props: IProps) {
    super(props);
    this.state = {
      pwUpdating: false,
      emailSending: false,
      countTime: 60
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.countTime === 0) {
      this._intervalCountdown && clearInterval(this._intervalCountdown);
      this.setState({ countTime: 60 });
    }
  }

  componentWillUnmount() {
    this._intervalCountdown && clearInterval(this._intervalCountdown);
  }

  handleCountdown = async () => {
    const { countTime } = this.state;
    if (countTime === 0) {
      clearInterval(this._intervalCountdown);
      this.setState({ countTime: 60 });
      return;
    }
    this.setState({ countTime: countTime - 1 });
    this._intervalCountdown = setInterval(this.coundown.bind(this), 1000);
  }

  async handleSwitchToPerformer() {
    const { user, logout: handleLogout } = this.props;
    if (!user._id) return;
    if (!window.confirm('By confirm to become a model, your current account will be change immediately!')) return;
    try {
      const resp = await authService.userSwitchToPerformer(user._id);
      message.success(resp?.data?.message || 'Switched account success!');
      const token = authService.getToken();
      const socket = this.context;
      token && socket && await socket.emit('auth/logout', {
        token
      });
      socket && socket.close();
      handleLogout();
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    }
  }

  onFinish(data: IUserFormData) {
    const { updateUser: handleUpdateUser } = this.props;
    handleUpdateUser(data);
  }

  coundown() {
    const { countTime } = this.state;
    this.setState({ countTime: countTime - 1 });
  }

  uploadAvatar(data) {
    const { updateCurrentUserAvatar: handleUpdateUserAvt } = this.props;
    handleUpdateUserAvt(data.response.data.url);
  }

  updatePassword(data: any) {
    const { updatePassword: handleUpdateUserPw } = this.props;
    handleUpdateUserPw(data.password);
  }

  async verifyEmail() {
    const { user } = this.props;
    try {
      await this.setState({ emailSending: true });
      const resp = await authService.verifyEmail({
        sourceType: 'user',
        source: user
      });
      this.handleCountdown();
      resp.data && resp.data.message && message.success(resp.data.message);
    } catch (e) {
      const error = await e;
      message.success(error?.message || 'An error occured, please try again later');
    } finally {
      this.setState({ emailSending: false });
    }
  }

  render() {
    const { user, updating, ui } = this.props;
    const { pwUpdating, countTime, emailSending } = this.state;
    const uploadHeader = {
      authorization: authService.getToken()
    };
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui && ui.siteName}
            {' '}
            | Account
            {' '}
          </title>
        </Head>
        <div className="main-container user-account">
          <Tabs defaultActiveKey="user-profile" tabPosition="top" className="nav-tabs">
            <Tabs.TabPane tab={<span>Basic Settings</span>} key="basic">
              <UserAccountForm
                onFinish={this.onFinish.bind(this)}
                updating={updating || emailSending}
                user={user}
                options={{
                  uploadHeader,
                  avatarUrl: userService.getAvatarUploadUrl(),
                  uploadAvatar: this.uploadAvatar.bind(this)
                }}
                countTime={countTime}
                onVerifyEmail={this.verifyEmail.bind(this)}
                onSwitchToPerformer={this.handleSwitchToPerformer.bind(this)}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Change password</span>} key="password">
              <UpdatePaswordForm
                onFinish={this.updatePassword.bind(this)}
                updating={pwUpdating}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Layout>
    );
  }
}

UserAccountSettingPage.contextType = SocketContext;

const mapStates = (state) => ({
  user: state.user.current,
  updating: state.user.updating,
  error: state.user.error,
  updateSuccess: state.user.updateSuccess,
  ui: { ...state.ui }
});
const mapDispatch = {
  updateUser, updateCurrentUserAvatar, updatePassword, logout
};
export default connect(mapStates, mapDispatch)(UserAccountSettingPage);
