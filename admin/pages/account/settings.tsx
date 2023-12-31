import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Tabs, message } from 'antd';
import Page from '@components/common/layout/page';
import { IUser } from 'src/interfaces';
import { updateUser, updateCurrentUserAvatar } from 'src/redux/user/actions';
import { authService, userService } from '@services/index';
import { UpdatePaswordForm } from '@components/user/update-password-form';
import { SubAdminForm } from '@components/user/sub-admin-form';

interface IProps {
  currentUser: IUser;
  updateUser: Function;
  updating?: boolean;
  updateCurrentUserAvatar: Function;
  updateSuccess?: boolean;
}
class AccountSettings extends PureComponent<IProps> {
  state = {
    pwUpdating: false
  };

  componentDidUpdate(prevProps: any) {
    const { updateSuccess: handlerUpdate } = this.props;
    if (prevProps.updateSuccess !== handlerUpdate && handlerUpdate) {
      message.success('Updated successfully!');
    }
  }

  onAvatarUploaded(data: any) {
    const { updateCurrentUserAvatar: updateAvatar } = this.props;
    message.success('Avatar has been updated!');
    updateAvatar(data.base64);
  }

  submit(data: any) {
    const { updateUser: handlerUpdateUser } = this.props;
    handlerUpdateUser(data);
    // TODO - show alert success for update?
    // or move to sagas
  }

  async updatePassword(data: any) {
    try {
      this.setState({ pwUpdating: true });
      await authService.updatePassword(data.password);
      message.success('Password has been updated!');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ pwUpdating: false });
    }
  }

  render() {
    const { currentUser, updating } = this.props;
    const { pwUpdating } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <>
        <Head>
          <title>Account Settings</title>
        </Head>
        <Page>
          <Tabs defaultActiveKey="basic" tabPosition="top">
            <Tabs.TabPane tab={<span>Basic info</span>} key="basic">
              <SubAdminForm
                onFinish={this.submit.bind(this)}
                user={currentUser}
                updating={updating}
                options={{
                  uploadHeaders,
                  avatarUploadUrl: userService.getAvatarUploadUrl(),
                  onAvatarUploaded: this.onAvatarUploaded.bind(this),
                  avatarUrl: currentUser.avatar
                }}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Change password</span>} key="password">
              <UpdatePaswordForm
                onFinish={this.updatePassword.bind(this)}
                updating={pwUpdating}
              />
            </Tabs.TabPane>
          </Tabs>
        </Page>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  updating: state.user.updating,
  updateSuccess: state.user.updateSuccess
});
const mapDispatch = { updateUser, updateCurrentUserAvatar };
export default connect(mapStates, mapDispatch)(AccountSettings);
