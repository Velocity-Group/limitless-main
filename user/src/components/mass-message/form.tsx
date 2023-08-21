import { IMassMessage } from '@interfaces/message';
import {
  Button, DatePicker, Form, Input, Select, Switch
} from 'antd';
import { useEffect, useState } from 'react';
import { IntlShape, useIntl } from 'react-intl';
import moment from 'moment';
import { useRouter } from 'next/router';

interface IProps {
  // eslint-disable-next-line react/require-default-props
  form?: any;
  // eslint-disable-next-line react/require-default-props
  massMessage?: IMassMessage
  submitting: boolean;
  onFinish: Function;
}

export function MassMessageForm({
  massMessage, submitting, onFinish, form
}: IProps) {
  const [isSchedule, setIsSchedule] = useState(false);
  const route = useRouter();
  const intl: IntlShape = useIntl();

  useEffect(() => {
    if (massMessage) {
      setIsSchedule(true);
    }
  }, []);

  return (
    <Form
      form={form}
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      onFinish={(data) => onFinish(data)}
      initialValues={massMessage ? {
        ...massMessage,
        scheduledAt: (massMessage?.scheduledAt && moment(massMessage?.scheduledAt)) || ''
      } : { subscriptionType: 'paid' }}
    >
      <Form.Item
        name="text"
        rules={[{ required: true, message: intl.formatMessage({ id: 'pleaseInputMessageContent', defaultMessage: 'Please input message content!' }) }]}
        label={intl.formatMessage({ id: 'messageContent', defaultMessage: 'Message content' })}
      >
        <Input.TextArea rows={3} placeholder={intl.formatMessage({ id: 'enterContentHere', defaultMessage: 'Enter content here' })} />
      </Form.Item>
      {!isSchedule && !massMessage && (
      <Form.Item
        name="subscriptionType"
        label={intl.formatMessage({ id: 'recipients', defaultMessage: 'Recipients' })}
      >
        <Select>
          <Select.Option value="paid">{intl.formatMessage({ id: 'paidSubscription', defaultMessage: 'Paid subscription' })}</Select.Option>
          <Select.Option value="free">{intl.formatMessage({ id: 'freeSubscription', defaultMessage: 'Free subscription' })}</Select.Option>
        </Select>
      </Form.Item>
      )}
      {!massMessage && (
      <Form.Item name="isSchedule" label={`${intl.formatMessage({ id: 'scheduled', defaultMessage: 'Schedule' })}?`} valuePropName="checked">
        <Switch
          unCheckedChildren={intl.formatMessage({ id: 'notScheduled', defaultMessage: 'Not scheduled' })}
          checkedChildren={intl.formatMessage({ id: 'scheduled', defaultMessage: 'Scheduled' })}
          onChange={(val) => setIsSchedule(val)}
        />
      </Form.Item>
      )}
      {isSchedule && (
      <Form.Item
        name="scheduledAt"
        validateTrigger={['onChange', 'onBlur']}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'chooseTheDateToSendMassMessage',
              defaultMessage: 'Choose the date to send mass message'
            })
          }
        ]}
      >
        <DatePicker
          placeholder={intl.formatMessage({
            id: 'messageSentDate',
            defaultMessage: 'Message sent date'
          })}
          disabledDate={(currentDate) => currentDate && currentDate.isBefore(new Date())}
          showTime={{ format: 'HH:mm a' }}
          format="YYYY-MM-DD HH:mm a"
        />
      </Form.Item>
      )}
      <Form.Item>
        <Button
          className="primary"
          htmlType="submit"
          loading={submitting}
          disabled={submitting}
        >
          {massMessage ? intl.formatMessage({ id: 'update', defaultMessage: 'Update' }) : intl.formatMessage({ id: 'send', defaultMessage: 'Send' })}
        </Button>
        {massMessage && (
        <Button
          className="secondary"
          loading={submitting}
          disabled={submitting}
          onClick={() => route.back()}
        >
          {intl.formatMessage({ id: 'back', defaultMessage: 'Back' })}
        </Button>
        )}
      </Form.Item>
    </Form>
  );
}
