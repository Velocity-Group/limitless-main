import React from 'react';
import Head from 'next/head';
import { NotificationOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import PayoutRequestForm from '@components/payout-request/form';
import { message } from 'antd';
import { connect } from 'react-redux';
import { payoutRequestService } from 'src/services';
import Router from 'next/router';
import { IUIConfig, IUser } from 'src/interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';

interface Props {
  ui: IUIConfig;
  user: IUser;
  intl: IntlShape;
}

interface States {
  submiting: boolean;
  statsPayout: {
    totalEarnings: number;
    previousPaidOut: number;
  }
}

class PayoutRequestCreatePage extends React.PureComponent<Props, States> {
  static authenticate = true;

  constructor(props: Props) {
    super(props);
    this.state = {
      submiting: false,
      statsPayout: {
        totalEarnings: 0,
        previousPaidOut: 0
      }
    };
  }

  componentDidMount() {
    this.calculateStatsPayout();
  }

  calculateStatsPayout = async () => {
    const resp = await payoutRequestService.calculate();
    resp?.data && this.setState({ statsPayout: resp.data });
  };

  async submit(data) {
    const { user, intl } = this.props;
    if (data.requestTokens > user.balance) {
      message.error(
        intl.formatMessage({
          id: 'requestedAmountMustBeLessThanOrEqualYourWalletBalance',
          defaultMessage:
            'Requested amount must be less than or equal your wallet balance'
        })
      );
      return;
    }
    try {
      this.setState({ submiting: true });
      await payoutRequestService.create(data);
      message.success(
        intl.formatMessage({
          id: 'yourPayoutRequestWasSent',
          defaultMessage: 'Your payout request was sent!'
        })
      );
      Router.push('/payout-request');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(
        error?.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
      this.setState({ submiting: false });
    }
  }

  render() {
    const { submiting, statsPayout } = this.state;
    const { ui, user, intl } = this.props;
    return (
      <>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'newPayoutRequest',
              defaultMessage: 'New Payout Request'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'newPayoutRequest',
              defaultMessage: 'New Payout Request'
            })}
            icon={<NotificationOutlined />}
          />
          <PayoutRequestForm
            payout={{
              requestNote: '',
              requestTokens: 1,
              status: 'pending'
            }}
            statsPayout={statsPayout}
            submit={this.submit.bind(this)}
            submiting={submiting}
            user={user}
          />
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  ui: state.ui,
  user: state.user.current,
  settings: state.settings
});

export default injectIntl(connect(mapStateToProps)(PayoutRequestCreatePage));
