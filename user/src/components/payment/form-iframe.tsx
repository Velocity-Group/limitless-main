import { useIntl } from 'react-intl';
import './index.less';

interface IProps {
  redirectUrl: string;
}

const PaymentIframeForm = ({ redirectUrl } : IProps) => {
  const intl = useIntl();

  return (
    <div className="payment-iframe-form">
      <iframe title={intl.formatMessage({ id: 'paymentCheckOut', defaultMessage: 'Payment check out' })} src={redirectUrl} />
    </div>
  );
};

export default PaymentIframeForm;
