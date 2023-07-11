/* eslint-disable prefer-promise-reject-errors */
import React from 'react';
import { useIntl } from 'react-intl';
import {
  Form, Button, Input, Row, Col
} from 'antd';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  onFinish: Function;
  updating: boolean;
}

export const UpdatePaswordForm = ({ onFinish, updating = false }: IProps) => {
  const intl = useIntl();
  return (
    <Form name="nest-messages" className="account-form" onFinish={onFinish.bind(this)} {...layout}>
      <Row>
        <Col md={12} xs={24}>
          <Form.Item
            label={intl.formatMessage({ id: 'password', defaultMessage: 'Password' })}
            name="password"
            rules={[
              { required: true, message: `${intl.formatMessage({ id: 'pleaseInputYourPassword', defaultMessage: 'Please input your password!' })}` },
              {
                pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                message: `${intl.formatMessage({ id: 'passwordMustHaveMinimum8CharactersAtLeast1Number1uppercaseLetter1LowercaseLetter&1SpecialCharacter', defaultMessage: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character' })}`
              }
            ]}
          >
            <Input.Password placeholder={intl.formatMessage({ id: 'password', defaultMessage: 'Password' })} />
          </Form.Item>
        </Col>
        <Col md={12} xs={24}>
          <Form.Item
            label={intl.formatMessage({ id: 'confirmPassword', defaultMessage: 'Confirm Password' })}
            name="confirm"
            validateTrigger={['onChange', 'onBlur']}
            dependencies={['password']}
            hasFeedback
            rules={[
              {
                required: true,
                message: `${intl.formatMessage({ id: 'pleaseConfirmYourPassword', defaultMessage: 'Please confirm your password!' })}`
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(intl.formatMessage({ id: 'passwordsDoNotMatchTogether', defaultMessage: 'Passwords do not match together!' }));
                }
              })
            ]}
          >
            <Input.Password placeholder={intl.formatMessage({ id: 'confirmPassword', defaultMessage: 'Confirm Password' })} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button className="primary" htmlType="submit" loading={updating}>
          {intl.formatMessage({ id: 'savePassword', defaultMessage: 'Save Password' })}
        </Button>
      </Form.Item>
    </Form>
  );
};
