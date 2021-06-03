import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Layout, message } from 'antd';
import {
  IPerformer, IUIConfig
} from 'src/interfaces';
import { PerformerBankingForm } from '@components/performer';
import { paymentService } from '@services/payment.service';
import '../../user/index.less';

interface IProps {
  currentUser: IPerformer;
  ui: IUIConfig;
}
class BankingSettings extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static onlyPerformer: boolean = true;

  state = {
    stripeAccount: null,
    loading: false,
    submiting: false,
    loginUrl: ''
  }

  componentDidMount() {
    this.getAccount();
  }

  async getAccount() {
    try {
      await this.setState({ loading: true });
      const [account, loginLink] = await Promise.all([
        paymentService.retrieveStripeAccount(),
        paymentService.loginLink()
      ]);
      this.setState({ stripeAccount: account.data, loginUrl: loginLink.data.url });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(await e);
    } finally {
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
      ui
    } = this.props;
    const {
      stripeAccount, loading, submiting, loginUrl
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Banking
            {' '}
          </title>
        </Head>
        <div className="main-container user-account">
          <div className="page-heading">Banking</div>
          <PerformerBankingForm stripeAccount={stripeAccount} loading={loading || submiting} loginUrl={loginUrl} onConnectAccount={this.connectAccount.bind(this)} />
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui }
});
const mapDispatch = { };
export default connect(mapStates, mapDispatch)(BankingSettings);
