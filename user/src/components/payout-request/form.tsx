import {
  Form,
  Button,
  Input,
  Space,
  Statistic,
  Tag,
  InputNumber,
  Alert,
  Select
} from 'antd';
import { PayoutRequestInterface, ISettings } from 'src/interfaces';
import Router from 'next/router';
import { useIntl } from 'react-intl';

interface Props {
  submit: Function;
  submiting: boolean;
  payout: Partial<PayoutRequestInterface>;
  statsPayout: {
    totalEarnedTokens: number;
    previousPaidOutTokens: number;
    remainingUnpaidTokens: number;
  };
  settings: ISettings;
}

const PayoutRequestForm = ({
  payout, submit, submiting, statsPayout, settings
}: Props) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const {
    requestNote, requestTokens, status, paymentAccountType
  } = payout;

  return (
    <Form
      form={form}
      layout="vertical"
      className="payout-request-form"
      name="payoutRequestForm"
      onFinish={(data) => submit(data)}
      initialValues={{
        requestNote: requestNote || '',
        requestTokens: requestTokens || statsPayout?.remainingUnpaidTokens || 0,
        paymentAccountType: paymentAccountType || 'banking'
      }}
      scrollToFirstError
    >
      <div>
        <Space size="large">
          <Statistic
            title={intl.formatMessage({ id: 'totalEarned', defaultMessage: 'Total Earned' })}
            value={statsPayout?.totalEarnedTokens || 0}
            precision={2}
            prefix="$"
          />
          <Statistic
            title={intl.formatMessage({ id: 'withdrew', defaultMessage: 'Withdrew' })}
            value={statsPayout?.previousPaidOutTokens || 0}
            precision={2}
            prefix="$"
          />
          <Statistic
            title={intl.formatMessage({ id: 'walletBalance', defaultMessage: 'Wallet Balance' })}
            value={statsPayout?.remainingUnpaidTokens || 0}
            precision={2}
            prefix="$"
          />
        </Space>
      </div>
      <Form.Item label={intl.formatMessage({ id: 'requestedAmount', defaultMessage: 'Requested amount' })} name="requestTokens">
        <InputNumber
          style={{ width: '100%' }}
          disabled={payout && payout.status === 'done'}
          min={1}
          max={statsPayout?.remainingUnpaidTokens}
        />
      </Form.Item>
      <Form.Item label={intl.formatMessage({ id: 'noteToAdmin', defaultMessage: 'Note to Admin' })} name="requestNote">
        <Input.TextArea disabled={payout && payout.status === 'done'} placeholder={intl.formatMessage({ id: 'textSomethingToAdminHere', defaultMessage: 'Text something to admin here' })} rows={3} />
      </Form.Item>
      {payout?.adminNote && (
      <Form.Item label={intl.formatMessage({ id: 'adminNoted', defaultMessage: 'Admin noted' })}>
        <Alert type="info" message={payout?.adminNote} />
      </Form.Item>
      )}
      {payout._id && (
      <Form.Item label={intl.formatMessage({ id: 'status', defaultMessage: 'Status' })}>
        <Tag color="orange" style={{ textTransform: 'capitalize' }}>{status}</Tag>
      </Form.Item>
      )}
      <Form.Item label={intl.formatMessage({ id: 'selectPayoutMethod', defaultMessage: 'Select payout method' })} name="paymentAccountType">
        <Select>
          {/* {settings?.paymentGateway === 'stripe' && (
            <Select.Option value="stripe" key="stripe">
              <img src="/static/stripe-icon.jpeg" width="30px" alt="stripe" />
              {' '}
              Stripe
            </Select.Option>
          )} */}
          <Select.Option value="banking" key="banking">
            <img src="/static/banking-ico.png" width="30px" alt="banking" />
            {' '}
            {intl.formatMessage({ id: 'banking', defaultMessage: 'Banking' })}
          </Select.Option>
          <Select.Option value="paypal" key="paypal">
            <img src="/static/paypal-ico.png" width="30px" alt="paypal" />
            {' '}
            {intl.formatMessage({ id: 'paypal', defaultMessage: 'Paypal' })}
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button
          className="primary"
          loading={submiting}
          htmlType="submit"
          disabled={['done', 'approved'].includes(status) || submiting}
          style={{ margin: '0 5px' }}
        >
          {intl.formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
        </Button>
        <Button
          className="secondary"
          loading={submiting}
          htmlType="button"
          disabled={submiting}
          style={{ margin: '0 5px' }}
          onClick={() => Router.back()}
        >
          {intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
        </Button>
      </Form.Item>
    </Form>
  );
};

PayoutRequestForm.defaultProps = {};

export default PayoutRequestForm;
