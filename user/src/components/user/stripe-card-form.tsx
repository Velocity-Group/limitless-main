import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  message
} from 'antd';

interface IProps {
  submit: Function;
  submiting: boolean;
}

function CardForm({ submit, submiting }: IProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
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
  };

  return (
    <form onSubmit={handleSubmit}>
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

export default CardForm;
