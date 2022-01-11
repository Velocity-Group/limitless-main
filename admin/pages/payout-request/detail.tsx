/* eslint-disable jsx-a11y/label-has-associated-control */
import {
  Layout, message, Select, Button, PageHeader,
  Input, Space, Statistic, Divider, Avatar
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { IPayoutRequest } from 'src/interfaces';
import { BreadcrumbComponent } from '@components/common/breadcrumb';
import Page from '@components/common/layout/page';
import { payoutRequestService } from 'src/services';
import Router from 'next/router';
import { getResponseError } from '@lib/utils';
import { formatDate } from 'src/lib/date';
import './index.less';
import { getGlobalConfig } from '@services/config';

const { Content } = Layout;

interface IProps {
  id: string;
}

interface IStates {
  request: IPayoutRequest;
  loading: boolean;
  status: string;
  adminNote: any;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  }
}

class PayoutDetailPage extends PureComponent<IProps, IStates> {
  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      request: null,
      loading: true,
      status: '',
      adminNote: '',
      statsPayout: {
        totalEarnedTokens: 0,
        previousPaidOutTokens: 0,
        remainingUnpaidTokens: 0
      }
    };
  }

  componentDidMount() {
    this.getData();
  }

  async handleStripePayout() {
    const { status, request } = this.state;
    if (status !== 'pending' || request.paymentAccountType !== 'stripe') return;
    try {
      await this.setState({ loading: true });
      const resp = await (await payoutRequestService.payout(request._id)).data;
      if (resp.status === 'done') {
        message.success('Transfer money via Stripe Connect success', 5);
        await this.setState({ status: resp.status });
        this.onUpdate();
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      this.setState({ loading: false });
      message.error(getResponseError(err), 10);
    }
  }

  async onUpdate() {
    const { status, adminNote, request } = this.state;
    try {
      await this.setState({ loading: true });
      await payoutRequestService.update(request._id, {
        status,
        adminNote
      });
      message.success('Updated successfully');
      Router.replace('/payout-request');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err), 10);
    } finally {
      this.setState({ loading: false });
    }
  }

  async getData() {
    const { id } = this.props;
    try {
      await this.setState({ loading: true });
      const resp = await payoutRequestService.findById(id);
      this.getStatsPayout(resp.data.sourceId);
      await this.setState({
        request: resp.data,
        status: resp.data.status,
        adminNote: resp.data.adminNote
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ loading: false });
    }
  }

  async getStatsPayout(performerId: string) {
    try {
      const resp = await payoutRequestService.calculate({
        performerId
      });
      this.setState({
        statsPayout: resp.data
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const {
      request, adminNote, loading, statsPayout, status
    } = this.state;
    const paymentAccountInfo = request?.paymentAccountInfo;
    const config = getGlobalConfig();
    return (
      <Layout>
        <Head>
          <title>Payout Request Details</title>
        </Head>
        <Content>
          <div className="main-container">
            <BreadcrumbComponent
              breadcrumbs={[
                { title: 'Payout Requests', href: '/payout-request' },
                {
                  title: 'Payout Request Details'
                }
              ]}
            />
            {request ? (
              <Page>
                <PageHeader title="Payout Request Details" />
                <div style={{ margin: '20px 0', textAlign: 'center', width: '100%' }}>
                  <Space size="large">
                    <Statistic
                      prefix={<img src="/coin-ico.png" alt="coin" width="20px" />}
                      title="Total Tokens"
                      value={statsPayout?.totalEarnedTokens || 0}
                      precision={2}
                    />
                    <Statistic
                      prefix={<img src="/coin-ico.png" alt="coin" width="20px" />}
                      title="Paid Out Tokens"
                      value={statsPayout?.previousPaidOutTokens || 0}
                      precision={2}
                    />
                    <Statistic
                      prefix={<img src="/coin-ico.png" alt="coin" width="20px" />}
                      title="Remaining Tokens"
                      value={statsPayout?.remainingUnpaidTokens || 0}
                      precision={2}
                    />
                  </Space>
                </div>
                <p>
                  Model:
                  {' '}
                  <strong>
                    <Avatar src={request?.sourceInfo?.avatar || '/no-avatar.png'} />
                    {' '}
                    {request?.sourceInfo?.name || request?.sourceInfo?.username || 'N/A'}
                  </strong>
                </p>
                <p>
                  Requested amount of tokens:
                  {' '}
                  {request.requestTokens.toFixed(2) || 0}
                </p>
                <p>
                  Conversion rate:
                  {' '}
                  $
                  {((request.requestTokens || 0) * (request.tokenConversionRate || 1)).toFixed(2)}
                </p>
                <p>
                  Requested on:
                  {' '}
                  {formatDate(request.createdAt)}
                </p>
                <p>
                  Note from the model
                  {' '}
                  {request.requestNote}
                </p>
                <Divider />
                {request.paymentAccountType === 'paypal' && (
                  <div>
                    <h2>Confirm payout via Paypal</h2>
                    <p>
                      Account:
                      {' '}
                      {paymentAccountInfo?.value?.email || 'N/A'}
                    </p>
                    <p>
                      Amount: $
                      {((request.requestTokens || 0) * (request.tokenConversionRate || 1)).toFixed(2)}
                    </p>
                    <form action={config.NEXT_PUBLIC_PAYPAY_PAYOUT_URL || 'https://www.paypal.com/cgi-bin/webscr'} method="post" className="paypal-payout">
                      <input type="hidden" name="cmd" value="_xclick" />
                      <input type="hidden" name="return" value={window.location.href} />
                      <input type="hidden" name="cancel_return" value={window.location.href} />
                      <input type="hidden" name="business" value={paymentAccountInfo?.value?.email} />
                      <input type="hidden" name="item_number" value={request._id} />
                      <input type="hidden" name="item_name" value={`Payout to ${request?.sourceInfo?.name || request?.sourceInfo?.username || `${request?.sourceInfo?.firstname} ${request?.sourceInfo?.lastName}`}`} placeholder="Description" />
                      <input type="hidden" name="currency_code" value="USD" />
                      <input type="hidden" name="amount" value={(request.requestTokens || 0) * (request.tokenConversionRate || 1)} />
                      <input disabled={loading || request?.status !== 'pending'} type="image" src="/paypal-pay-btn.png" name="submit" alt="PayPal" style={{ width: 180 }} />
                    </form>
                    <p style={{ color: 'red' }}>
                      <small>Please update status manually after transaction success!</small>
                    </p>
                  </div>
                )}
                {request.paymentAccountType === 'stripe' && (
                  <div>
                    <h2>
                      Confirm transfer via Stripe Connect
                    </h2>
                    <div>
                      <Button type="primary" disabled={loading || ['done', 'rejected'].includes(request?.status)} onClick={this.handleStripePayout.bind(this)}>
                        Click here to transfer $
                        {((request.requestTokens || 0) * (request.tokenConversionRate || 1) || 0).toFixed(2)}
                        {' '}
                        to
                        {' '}
                        {request?.sourceInfo?.name || request?.sourceInfo?.username || 'N/A'}
                      </Button>
                    </div>
                  </div>
                )}
                <Divider />
                <div style={{ marginBottom: '10px' }}>
                  <p>
                    Please update the below status manually after the transaction is processed
                  </p>
                  <Select
                    disabled={loading || ['done', 'rejected'].includes(request?.status)}
                    style={{ width: '100%' }}
                    onChange={(e) => this.setState({ status: e })}
                    value={status}
                  >
                    {/* <Select.Option key="approved" value="approved">
                          Approved
                        </Select.Option> */}
                    <Select.Option key="pending" value="pending">
                      Pending
                    </Select.Option>
                    <Select.Option key="rejected" value="rejected">
                      Rejected
                    </Select.Option>
                    <Select.Option key="done" value="done">
                      Done
                    </Select.Option>
                  </Select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <p>Note to the model: </p>
                  <Input.TextArea
                    defaultValue={adminNote}
                    style={{ width: '100%' }}
                    onChange={(v) => {
                      this.setState({ adminNote: v.target.value });
                    }}
                    placeholder="Write your message here"
                    autoSize={{ minRows: 3 }}
                  />
                </div>
                <div style={{ marginBottom: '10px', display: 'flex' }}>
                  <Button
                    type="primary"
                    onClick={this.onUpdate.bind(this)}
                  >
                    Update
                  </Button>
                  &nbsp;
                  <Button
                    type="default"
                    onClick={() => Router.back()}
                  >
                    Back
                  </Button>
                </div>
              </Page>
            ) : (
              <p>Request not found.</p>
            )}
          </div>
        </Content>
      </Layout>
    );
  }
}

export default PayoutDetailPage;
