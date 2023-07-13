import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Tabs, message, Layout } from 'antd';
import {
  IPerformer,
  IUIConfig,
  ICountry,
  IBody,
  ISettings
} from 'src/interfaces';
import {
  updatePerformer,
  updateCurrentUserAvatar,
  updateCurrentUserCover
} from 'src/redux/user/actions';
import {
  authService, performerService, utilsService
} from '@services/index';
import PerformerAccountForm from '@components/performer/accountForm';
import PerformerSubscriptionForm from '@components/performer/subscriptionForm';
import '../../user/index.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  currentUser: IPerformer;
  updatePerformer: Function;
  updating: boolean;
  updateCurrentUserAvatar: Function;
  ui: IUIConfig;
  updateCurrentUserCover: Function;
  countries: ICountry[];
  bodyInfo: IBody;
  intl: IntlShape
  settings: ISettings;
}

class AccountSettings extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps() {
    const [countries, bodyInfo] = await Promise.all([
      utilsService.countriesList(),
      utilsService.bodyInfo()
    ]);
    return {
      countries: countries?.data || [],
      bodyInfo: bodyInfo?.data
    };
  }

  _intervalCountdown: any;

  state = {
    emailSending: false,
    countTime: 60
  };

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

  onAvatarUploaded(data: any) {
    const { updateCurrentUserAvatar: handleUpdateAvt, intl } = this.props;
    message.success(intl.formatMessage({ id: 'changesSaved', defaultMessage: 'Changes saved' }));
    handleUpdateAvt(data.response.data.url);
  }

  onCoverUploaded(data: any) {
    const { updateCurrentUserCover: handleUpdateCover, intl } = this.props;
    message.success(intl.formatMessage({ id: 'changesSaved', defaultMessage: 'Changes saved' }));
    handleUpdateCover(data.response.data.url);
  }

  coundown() {
    const { countTime } = this.state;
    this.setState({ countTime: countTime - 1 });
  }

  async submit(data: any) {
    const { currentUser, updatePerformer: handleUpdatePerformer } = this.props;
    handleUpdatePerformer({
      ...currentUser,
      ...data
    });
  }

  async verifyEmail() {
    const { currentUser, intl } = this.props;
    try {
      await this.setState({ emailSending: true });
      const resp = await authService.verifyEmail({
        sourceType: 'performer',
        source: currentUser
      });
      this.handleCountdown();
      resp.data && resp.data.message && message.success(resp.data.message);
    } catch (e) {
      const error = await e;
      message.success(error?.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      this.setState({ emailSending: false });
    }
  }

  render() {
    const {
      currentUser, updating, ui, countries, bodyInfo, settings, intl
    } = this.props;
    const { emailSending, countTime } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({ id: 'editProfile', defaultMessage: 'Edit Profile' })}
          </title>
        </Head>
        <div className="main-container user-account">
          {!currentUser.verifiedDocument && (
            <div className="verify-info">
              {intl.formatMessage({ id: 'yourIdDocumentsAreNotVerifiedYet', defaultMessage: 'Your ID documents are not verified yet! You could not post any content right now.' })}
              <p>
                {intl.formatMessage({ id: 'ifYouHaveAnyQuestion', defaultMessage: 'If you have any question, please contact our administrator to get more information.' })}
              </p>
            </div>
          )}
          <Tabs defaultActiveKey="basic" tabPosition="top" className="nav-tabs custom">
            <Tabs.TabPane tab={<span>{intl.formatMessage({ id: 'basicSettings', defaultMessage: 'Basic Settings' })}</span>} key="basic">
              <PerformerAccountForm
                onFinish={this.submit.bind(this)}
                updating={updating || emailSending}
                countTime={countTime}
                onVerifyEmail={this.verifyEmail.bind(this)}
                user={currentUser}
                options={{
                  uploadHeaders,
                  avatarUploadUrl: performerService.getAvatarUploadUrl(),
                  onAvatarUploaded: this.onAvatarUploaded.bind(this),
                  coverUploadUrl: performerService.getCoverUploadUrl(),
                  onCoverUploaded: this.onCoverUploaded.bind(this),
                  videoUploadUrl: performerService.getVideoUploadUrl()
                }}
                countries={countries}
                bodyInfo={bodyInfo}
              />
            </Tabs.TabPane>
            {/* <Tabs.TabPane tab={<span>{intl.formatMessage({ id: 'idDocuments', defaultMessage: 'ID Documents' })}</span>} key="verification">
              <PerformerVerificationForm
                user={currentUser}
              />
            </Tabs.TabPane> */}
            <Tabs.TabPane
              tab={<span>{intl.formatMessage({ id: 'pricingSettings', defaultMessage: 'Pricing Settings' })}</span>}
              key="subscription"
            >
              <PerformerSubscriptionForm
                onFinish={this.submit.bind(this)}
                updating={updating}
                user={currentUser}
                settings={settings}
              />
            </Tabs.TabPane>
            {/* <Tabs.TabPane tab={<span>Change Password</span>} key="password">
              <UpdatePaswordForm
                onFinish={this.updatePassword.bind(this)}
                updating={pwUpdating}
              />
            </Tabs.TabPane> */}
          </Tabs>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  updating: state.user.updating,
  ui: { ...state.ui },
  settings: state.settings
});
const mapDispatch = {
  updatePerformer,
  updateCurrentUserAvatar,
  updateCurrentUserCover
};
export default injectIntl(connect(mapStates, mapDispatch)(AccountSettings));
