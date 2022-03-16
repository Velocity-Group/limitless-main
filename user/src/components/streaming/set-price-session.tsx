import { useState } from 'react';
import {
  Switch, Button, Form, Input, InputNumber
} from 'antd';
import { IPerformer } from 'src/interfaces';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

const StreamPriceForm = ({
  onFinish, submiting, performer
}: IProps) => {
  const [isFree, setFree] = useState(true);
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
        label="Title"
        rules={[{ required: true, message: 'Please enter stream title!' }]}
      >
        <Input min={10} maxLength={100} />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter stream description!' }]}
      >
        <Input.TextArea rows={2} maxLength={200} />
      </Form.Item>
      <Form.Item
        name="isFree"
        label="Select an option"
        valuePropName="checked"
      >
        <Switch unCheckedChildren="Pay Per Live for Subscribers" checkedChildren=" Free for Subscribers" checked={isFree} onChange={(val) => setFree(val)} />
      </Form.Item>
      {!isFree && (
      <Form.Item
        name="price"
        label="Amount of Tokens"
      >
        <InputNumber min={1} />
      </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submiting} disabled={submiting}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default StreamPriceForm;
