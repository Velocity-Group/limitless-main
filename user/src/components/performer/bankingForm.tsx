/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import {
  Form, Input, Button, Row, Col, Select
} from 'antd';
import { IPerformer, ICountry } from 'src/interfaces';

const { Option } = Select;
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
  onFinish: Function;
  user: IPerformer;
  updating?: boolean;
  countries?: ICountry[];
}

export class PerformerBankingForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, user, updating, countries
    } = this.props;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish.bind(this)}
        validateMessages={validateMessages}
        initialValues={user.bankingInformation}
        labelAlign="left"
        className="account-form"
      >
        <Row>
          <Col xl={12} md={12} xs={24}>
            <Form.Item
              label="First name"
              name="firstName"
              rules={[
                { required: true, message: 'Please input your first name!' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item
              name="lastName"
              label="Last name"
              rules={[
                { required: true, message: 'Please input your last name!' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item
              name="bankName"
              label="Bank name"
              rules={[
                { required: true, message: 'Please input your bank name!' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item
              name="bankAccount"
              label="Bank Account"
              rules={[
                { required: true, message: 'Please input your bank account!' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true, message: 'Please choose country!' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
              >
                {countries
                  && countries.length > 0
                  && countries.map((c) => (
                    <Option value={c.code} label={c.name} key={c.code}>
                      <img alt="country_flag" src={c.flag} width="25px" />
                      {' '}
                      {c.name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item name="bankRouting" label="Bank Routing">
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item name="bankSwiftCode" label="Bank swift code">
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item name="SSN" label="SSN">
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item name="state" label="State (County)">
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item
              name="city"
              label="City"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={24}>
            <Form.Item name="address" label="Address">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button
            className="primary"
            type="primary"
            htmlType="submit"
            loading={updating}
            disabled={updating}
          >
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
