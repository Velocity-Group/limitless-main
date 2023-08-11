import React from 'react';
import Head from 'next/head';
import PayoutRequestForm from '@components/payout-request/form';
import { message } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { payoutRequestService } from 'src/services';
import {
  IUIConfig, PayoutRequestInterface, IUser
} from 'src/interfaces';
import nextCookie from 'next-cookies';
import Router from 'next/router';
import { connect } from 'react-redux';
import { injectIntl, IntlShape } from 'react-intl';

interface Props {
  payout: PayoutRequestInterface;
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

class PayoutRequestUpdatePage extends React.PureComponent<Props, States> {
  static authenticate = true;

  static async getInitialProps({ ctx }) {
    try {
      const {
        query: { data, id }
      } = ctx;
      if (process.browser && data) {
        return {
          payout: JSON.parse(data)
        };
      }

      const { token } = nextCookie(ctx);
      const resp = await payoutRequestService.detail(id, {
        Authorization: token
      });
      return {
        payout: resp.data
      };
    } catch {
      return {};
    }
  }

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
    const { payout, intl } = this.props;
    if (!payout) {
      message.error(
        intl.formatMessage({
          id: 'couldNotFindPayoutRequest',
          defaultMessage: 'Could not find payout request'
        })
      );
      Router.back();
    }
    this.calculateStatsPayout();
  }

  calculateStatsPayout = async () => {
    const { intl } = this.props;
    try {
      const resp = await payoutRequestService.calculate();
      this.setState({ statsPayout: resp.data });
    } catch {
      message.error(
        intl.formatMessage({
          id: 'somethingWentWrong',
          defaultMessage: 'Something went wrong, please try again!'
        })
      );
    }
  };

  async submit(data: {
    paymentAccountType: string;
    requestNote: string;
    requestTokens: number;
  }) {
    const { payout, user, intl } = this.props;
    if (['done', 'approved', 'rejected'].includes(payout.status)) {
      message.error(intl.formatMessage({ id: 'invalidStatus', defaultMessage: 'Invalid status' }));
      return;
    }
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
      await this.setState({ submiting: true });
      const body = {
        paymentAccountType: data.paymentAccountType,
        requestTokens: data.requestTokens,
        requestNote: data.requestNote
      };
      await payoutRequestService.update(payout._id, body);
      message.success('Changes saved!');
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
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const {
      payout, ui, user, intl
    } = this.props;
    const { submiting, statsPayout } = this.state;
    return (
      <>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'editPayoutRequest',
              defaultMessage: 'Edit Payout Request'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'editPayoutRequest',
              defaultMessage: 'Edit Payout Request'
            })}
            icon={<NotificationOutlined />}
          />
          <PayoutRequestForm
            statsPayout={statsPayout}
            payout={payout}
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
  user: state.user.current
});

export default injectIntl(connect(mapStateToProps)(PayoutRequestUpdatePage));
