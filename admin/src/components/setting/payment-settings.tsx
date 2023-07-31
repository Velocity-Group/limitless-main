/* eslint-disable no-template-curly-in-string */
import { useState } from 'react';
import {
  Form, Input, Button, message, Divider, Switch
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

export function PaymentSettingsForm({ settings }: IProps) {
  const [submiting, setSubmiting] = useState(false);
  const coinbaseEnable = settings.find((s) => s.key === 'coinbaseEnable');
  const stripeEnable = settings.find((s) => s.key === 'stripeEnable');
  const ccbillEnable = settings.find((s) => s.key === 'ccbillEnable');
  const [useCoinbase, setUseCoinbase] = useState(coinbaseEnable?.value);
  const [useStripe, setUseStripe] = useState(stripeEnable?.value);
  const [useCCBill, setUseCCBill] = useState(ccbillEnable?.value);

  const onSubmit = async (data) => {
    try {
      setSubmiting(true);
      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(data)) {
        // eslint-disable-next-line no-await-in-loop
        await settingService.update(key, data[key]);
      }
      message.success('Updated setting successfully');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err?.message || 'Error occurred, please try again later');
    } finally {
      setSubmiting(false);
    }
  };

  const ccbillClientAccountNumber = settings.find((s) => s.key === 'ccbillClientAccountNumber');
  const ccbillSingleSubAccountNumber = settings.find((s) => s.key === 'ccbillSingleSubAccountNumber');
  const ccbillRecurringSubAccountNumber = settings.find((s) => s.key === 'ccbillRecurringSubAccountNumber');
  const ccbillFlexformId = settings.find((s) => s.key === 'ccbillFlexformId');
  const ccbillSalt = settings.find((s) => s.key === 'ccbillSalt');
  const ccbillDatalinkUsername = settings.find((s) => s.key === 'ccbillDatalinkUsername');
  const ccbillDatalinkPassword = settings.find((s) => s.key === 'ccbillDatalinkPassword');
  const stripePublishableKey = settings.find((s) => s.key === 'stripePublishableKey');
  const stripeSecretKey = settings.find((s) => s.key === 'stripeSecretKey');
  const coinbaseApiKey = settings.find((s) => s.key === 'coinbaseApiKey');

  return (
    <Form
      {...layout}
      name="form-banking-performer"
      onFinish={(data) => onSubmit(data)}
      onFinishFailed={() => message.error('Please complete the required fields')}
      validateMessages={validateMessages}
      initialValues={{
        stripeEnable: stripeEnable?.value,
        stripePublishableKey: stripePublishableKey?.value,
        stripeSecretKey: stripeSecretKey?.value,
        ccbillClientAccountNumber: ccbillClientAccountNumber?.value,
        ccbillSingleSubAccountNumber: ccbillSingleSubAccountNumber?.value,
        ccbillRecurringSubAccountNumber: ccbillRecurringSubAccountNumber?.value,
        ccbillFlexformId: ccbillFlexformId?.value,
        ccbillSalt: ccbillSalt?.value,
        ccbillDatalinkUsername: ccbillDatalinkUsername?.value,
        ccbillDatalinkPassword: ccbillDatalinkPassword?.value,
        coinbaseEnable: coinbaseEnable?.value,
        coinbaseApiKey: coinbaseApiKey?.value,
        ccbillEnable: ccbillEnable?.value
      }}
    >
      <Divider>COINBASE</Divider>
      <Form.Item
        label="Enable Coinbase Payment"
        name="coinbaseEnable"
        extra="Turn on to enable Coinbase"
      >
        <Switch onChange={(v) => setUseCoinbase(v)} defaultChecked={coinbaseEnable?.value} />
      </Form.Item>
      {useCoinbase && (
        <Form.Item
          label="Coinbase - Api Key"
          name="coinbaseApiKey"
          rules={[{ required: true }]}
          extra="https://commerce.coinbase.com/settings/security"
        >
          <Input />
        </Form.Item>
      )}

      <Divider>STRIPE</Divider>
      <Form.Item
        label="Enable Stripe Payment"
        name="stripeEnable"
        extra="Turn on to enable Stripe"
      >
        <Switch onChange={(v) => setUseStripe(v)} defaultChecked={stripeEnable?.value} />
      </Form.Item>
      {useStripe && (
        <>
          {' '}
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
      <Divider>CCBILL</Divider>
      <Form.Item
        label="Enable CCBill Payment"
        name="ccbillEnable"
        extra="Turn on to enable CCBill"
      >
        <Switch onChange={(v) => setUseCCBill(v)} defaultChecked={ccbillEnable?.value} />
      </Form.Item>
      {useCCBill && (
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
