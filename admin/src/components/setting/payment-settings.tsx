/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import {
  Form, Input, Button, Select, message, Divider
} from 'antd';
import { settingService } from 'src/services/setting.service';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  },
  number: {
    range: 'Must be between ${min} and ${max}'
  }
};

interface IProps {
  settings: any;
}

export class PaymentSettingsForm extends PureComponent<IProps> {
  state = {
    gateway: 'stripe',
    submiting: false
  }

  componentDidMount(): void {
    const {
      settings
    } = this.props;
    const paymentGateway = settings.find((s) => s.key === 'paymentGateway');
    this.setState({
      gateway: paymentGateway?.value || 'stripe'
    });
  }

  onSubmit = async (data) => {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(data)) {
        // eslint-disable-next-line no-await-in-loop
        await settingService.update(key, data[key]);
      }
      message.success('Updated setting successfully');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err?.message || 'Error occured, please try again later');
    }
  }

  render() {
    const {
      settings
    } = this.props;
    const { gateway, submiting } = this.state;
    const ccbillClientAccountNumber = settings.find((s) => s.key === 'ccbillClientAccountNumber');
    const ccbillSingleSubAccountNumber = settings.find((s) => s.key === 'ccbillSingleSubAccountNumber');
    const ccbillRecurringSubAccountNumber = settings.find((s) => s.key === 'ccbillRecurringSubAccountNumber');
    const ccbillFlexformId = settings.find((s) => s.key === 'ccbillFlexformId');
    const ccbillSalt = settings.find((s) => s.key === 'ccbillSalt');
    const ccbillDatalinkUsername = settings.find((s) => s.key === 'ccbillDatalinkUsername');
    const ccbillDatalinkPassword = settings.find((s) => s.key === 'ccbillDatalinkPassword');
    const stripePublishableKey = settings.find((s) => s.key === 'stripePublishableKey');
    const stripeSecretKey = settings.find((s) => s.key === 'stripeSecretKey');
    const paymentGateway = settings.find((s) => s.key === 'paymentGateway');

    return (
      <Form
        {...layout}
        name="form-banking-performer"
        onFinish={this.onSubmit.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        validateMessages={validateMessages}
        initialValues={{
          paymentGateway: paymentGateway?.value,
          stripePublishableKey: stripePublishableKey?.value,
          stripeSecretKey: stripeSecretKey?.value,
          ccbillClientAccountNumber: ccbillClientAccountNumber?.value,
          ccbillSingleSubAccountNumber: ccbillSingleSubAccountNumber?.value,
          ccbillRecurringSubAccountNumber: ccbillRecurringSubAccountNumber?.value,
          ccbillFlexformId: ccbillFlexformId?.value,
          ccbillSalt: ccbillSalt?.value,
          ccbillDatalinkUsername: ccbillDatalinkUsername?.value,
          ccbillDatalinkPassword: ccbillDatalinkPassword?.value
        }}
      >
        <Form.Item
          name="paymentGateway"
          label="Payment Gateway"
          extra="Select platform payment gateway"
          rules={[{ required: true }]}
        >
          <Select onChange={(val) => this.setState({ gateway: val })}>
            <Select.Option value="stripe" key="stripe">Stripe</Select.Option>
            <Select.Option value="ccbill" key="ccbill">CCbill</Select.Option>
          </Select>
        </Form.Item>
        <Divider>*</Divider>
        {gateway === 'stripe' && (
          <>
            <Form.Item
              label="Stripe - Public Key"
              name="stripePublishableKey"
              rules={[{ required: true }]}
              extra="https://dashboard.stripe.com/apikeys"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Stripe - Secret Key"
              name="stripeSecretKey"
              rules={[{ required: true }]}
              extra="https://dashboard.stripe.com/apikeys"
            >
              <Input />
            </Form.Item>
          </>
        )}

        {gateway === 'ccbill' && (
          <>
            <Form.Item
              label="Client account number"
              name="ccbillClientAccountNumber"
              rules={[{ required: true }]}
              extra="CCbill merchant account number (eg: 987654)"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Single Purchase Sub account number"
              name="ccbillSingleSubAccountNumber"
              rules={[{ required: true }]}
              extra="eg: 0001"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Recurring Purchase Sub account number"
              name="ccbillRecurringSubAccountNumber"
              rules={[{ required: true }]}
              extra="eg: 0002"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="CCbill - Flexform Id"
              name="ccbillFlexformId"
              rules={[{ required: true }]}
              extra=""
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="CCbill - Salt key"
              name="ccbillSalt"
              rules={[{ required: true }]}
              extra="Main account or sub account above salt key"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="CCbill - Datalink user"
              name="ccbillDatalinkUsername"
              rules={[{ required: true }]}
              extra="Log in to CCbill admin panel -> Account Info -> Data link services suite"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="CCbill - Datalink password"
              name="ccbillDatalinkPassword"
              rules={[{ required: true }]}
              extra="https://admin.ccbill.com/megamenus/ccbillHome.html#AccountInfo/DataLinkServicesSuite(234)"
            >
              <Input />
            </Form.Item>
          </>
        )}

        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
