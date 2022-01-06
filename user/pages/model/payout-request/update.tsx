import React from 'react';
import Head from 'next/head';
import PayoutRequestForm from '@components/payout-request/form';
import { message } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { payoutRequestService } from 'src/services';
import {
  ISettings, IUIConfig, PayoutRequestInterface, IUser
} from 'src/interfaces';
import nextCookie from 'next-cookies';
import Router from 'next/router';
import { connect } from 'react-redux';

interface Props {
  payout: PayoutRequestInterface;
  ui: IUIConfig;
  settings: ISettings;
  user: IUser;
}

interface States {
  submiting: boolean;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  }
}

class PayoutRequestUpdatePage extends React.PureComponent<Props, States> {
  static authenticate = true;

  static onlyPerformer = true;

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
        totalEarnedTokens: 0,
        previousPaidOutTokens: 0,
        remainingUnpaidTokens: 0
      }
    };
  }

  componentDidMount() {
    const { payout } = this.props;
    if (!payout) {
      message.error('Could not find payout request');
      Router.back();
    }
    this.calculateStatsPayout();
  }

  calculateStatsPayout = async () => {
    try {
      const resp = await payoutRequestService.calculate();
      this.setState({ statsPayout: resp.data });
    } catch {
      message.error('Something went wrong. Please try to input date again!');
    }
  };

  async submit(data: {
    paymentAccountType: string;
    requestNote: string;
    requestTokens: number;
  }) {
    const { payout, user } = this.props;
    if (['done', 'approved', 'rejected'].includes(payout.status)) {
      message.error('Please recheck request payout status');
      return;
    }
    if (data.requestTokens > user.balance) {
      message.error('Requested tokens must be less than or equal your balance');
      return;
    }
    try {
      await this.setState({ submiting: true });
      const body = {
        // paymentAccountType: data.paymentAccountType,
        requestTokens: data.requestTokens,
        requestNote: data.requestNote,
        source: 'performer'
      };
      await payoutRequestService.update(payout._id, body);
      message.success('Changes saved!');
      Router.back();
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const { payout, ui, settings } = this.props;
    const { submiting, statsPayout } = this.state;
    return (
      <>
        <Head>
          <title>{`${ui?.siteName} | Edit Payout Request`}</title>
        </Head>
        <div className="main-container">
          <PageHeading title="Edit Payout Request" icon={<NotificationOutlined />} />
          <PayoutRequestForm
            statsPayout={statsPayout}
            payout={payout}
            submit={this.submit.bind(this)}
            submiting={submiting}
            tokenConversionRate={settings?.tokenConversionRate}
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

export default connect(mapStateToProps)(PayoutRequestUpdatePage);
