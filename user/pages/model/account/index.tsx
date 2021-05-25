import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Tabs, message, Layout } from 'antd';
import {
  IPerformer,
  IBanking,
  IUIConfig,
  ICountry,
  IBlockCountries,
  IHeight,
  IWeight
} from 'src/interfaces';
import {
  updatePerformer,
  updateCurrentUserAvatar,
  updateBanking,
  updateCurrentUserCover,
  updateBlockCountries
} from 'src/redux/user/actions';
import {
  authService, blockService, performerService, utilsService
} from '@services/index';
import { UpdatePaswordForm } from '@components/user/update-password-form';
import {
  PerformerAccountForm,
  PerformerBankingForm,
  PerformerSubscriptionForm,
  PerformerBlockCountriesForm,
  PerformerVerificationForm
} from '@components/performer';
import '../../user/index.less';

interface IProps {
  currentUser: IPerformer;
  updatePerformer: Function;
  updating?: boolean;
  updateCurrentUserAvatar: Function;
  updateBanking: Function;
  ui: IUIConfig;
  updateCurrentUserCover: Function;
  countries: ICountry[];
  updateBlockCountries: Function;
  heights?: IHeight[];
  weights?: IWeight[];
}
class AccountSettings extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static onlyPerformer: boolean = true;

  static async getInitialProps() {
    const [countries, heights, weights] = await Promise.all([
      utilsService.countriesList(),
      utilsService.heightList(),
      utilsService.weightList()
    ]);
    return {
      countries: countries && countries.data ? countries.data : [],
      heights: heights && heights.data ? heights.data : [],
      weights: weights && weights.data ? weights.data : []
    };
  }

  _intervalCountdown: any;

  state = {
    pwUpdating: false,
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

  async handleUpdateBanking(data: IBanking) {
    const { currentUser, updateBanking: handleUpdateBanking } = this.props;
    await handleUpdateBanking({ ...data, performerId: currentUser._id });
  }

  async handleUpdateBlockCountries(data: IBlockCountries) {
    const { updateBlockCountries: handleBlockCountry } = this.props;
    try {
      const resp = await blockService.blockCountries(data);
      message.success('Changes saved');
      handleBlockCountry(resp.data);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try againl later');
    }
  }

  onAvatarUploaded(data: any) {
    const { updateCurrentUserAvatar: handleUpdateAvt } = this.props;
    message.success('Changes saved');
    handleUpdateAvt(data.response.data.url);
  }

  onCoverUploaded(data: any) {
    const { updateCurrentUserCover: handleUpdateCover } = this.props;
    message.success('Changes saved');
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

  async updatePassword(data: any) {
    try {
      this.setState({ pwUpdating: true });
      await authService.updatePassword(data.password, 'performer');
      message.success('Changes saved.');
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'An error occurred, please try again!');
    } finally {
      this.setState({ pwUpdating: false });
    }
  }

  async verifyEmail() {
    const { currentUser } = this.props;
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
      message.success(error?.message || 'An error occured, please try again later');
    } finally {
      this.setState({ emailSending: false });
    }
  }

  render() {
    const {
      currentUser, updating, ui, countries, weights, heights
    } = this.props;
    const { pwUpdating, emailSending, countTime } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Account Settings
            {' '}
          </title>
        </Head>
        <div className="main-container user-account">
          {!currentUser.verifiedDocument && (
          <div className="verify-info">
            Your ID documents are not verified yet! You could not post any content right now.
            <p>
              Please upload your ID documents to get approval then start making money.
            </p>
            <p>
              If you have any question, please contact our administrator to get more information.
            </p>
          </div>
          )}
          <Tabs defaultActiveKey="basic" tabPosition="top" className="nav-tabs">
            <Tabs.TabPane tab={<span>Basic Settings</span>} key="basic">
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
                weights={weights}
                heights={heights}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>ID Documents</span>} key="verification">
              <PerformerVerificationForm
                onFinish={this.submit.bind(this)}
                updating={updating}
                user={currentUser}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={<span>Pricing Settings</span>}
              key="subscription"
            >
              <PerformerSubscriptionForm
                onFinish={this.submit.bind(this)}
                updating={updating}
                user={currentUser}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Banking</span>} key="bankInfo">
              <PerformerBankingForm
                onFinish={this.handleUpdateBanking.bind(this)}
                updating={updating}
                user={currentUser}
                countries={countries}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Block Countries</span>} key="block">
              <PerformerBlockCountriesForm
                onFinish={this.handleUpdateBlockCountries.bind(this)}
                updating={updating}
                blockCountries={currentUser.blockCountries}
                countries={countries}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Change Password</span>} key="password">
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

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  updating: state.user.updating,
  ui: { ...state.ui }
});
const mapDispatch = {
  updatePerformer,
  updateCurrentUserAvatar,
  updateBanking,
  updateCurrentUserCover,
  updateBlockCountries
};
export default connect(mapStates, mapDispatch)(AccountSettings);
