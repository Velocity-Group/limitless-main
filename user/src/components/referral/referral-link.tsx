import {
  Button, Form, Input, message
} from 'antd';
import './referral-link.less';

interface IProps {
  linkReferral: string;
  referralCode: string;
  loading: boolean;
}

function ReferralLink({
  linkReferral, referralCode, loading
}: IProps) {
  const copyLink = async () => {
    await navigator.clipboard.writeText(linkReferral);
    message.success('Copied!');
  };
  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    message.success('Copied!');
  };
  return (
    <Form className="referral-link">
      <Form.Item>
        <div className="referral-code">
          <Input value={linkReferral} />
          <Button className="primary" disabled={loading || !linkReferral} onClick={() => copyLink()}>COPY LINK</Button>
        </div>
      </Form.Item>
      <Form.Item>
        <div className="referral-code">
          <Input value={referralCode} />
          <Button className="primary" disabled={loading || !referralCode} onClick={() => copyCode()}>COPY CODE</Button>
        </div>
      </Form.Item>
    </Form>
  );
}

export default ReferralLink;
