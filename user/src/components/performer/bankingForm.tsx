import { PureComponent } from 'react';
import {
  Button
} from 'antd';

interface IProps {
  loading: boolean;
  stripeAccount: any;
  loginUrl: string;
  onConnectAccount: Function;
}

export class PerformerBankingForm extends PureComponent<IProps> {
  render() {
    const {
      loading, stripeAccount, loginUrl, onConnectAccount
    } = this.props;
    return (
      <div
        className="account-form"
      >
        {stripeAccount && stripeAccount.payoutsEnabled && stripeAccount.detailsSubmitted && (
          <Button className="primary">
            <a href={loginUrl} target="_blank" rel="noreferrer">You are connected with Stripe, click here to log in</a>
          </Button>
        )}
        {(!stripeAccount || (stripeAccount && !stripeAccount.payoutsEnabled) || (stripeAccount && !stripeAccount.detailsSubmitted)) && (
          <div>
            <p>Please click here to complete the onboarding process & start earning money.</p>
            <Button
              className="primary"
              disabled={loading}
              loading={loading}
              onClick={onConnectAccount.bind(this)}
            >
              Connect with Stripe
            </Button>
          </div>
        )}
      </div>
    );
  }
}
