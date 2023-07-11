import { PureComponent } from 'react';
import { Button } from 'antd';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  loading: boolean;
  stripeAccount: any;
  loginUrl: string;
  onConnectAccount: Function;
  intl: IntlShape;
}

export class StripeConnectForm extends PureComponent<IProps> {
  render() {
    const {
      loading, stripeAccount, loginUrl, onConnectAccount, intl
    } = this.props;
    return (
      <div className="account-form">
        <h4 className="text-center">
          {intl.formatMessage({
            id: 'theStripeConnectAccountWillBeUsedToAutomaticallyPayouts!',
            defaultMessage: 'The Stripe connect account will be used to automatically payouts. You can also save your Banking or PayPal account to request manual payouts'
          })}
        </h4>
        {stripeAccount && stripeAccount.payoutsEnabled && stripeAccount.detailsSubmitted && (
          <div className="text-center">
            <p>
              {intl.formatMessage({
                id: 'youAreConnectedWithStripe!',
                defaultMessage: 'You are connected with Stripe!'
              })}
            </p>
            <Button className="primary">
              <a href={loginUrl} target="_blank" rel="noreferrer">
                {intl.formatMessage({
                  id: 'clickHereToLogIn',
                  defaultMessage: 'Click here to log in'
                })}
              </a>
            </Button>
            <Button
              className="secondary"
              disabled={loading}
              loading={loading}
              onClick={onConnectAccount.bind(this)}
            >
              {intl.formatMessage({
                id: 'reconnectByAnotherAccount',
                defaultMessage: 'Reconnect by another account'
              })}
            </Button>
          </div>
        )}
        {(!stripeAccount
          || (stripeAccount && !stripeAccount.payoutsEnabled)
          || (stripeAccount && !stripeAccount.detailsSubmitted)) && (
          <div>
            <p>
              {intl.formatMessage({
                id: 'pleaseClickHereToCompleteTheOnboardingProcessAndStartEarningMoney',
                defaultMessage:
                  'Please click here to complete the onboarding process & start earning money.'
              })}
            </p>
            <Button
              className="secondary"
              disabled={loading}
              loading={loading}
              onClick={onConnectAccount.bind(this)}
            >
              {intl.formatMessage({
                id: 'connectWithStripe',
                defaultMessage: 'Connect with Stripe'
              })}
            </Button>
          </div>
        )}
      </div>
    );
  }
}

export default injectIntl(StripeConnectForm);
