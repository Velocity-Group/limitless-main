import './index.less';

interface IProps {
  redirectUrl: string;
}

const PaymentIframeForm = ({ redirectUrl } : IProps) => (
  <div className="payment-iframe-form">
    <iframe title="Payment check out" src={redirectUrl} />
  </div>
);

export default PaymentIframeForm;
