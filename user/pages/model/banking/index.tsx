import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Layout, message, Tabs } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import {
  IPerformer, IUIConfig, ISettings, ICountry
} from 'src/interfaces';
import {
  updatePerformer, updateUserSuccess
} from 'src/redux/user/actions';
import { StripeConnectForm, PerformerPaypalForm, PerformerBankingForm } from '@components/performer';
import { paymentService, performerService, utilsService } from '@services/index';
import PageHeading from '@components/common/page-heading';
import '../../user/index.less';

interface IProps {
  user: IPerformer;
  ui: IUIConfig;
  updatePerformer: Function;
  settings: ISettings;
  countries: ICountry[];
  updateUserSuccess: Function;
}
class BankingSettings extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps() {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return {
      countries: countries?.data || []
    };
  }

  state = {
    loading: false,
    submiting: false,
    loginUrl: '',
    stripeAccount: null
  }

  componentDidMount() {
    const { settings } = this.props;
    settings.paymentGateway === 'stripe' && this.getAccount();
  }

  async handleUpdatePaypal(data) {
    const { user, updateUserSuccess: onUpdateSuccess } = this.props;
    try {
      this.setState({ submiting: true });
      const payload = { key: 'paypal', value: data, performerId: user._id };
      const resp = await performerService.updatePaymentGateway(user._id, payload);
      onUpdateSuccess({ ...user, paypalSetting: resp.data });
      this.setState({ submiting: false });
      message.success('Paypal account was updated successfully!');
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try againl later');
      this.setState({ submiting: false });
    }
  }

  async handleUpdateBanking(data) {
    try {
      this.setState({ submiting: true });
      const { user, updateUserSuccess: onUpdateSuccess } = this.props;
      const info = { ...data, performerId: user._id };
      const resp = await performerService.updateBanking(user._id, info);
      onUpdateSuccess({ ...user, bankingInformation: resp.data });
      this.setState({ submiting: false });
      message.success('Banking account was updated successfully!');
    } catch (error) {
      this.setState({ submiting: false });
      const err = await error;
      message.error(err?.message || 'An error orccurred, please try again.');
    }
  }

  async getAccount() {
    try {
      const { user, updatePerformer: handleUpdateStripe } = this.props;
      await this.setState({ loading: true });
      const [loginLink, account] = await Promise.all([
        paymentService.loginLink(),
        paymentService.retrieveStripeAccount()
      ]);
      this.setState({
        loginUrl: loginLink.data.url,
        stripeAccount: account.data,
        loading: false
      });
      handleUpdateStripe({ ...user, stripeAccount: account.data });
    } catch {
      this.setState({ loading: false });
    }
  }

  async connectAccount() {
    try {
      await this.setState({ submiting: true });
      const resp = (await paymentService.connectStripeAccount()).data;
      if (resp.url) {
        window.location.href = resp.url;
      }
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const {
      ui, user, settings, countries
    } = this.props;
    const {
      loading, submiting, loginUrl, stripeAccount
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Banking (to earn)
          </title>
        </Head>
        <div className="main-container">
          <PageHeading icon={<BankOutlined />} title="Banking (to earn)" />
          <Tabs>
            {/* {settings.paymentGateway === 'stripe' && (
            <Tabs.TabPane
              tab={(
                <span>
                  <img src="/static/stripe-icon.jpeg" alt="stripe-icon" height="30px" />
                </span>
              )}
              key="stripe"
            >
              <StripeConnectForm
                stripeAccount={stripeAccount}
                loading={loading || submiting}
                loginUrl={loginUrl}
                onConnectAccount={this.connectAccount.bind(this)}
              />
            </Tabs.TabPane>
            )} */}
            <Tabs.TabPane
              tab={(
                <span>
                  <img src="/static/banking-ico.png" alt="banking-icon" height="30px" />
                </span>
              )}
              key="banking"
            >
              <PerformerBankingForm
                onFinish={this.handleUpdateBanking.bind(this)}
                updating={submiting}
                user={user}
                countries={countries}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={(
                <span>
                  <img src="/static/paypal-ico.png" alt="paypal-icon" height="30px" />
                </span>
              )}
              key="paypal"
            >
              <PerformerPaypalForm
                onFinish={this.handleUpdatePaypal.bind(this)}
                updating={submiting}
                user={user}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current,
  settings: state.settings
});
const mapDispatch = { updatePerformer, updateUserSuccess };
export default connect(mapStates, mapDispatch)(BankingSettings);
