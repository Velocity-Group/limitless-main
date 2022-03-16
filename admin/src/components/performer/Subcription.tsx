import { PureComponent } from 'react';
import {
  Form, Button, message, InputNumber, Switch, Row, Col
} from 'antd';
import { IPerformer } from 'src/interfaces';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

interface IProps {
  onFinish: Function;
  performer: IPerformer;
  submiting?: boolean;
}

export class SubscriptionForm extends PureComponent<IProps> {
  state = {
    isFreeSubscription: false
  }

  componentDidMount() {
    const { performer } = this.props;
    this.setState({ isFreeSubscription: performer.isFreeSubscription });
  }

  render() {
    const { performer, onFinish, submiting } = this.props;
    const { isFreeSubscription } = this.state;
    return (
      <Form
        {...layout}
        name="form-performer"
        onFinish={onFinish.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields in tab general info')}
        validateMessages={validateMessages}
        initialValues={
          performer || ({
            isFreeSubscription: false,
            yearlyPrice: 99.99,
            monthlyPrice: 9.99,
            publicChatPrice: 1,
            groupChatPrice: 1,
            privateChatPrice: 1,
            maxParticipantsAllowed: 16
          })
        }
      >
        <Row>
          <Col xs={24} md={12}>
            <Form.Item>
              <Switch unCheckedChildren="Unpaid Subscription" checkedChildren="Paid Subscription" checked={isFreeSubscription} onChange={() => this.setState({ isFreeSubscription: !isFreeSubscription })} />
            </Form.Item>
            {isFreeSubscription && (
            <Form.Item
              name="durationFreeSubscriptionDays"
              label="Duration (days)"
              help="Free subscription for xx days, then $xx per month"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            )}
            <Form.Item
              key="yearly"
              name="yearlyPrice"
              label="Yearly Subscription Price ($)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              key="monthly"
              name="monthlyPrice"
              label="Monthly Subscription Price ($)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              key="publicChatPrice"
              name="publicChatPrice"
              label="Default Streaming Price (token)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            {/* <Form.Item
              key="groupChatPrice"
              name="groupChatPrice"
              label="Token per minute Group Chat"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              key="privateChatPrice"
              name="privateChatPrice"
              label="Token per minute Private Chat"
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
            </Form.Item> */}
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
