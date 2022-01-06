/* eslint-disable react/require-default-props */
import {
  Form, Input, Button, Select, Col, Row, Popover
} from 'antd';
import { AvatarUpload } from '@components/user/avatar-upload';
import { IUser } from 'src/interfaces';
import {
  TwitterOutlined, GoogleOutlined
} from '@ant-design/icons';

interface UserAccountFormIProps {
  user: IUser;
  updating: boolean;
  onFinish: Function;
  options?: {
    uploadHeader: any;
    avatarUrl: string;
    uploadAvatar: Function;
  };
  onVerifyEmail: Function;
  countTime: number;
  onSwitchToPerformer: Function;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export const UserAccountForm = ({
  updating,
  onFinish,
  user,
  options,
  onVerifyEmail,
  countTime = 60
}: UserAccountFormIProps) => (
  <Form
    className="account-form"
    {...layout}
    name="user-account-form"
    onFinish={(data) => onFinish(data)}
    scrollToFirstError
    initialValues={user}
  >
    <Row>
      <Col xs={24} sm={12}>
        <Form.Item
          hasFeedback
          name="firstName"
          label="First Name"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: 'Please input your first name!' },
            {
              pattern: new RegExp(
                /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
              ),
              message:
                'First name can not contain number and special character'
            }
          ]}
        >
          <Input placeholder="First Name" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          hasFeedback
          name="lastName"
          label="Last Name"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: 'Please input your last name!' },
            {
              pattern: new RegExp(
                /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
              ),
              message:
                'Last name can not contain number and special character'
            }
          ]}
        >
          <Input placeholder="Last Name" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="username"
          label="Username"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: 'Please input your username!' },
            {
              pattern: new RegExp(/^[a-z0-9]+$/g),
              message:
                'Username must contain lowercase alphanumerics only'
            },
            { min: 3, message: 'Username must containt at least 3 characters' }
          ]}
          hasFeedback
        >
          <Input placeholder="mirana, invoker123, etc..." />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="email"
          label={(
            <span style={{ fontSize: 10 }}>
              Email Address
              {'  '}
              {user.verifiedEmail ? (
                <Popover title="Your email address is verified" content={null}>
                  <a className="success-color">Verified!</a>
                </Popover>
              ) : (
                <Popover
                  title="Your email address is not verified"
                  content={(
                    <Button
                      type="primary"
                      onClick={() => onVerifyEmail()}
                      disabled={!user.email || updating || countTime < 60}
                      loading={updating || countTime < 60}
                    >
                      Click here to
                      {' '}
                      {countTime < 60 ? 'resend' : 'send'}
                      {' '}
                      the verification link
                      {' '}
                      {countTime < 60 && `${countTime}s`}
                    </Button>
                    )}
                >
                  <a className="error-color">Not verified!</a>
                </Popover>
              )}
            </span>
          )}
          rules={[{ type: 'email' }, { required: true, message: 'Please input your email address!' }]}
          hasFeedback
          validateTrigger={['onChange', 'onBlur']}
        >
          <Input disabled={user.verifiedEmail} placeholder="Email Address" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="name"
          label="Display Name"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: 'Please input your display name!' },
            {
              pattern: new RegExp(/^(?=.*\S).+$/g),
              message: 'Display name can not contain only whitespace'
            },
            {
              min: 3,
              message: 'Display name must containt at least 3 characters'
            }
          ]}
          hasFeedback
        >
          <Input placeholder="Display Name" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="gender"
          label="Gender"
          rules={[{ required: true, message: 'Please select gender!' }]}
        >
          <Select>
            <Select.Option value="male" key="male">
              Male
            </Select.Option>
            <Select.Option value="female" key="female">
              Female
            </Select.Option>
            <Select.Option value="transgender" key="transgender">
              Transgender
            </Select.Option>
          </Select>
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          label="New Password"
          name="password"
          hasFeedback
          rules={[
            {
              pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
              message: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
            }
          ]}
        >
          <Input.Password placeholder="New password" />
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          label="Confirm new password"
          name="confirm-password"
          dependencies={['password']}
          hasFeedback
          rules={[
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                // eslint-disable-next-line prefer-promise-reject-errors
                return Promise.reject('Passwords do not match together!');
              }
            })
          ]}
        >
          <Input.Password placeholder="Confirm new password" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="Avatar">
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <AvatarUpload
              image={user.avatar}
              uploadUrl={options.avatarUrl}
              headers={options.uploadHeader}
              onUploaded={options.uploadAvatar}
            />
          </div>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        {user.twitterConnected && (
          <Form.Item>
            <p>
              <TwitterOutlined style={{ color: '#1ea2f1', fontSize: '30px' }} />
              {' '}
              Signup/login via Twitter
            </p>
          </Form.Item>
        )}
        {user.googleConnected && (
          <Form.Item>
            <p>
              <GoogleOutlined style={{ color: '#d64b40', fontSize: '30px' }} />
              {' '}
              Signup/login via Google
            </p>
          </Form.Item>
        )}
      </Col>
    </Row>
    <Form.Item className="text-center">
      <Button htmlType="submit" className="primary" disabled={updating} loading={updating}>
        Update Profile
      </Button>
      {/* <Button style={{ margin: '0 5px' }} className="secondary" onClick={() => onSwitchToPerformer()}>Become a Model</Button> */}
    </Form.Item>
  </Form>
);
