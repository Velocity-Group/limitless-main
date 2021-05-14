import React from 'react';
import Head from 'next/head';
import PayoutRequestForm from '@components/payout-request/form';
import { message } from 'antd';
import { connect } from 'react-redux';
import { payoutRequestService } from 'src/services';
import Router from 'next/router';
import { IUIConfig } from '@interfaces/ui-config';

interface Props {
  ui: IUIConfig;
}

interface States {
  submiting: boolean;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  }
}

class PayoutRequestCreatePage extends React.PureComponent<Props, States> {
  static authenticate = true;

  static onlyPerformer = true;

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
    requestTokens: number;
    requestNote: string;
  }) {
    if (!data.requestTokens || data.requestTokens < 1) {
      message.error('Invalid request tokens');
      return;
    }
    try {
      this.setState({ submiting: true });
      const body = {
        requestNote: data.requestNote,
        source: 'performer',
        requestTokens: data.requestTokens
      };
      await payoutRequestService.create(body);
      message.success('Requested a payout');
      Router.push('/model/payout-request');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const { submiting, statsPayout } = this.state;
    const { ui } = this.props;
    return (
      <>
        <Head>
          <title>{`${ui?.siteName} | Request a Payout`}</title>
        </Head>
        <div className="main-container">
          <div className="page-heading">Request a Payout</div>
          <PayoutRequestForm
            payout={{
              requestNote: '',
              requestTokens: 1,
              status: 'pending'
            }}
            statsPayout={statsPayout}
            submit={this.submit.bind(this)}
            submiting={submiting}
            tokenConversionRate={ui?.tokenConversionRate}
          />
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  ui: state.ui
});

export default connect(mapStateToProps)(PayoutRequestCreatePage);