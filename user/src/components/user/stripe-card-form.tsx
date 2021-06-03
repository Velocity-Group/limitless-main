import { PureComponent } from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import {
  message
} from 'antd';
import { } from '@ant-design/icons';
import Router from 'next/router';

interface IProps {
  submit: Function;
  submiting: boolean;
  stripe: any;
  elements: any;
}

class CardForm extends PureComponent<IProps> {
  componentDidMount() {
    const { router } = Router;
    if (router?.query?.client_secret && router?.query?.source) {
      this.retrieveSource(router?.query?.source, router?.query?.client_secret);
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const {
      submit, submiting, stripe, elements
    } = this.props;
    if (!stripe || !elements || submiting) {
      return;
    }
    const cardElement = elements.getElement(CardElement);
    // Use your card Element with other Stripe.js APIs
    const { error, source: source1 } = await stripe.createSource(cardElement, { type: 'card' });
    if (error) {
      // eslint-disable-next-line no-console
      console.log('[error]', error);
      message.error(error?.message || 'Invalid card information, please check then try again');
      return;
    }
    if (source1?.card?.three_d_secure === 'required') {
      const { error: err, source: source2 } = await stripe.createSource({
        type: 'three_d_secure',
        amount: 1000,
        currency: 'usd',
        three_d_secure: {
          card: source1.id
        },
        redirect: {
          return_url: window.location.href
        }
      });
      if (err) {
        message.error(err?.message || 'Process on 3D secure card error, please check then try again');
        return;
      }
      if (source2?.status === 'chargeable') {
        submit(source2);
        return;
      }
      if (source2?.status === 'pending' || source2?.redirect?.status === 'pending') {
        window.location.href = source2?.redirect.url;
        return;
      }
    }
    submit(source1);
  }

  retrieveSource = async (sourceId, clientSecret) => {
    const { stripe, submit, submiting } = this.props;
    if (!stripe || submiting) {
      return;
    }
    const { error, source } = await stripe.retrieveSource({ id: sourceId, client_secret: clientSecret } as any);
    if (error) {
      message.error(error?.message || 'Process on 3D secure card error, please check then try again');
      return;
    }
    if (source?.status !== 'chargeable') return;
    submit(source);
  };

  render() {
    const { submiting, stripe } = this.props;
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <img src="/static/stripe-card.png" width="100%" alt="stripe-ico" />
        <div className="stripe-card-form">
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
        </div>
        <button className="ant-btn primary" type="submit" disabled={!stripe || submiting} style={{ width: '100%' }}>
          SUBMIT
        </button>
      </form>
    );
  }
}

export default CardForm;
