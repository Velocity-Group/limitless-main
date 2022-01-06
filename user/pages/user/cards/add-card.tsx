import { PureComponent } from 'react';
import {
  message, Layout
} from 'antd';
import PageHeading from '@components/common/page-heading';
import { CreditCardOutlined } from '@ant-design/icons';
import Head from 'next/head';
import {
  ISettings, IUIConfig
} from 'src/interfaces';
import { paymentService } from '@services/index';
import { connect } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ElementsConsumer } from '@stripe/react-stripe-js';
import { getCurrentUser } from '@redux/auth/actions';
import StripeCardForm from '@components/user/stripe-card-form';
import Router from 'next/router';
import './index.less';

interface IProps {
  ui: IUIConfig;
  settings: ISettings;
  getCurrentUser: Function;
}

class NewCardPage extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    submiting: false
  };

  async handleAddCard(source: any) {
    const { getCurrentUser: handleUpdateCurrentUser } = this.props;
    try {
      await this.setState({ submiting: true });
      await paymentService.addStripeCard({ sourceToken: source.id });
      handleUpdateCurrentUser();
      message.success('Payment card added successfully');
      Router.replace('/user/cards');
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'An error occured. Please try again.');
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
          <PageHeading title="Add new Card" icon={<CreditCardOutlined />} />
          <div className="card-form">
            <Elements stripe={loadStripe(settings.stripePublishableKey || '')}>
              <ElementsConsumer>
                {({ stripe, elements }) => (
                  <StripeCardForm submit={this.handleAddCard.bind(this)} stripe={stripe} elements={elements} submiting={submiting} />
                )}
              </ElementsConsumer>

            </Elements>
          </div>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings }
});
const mapDispatch = { getCurrentUser };
export default connect(mapState, mapDispatch)(NewCardPage);
