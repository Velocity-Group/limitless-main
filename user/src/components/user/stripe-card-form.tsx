import { PureComponent } from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import {
  message
} from 'antd';

interface IProps {
  submit: Function;
  submiting: boolean;
  stripe: any;
  elements: any;
}

class CardForm extends PureComponent<IProps> {
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
    const { error, source } = await stripe.createSource(cardElement, {
      type: 'card',
      redirect: {
        return_url: `${window.location.origin}/user/payment-history`
      }
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.log('[error]', error);
      message.error(error?.message || 'Invalid card information, please check then try again');
      return;
    }
    submit(source);
  }

  render() {
    const { submiting, stripe } = this.props;
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <img src="/static/stripe-card.png" width="100%" alt="stripe-ico" />
        <div className="stripe-card-form">
          <CardElement
            options={{
              hidePostalCode: true,
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
