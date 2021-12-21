import { PureComponent } from 'react';
import {
  Form, Button, Input, Row, Col
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

export class PerformerPaypalForm extends PureComponent<IProps> {
  render() {
    const { onFinish, user, updating } = this.props;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish.bind(this)}
        validateMessages={validateMessages}
        initialValues={user?.paypalSetting?.value || {
          email: '',
          phoneNumber: ''
        }}
        labelAlign="left"
        className="account-form"
      >
        <Row>
          <Col lg={12} xs={24}>
            <Form.Item
              name="email"
              label="Paypal business account email"
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ required: true }, { type: 'email' }]}
              help="You will need  a paypal business account to use this feature"
            >
              <Input />
            </Form.Item>
          </Col>
          {/* <Col lg={12} xs={24}>
            <Form.Item
              name="phoneNumber"
              label="Paypal Phone Number"
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ required: true },
                {
                  pattern: new RegExp(/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/u),
                  message: 'Please enter valid phone number format eg +86 800 555 1234'
                }]}
            >
              <Input />
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
