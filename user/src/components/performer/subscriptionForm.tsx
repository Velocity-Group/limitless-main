import { PureComponent } from 'react';
import {
  Form, InputNumber, Button, Row, Col, Switch
} from 'antd';
import { injectIntl, IntlShape } from 'react-intl';
import { IPerformer, ISettings } from 'src/interfaces';

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
  intl: IntlShape;
  settings: ISettings;
}

class PerformerSubscriptionForm extends PureComponent<IProps> {
  state = {
    isFreeSubscription: false
  }

  componentDidMount() {
    const { user } = this.props;
    this.setState({ isFreeSubscription: !!user?.isFreeSubscription });
  }

  render() {
    const {
      onFinish, user, updating, settings, intl
    } = this.props;
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
              <Switch unCheckedChildren={intl.formatMessage({ id: 'paidSubscription', defaultMessage: 'Paid Subscription' })} checkedChildren={intl.formatMessage({ id: 'unpaidSubscription', defaultMessage: 'Unpaid Subscription' })} onChange={(val) => this.setState({ isFreeSubscription: val })} />
            </Form.Item>
            {isFreeSubscription && (
              <Form.Item
                name="durationFreeSubscriptionDays"
                label={intl.formatMessage({ id: 'durationDays', defaultMessage: 'Duration (days)' })}
                help={intl.formatMessage({ id: 'tryFreeSubscriptionForxxDays', defaultMessage: 'Try free subscription for xx days' })}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} />
              </Form.Item>
            )}
            <Form.Item
              name="monthlyPrice"
              label={intl.formatMessage({ id: 'monthlySubscriptionPrice', defaultMessage: 'Monthly Subscription Price' })}
              rules={[{ required: true }]}
            >
              <InputNumber min={settings.paymentGateway === 'ccbill' ? 2.95 : 1} max={settings.paymentGateway === 'ccbill' ? 300 : 10000} />
            </Form.Item>
            <Form.Item
              name="yearlyPrice"
              label={intl.formatMessage({ id: 'yearlySubscriptionPrice', defaultMessage: 'Yearly Subscription Price ($)' })}
              rules={[{ required: true }]}
            >
              <InputNumber min={settings.paymentGateway === 'ccbill' ? 2.95 : 1} max={settings.paymentGateway === 'ccbill' ? 300 : 10000} />
            </Form.Item>
            <Form.Item
              key="publicChatPrice"
              name="publicChatPrice"
              label={intl.formatMessage({ id: 'defaultStreamingPrice', defaultMessage: 'Default Streaming Price' })}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={10000} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" type="primary" htmlType="submit" disabled={updating} loading={updating}>
            {intl.formatMessage({ id: 'saveChanges', defaultMessage: 'Save Changes' })}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default injectIntl(PerformerSubscriptionForm);
