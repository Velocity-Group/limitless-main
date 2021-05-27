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
import { CardElement, Elements, ElementsConsumer } from '@stripe/react-stripe-js';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  settings: ISettings
}

class NewCardPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  state = {
  };

  componentDidMount() {
    // this.getData();
  }

  handleSubmit = async () => {
    const { stripe, elements } = this.props;

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement
    });

    if (error) {
      console.log('[error]', error);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
    }
  };

  // async getData() {
  //   try {
  //     await this.setState({ loading: true });
  //     const resp = await paymentService.getStripeCards();
  //     resp.data && this.setState({ cards: resp.data });
  //   } catch (error) {
  //     message.error(getResponseError(error) || 'An error occured. Please try again.');
  //   } finally {
  //     this.setState({ loading: false });
  //   }
  // }

  render() {
    const { } = this.state;
    const { ui, settings } = this.props;

    const stripePromise = settings.stripePublishableKey && loadStripe(settings.stripePublishableKey);

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
              <Elements stripe={stripePromise}>
                <ElementsConsumer>
                  <form onSubmit={this.handleSubmit.bind(this)}>
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4'
                            }
                          },
                          invalid: {
                            color: '#9e2146'
                          }
                        }
                      }}
                    />
                    <button type="submit" disabled={!stripe}>
                      Pay
                    </button>
                  </form>
                </ElementsConsumer>
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
