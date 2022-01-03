import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Layout, message, Tabs } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import {
  IPerformer, IUIConfig
} from 'src/interfaces';
import {
  updatePerformer
} from 'src/redux/user/actions';
import { PerformerBankingForm, PerformerPaypalForm } from '@components/performer';
import { paymentService, performerService } from '@services/index';
import PageHeading from '@components/common/page-heading';
import '../../user/index.less';

interface IProps {
  user: IPerformer;
  ui: IUIConfig;
  updatePerformer: Function;
}
class BankingSettings extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    loading: false,
    submiting: false,
    loginUrl: '',
    stripeAccount: null
  }

  componentDidMount() {
    this.getAccount();
  }

  async handleUpdatePaypal(data) {
    const { user } = this.props;
    try {
      await this.setState({ submiting: true });
      const payload = { key: 'paypal', value: data, performerId: user._id };
      await performerService.updatePaymentGateway(user._id, payload);
      this.setState({ submiting: false });
      message.success('Changes saved');
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try againl later');
      this.setState({ submiting: false });
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
      ui, user
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
            <Tabs.TabPane
              tab={(
                <span>
                  <img src="/static/stripe-icon.jpeg" alt="stripe-icon" height="30px" />
                </span>
              )}
              key="stripe"
            >
              <PerformerBankingForm stripeAccount={stripeAccount} loading={loading || submiting} loginUrl={loginUrl} onConnectAccount={this.connectAccount.bind(this)} />
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
  ui: { ...state.ui },
  user: { ...state.user.current }
});
const mapDispatch = { updatePerformer };
export default connect(mapStates, mapDispatch)(BankingSettings);
