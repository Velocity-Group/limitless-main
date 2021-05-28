import { PureComponent } from 'react';
import {
  Button, message
} from 'antd';
import { paymentService } from '@services/payment.service';

interface IProps { }

export class PerformerBankingForm extends PureComponent<IProps> {
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

  async getLoginLink() {
    try {
      await this.setState({ loading: true });
      const resp = await (await paymentService.retrieveStripeAccount()).data;
      this.setState({ stripeAccount: resp });
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
      submiting, loading, stripeAccount, loginUrl
    } = this.state;
    return (
      <div
        className="account-form"
      >
        {stripeAccount && stripeAccount.chargesEnabled && (
          <Button className="primary">
            <a href={loginUrl} target="_blank" rel="noreferrer">You are connected with Stripe, click here to log in</a>
          </Button>
        )}
        {(!stripeAccount || (stripeAccount && !stripeAccount.chargesEnabled)) && (
          <div>
            <p>Please click here to complete the onboarding process & start earning money.</p>
            <Button
              className="primary"
              disabled={loading || submiting}
              loading={loading || submiting}
              onClick={this.connectAccount.bind(this)}
            >
              Connect with Stripe
            </Button>
          </div>
        )}
      </div>
    );
  }
}
