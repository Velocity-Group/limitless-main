import { PureComponent } from 'react';
import {
  message, Layout, Spin
} from 'antd';
import { } from '@ant-design/icons';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import {
  ISettings,
  IUIConfig, IUser
} from 'src/interfaces';
import { paymentService } from '@services/index';
import { connect } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardForm from '@components/user/stripe-card-form';
import Router from 'next/router';
import './index.less';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  settings: ISettings
}

class NewCardPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  state = {
    submiting: false
  };

  async handleAddCard(cardToken: any) {
    try {
      await this.setState({ submiting: true });
      await paymentService.addStripeCard({ sourceToken: cardToken.id });
      message.success('Add card success');
      Router.replace('/user/cards');
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'An error occured. Please try again.');
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const { ui, settings } = this.props;
    const { submiting } = this.state;

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Add New Card
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Add New Card</span>
            </div>
            <div className="card-form">
              <Elements stripe={loadStripe(settings.stripePublishableKey || '')}>
                <StripeCardForm submit={this.handleAddCard.bind(this)} submiting={submiting} />
              </Elements>
            </div>
          </Page>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings },
  currentUser: { ...state.user.current }
});
const mapDispatch = { };
export default connect(mapState, mapDispatch)(NewCardPage);
