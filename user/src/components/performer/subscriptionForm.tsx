import { PureComponent } from 'react';
import {
  Form, InputNumber, Button, Row, Col, Switch
} from 'antd';
import { IPerformer } from 'src/interfaces';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  }
};

interface IProps {
  onFinish: Function;
  user: IPerformer;
  updating?: boolean;
}

export class PerformerSubscriptionForm extends PureComponent<IProps> {
  state = {
    isFreeSubscription: false
  }

  componentDidMount() {
    const { user } = this.props;
    this.setState({ isFreeSubscription: !!user?.isFreeSubscription });
  }

  render() {
    const { onFinish, user, updating } = this.props;
    const { isFreeSubscription } = this.state;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={(values) => {
          onFinish(values);
        }}
        validateMessages={validateMessages}
        initialValues={user}
        labelAlign="left"
        className="account-form"
        scrollToFirstError
      >
        <Row>
          <Col xl={12} md={12} xs={24}>
            <Form.Item name="isFreeSubscription" valuePropName="checked">
              <Switch unCheckedChildren="Paid Subscription" checkedChildren="Unpaid Subcription" onChange={(val) => this.setState({ isFreeSubscription: val })} />
            </Form.Item>
            {isFreeSubscription && (
            <Form.Item
              name="durationFreeSubscriptionDays"
              label="Duration (days)"
              help="Try free subscription for xx days"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            )}
            <Form.Item
              name="monthlyPrice"
              label="Monthly Subscription Price"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="yearlyPrice"
              label="Yearly Subscription Price"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              key="publicChatPrice"
              name="publicChatPrice"
              label="Default Streaming Price"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </Col>
          {/* <Col xl={12} md={12} xs={24}>
            <Form.Item
              name="privateChatPrice"
              label="Tokens per minute Private Chat"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="groupChatPrice"
              label="Tokens per minute Group Chat"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              key="maxParticipantsAllowed"
              name="maxParticipantsAllowed"
              label="Maximum Participants on Group Chat"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </Col> */}
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" type="primary" htmlType="submit" disabled={updating} loading={updating}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
