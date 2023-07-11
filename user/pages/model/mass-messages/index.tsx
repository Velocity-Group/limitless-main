import PageHeading from '@components/common/page-heading';
import { IUIConfig } from '@interfaces/ui-config';
import {
  Button, Form, Input, Layout, Select, message
} from 'antd';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { CommentOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { messageService } from '@services/message.service';
import { IntlShape, useIntl } from 'react-intl';

function MassMessagePage() {
  const [submitting, setSubmitting] = useState(false);
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const intl: IntlShape = useIntl();

  const send = async (data) => {
    try {
      setSubmitting(true);
      await messageService.sendMassMessages(data);
      message.success(intl.formatMessage({ id: 'sendMassMessageSuccessfully', defaultMessage: 'Send mass message successfully!' }));
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Layout>
      <Head>
        <title>
          {' '}
          {ui && ui.siteName}
          {' '}
          |
          {' '}
          {intl.formatMessage({ id: 'sendMassMessages', defaultMessage: 'Send Mass Messages' })}
        </title>
      </Head>
      <div className="main-container">
        <PageHeading title={intl.formatMessage({ id: 'sendMassMessages', defaultMessage: 'Send Mass Messages' })} icon={<CommentOutlined />} />
        <Form
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          onFinish={(data) => send(data)}
          initialValues={{ subscriptionType: 'paid' }}
        >
          <Form.Item
            name="text"
            rules={[{ required: true, message: intl.formatMessage({ id: 'pleaseInputMessageContent', defaultMessage: 'Please input message content!' }) }]}
            label={intl.formatMessage({ id: 'messageContent', defaultMessage: 'Message content' })}
          >
            <Input.TextArea rows={3} placeholder={intl.formatMessage({ id: 'enterContentHere', defaultMessage: 'Enter content here' })} />
          </Form.Item>
          <Form.Item
            name="subscriptionType"
            label={intl.formatMessage({ id: 'recipients', defaultMessage: 'Recipients' })}
          >
            <Select>
              <Select.Option value="paid">{intl.formatMessage({ id: 'paidSubscription', defaultMessage: 'Paid subscription' })}</Select.Option>
              <Select.Option value="free">{intl.formatMessage({ id: 'freeSubscription', defaultMessage: 'Free subscription' })}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              className="primary"
              htmlType="submit"
              loading={submitting}
              disabled={submitting}
            >
              {intl.formatMessage({ id: 'send', defaultMessage: 'Send' })}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Layout>
  );
}

export default MassMessagePage;
