import { useState } from 'react';
import {
  Switch, Button, Form, Input, InputNumber
} from 'antd';
import { IPerformer } from 'src/interfaces';
import { useIntl } from 'react-intl';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

const StreamPriceForm = ({ onFinish, submiting, performer }: IProps) => {
  const [isFree, setFree] = useState(true);
  const intl = useIntl();
  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={onFinish.bind(this)}
      initialValues={{
        title: '',
        description: '',
        isFree: true,
        price: performer.publicChatPrice
      }}
      className="account-form"
    >
      <Form.Item
        name="title"
        label={intl.formatMessage({ id: 'title', defaultMessage: 'Title' })}
        rules={[
          {
            required: true,
            message: `${intl.formatMessage({
              id: 'pleaseEnterStreamTitle',
              defaultMessage: 'Please enter stream title!'
            })}`
          }
        ]}
      >
        <Input min={10} maxLength={100} />
      </Form.Item>
      <Form.Item
        name="description"
        label={intl.formatMessage({
          id: 'description',
          defaultMessage: 'Description'
        })}
        rules={[
          {
            required: true,
            message: `${intl.formatMessage({
              id: 'pleaseEnterStreamDescription',
              defaultMessage: 'Please enter stream description!'
            })}`
          }
        ]}
      >
        <Input.TextArea rows={2} maxLength={200} />
      </Form.Item>
      <Form.Item
        name="isFree"
        label={intl.formatMessage({
          id: 'selectAnOption',
          defaultMessage: 'Select an option'
        })}
        valuePropName="checked"
      >
        <Switch
          unCheckedChildren={intl.formatMessage({
            id: 'payPerLiveForSubscribers',
            defaultMessage: 'Pay Per Live for Subscribers'
          })}
          checkedChildren={intl.formatMessage({
            id: 'freeForSubscribers',
            defaultMessage: 'Free for Subscribers'
          })}
          checked={isFree}
          onChange={(val) => setFree(val)}
        />
      </Form.Item>
      {!isFree && (
      <Form.Item
        name="price"
        label={intl.formatMessage({
          id: 'price',
          defaultMessage: 'Price'
        })}
      >
        <InputNumber min={1} />
      </Form.Item>
      )}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={submiting}
          disabled={submiting}
        >
          {intl.formatMessage({
            id: 'submit',
            defaultMessage: 'Submit'
          })}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default StreamPriceForm;
