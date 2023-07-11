/* eslint-disable react/require-default-props */
import {
  Form, Input, Button, Select, Col, Row, Popover
} from 'antd';
import AvatarUpload from '@components/user/avatar-upload';
import { IUser } from 'src/interfaces';
import {
  TwitterOutlined, GoogleOutlined
} from '@ant-design/icons';
import { useIntl } from 'react-intl';

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
}: UserAccountFormIProps) => {
  const intl = useIntl();
  return (
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
            label={intl.formatMessage({ id: 'firstName', defaultMessage: 'First name' })}
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'inputFirstName',
                  defaultMessage: 'Please input first name!'
                })
              },
              {
                pattern: new RegExp(
                  /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
                ),
                message:
                  intl.formatMessage({
                    id: 'firstNameCanNotContain',
                    defaultMessage: 'First name can not contain number and special character'
                  })
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'firstName', defaultMessage: 'First name' })} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            hasFeedback
            name="lastName"
            label={intl.formatMessage({ id: 'lastName', defaultMessage: 'Last name' })}
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'inputLastName',
                  defaultMessage: 'Please input your last name!'
                })
              },
              {
                pattern: new RegExp(
                  /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
                ),
                message:
                  intl.formatMessage({
                    id: 'lastNameCanNotContain',
                    defaultMessage: 'Last name can not contain number and special character'
                  })
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'lastName', defaultMessage: 'Last name' })} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="username"
            label={intl.formatMessage({ id: 'username', defaultMessage: 'Username' })}
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pleaseInputUsername',
                  defaultMessage: 'Please input your username!'
                })
              },
              {
                pattern: new RegExp(/^[a-z0-9]+$/g),
                message:
                  intl.formatMessage({
                    id: 'usernameMustContainLowercaseAlphanumericsOnly',
                    defaultMessage: 'Username must contain lowercase alphanumerics only'
                  })
              },
              {
                min: 3,
                message: intl.formatMessage({
                  id: 'usernameContainAtLeastThreeCharacters',
                  defaultMessage: 'Username must contain at least 3 characters'
                })
              }
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
                {intl.formatMessage({ id: 'emailAddress', defaultMessage: 'Email address' })}
                {'  '}
                {user.verifiedEmail ? (
                  <Popover
                    title={intl.formatMessage({
                      id: 'yourEmailAddressIsVerified',
                      defaultMessage: 'Your email address is verified'
                    })}
                    content={null}
                  >
                    <a className="success-color">
                      {intl.formatMessage({
                        id: 'verified',
                        defaultMessage: 'Verified!'
                      })}
                    </a>
                  </Popover>
                ) : (
                  <Popover
                    title={intl.formatMessage({
                      id: 'yourEmailAddressIsNotVerified',
                      defaultMessage: 'Your email address is not verified'
                    })}
                    content={(
                      <Button
                        type="primary"
                        onClick={() => onVerifyEmail()}
                        disabled={!user.email || updating || countTime < 60}
                        loading={updating || countTime < 60}
                      >
                        {intl.formatMessage({ id: 'clickHereTo', defaultMessage: 'Click here to' })}
                        {' '}
                        {countTime < 60 ? intl.formatMessage({ id: 'resend', defaultMessage: 'Resend' }) : intl.formatMessage({ id: 'send', defaultMessage: 'Send' })}
                        {' '}
                        {intl.formatMessage({ id: 'theVerificationLink', defaultMessage: 'the verification link' })}
                        {' '}
                        {countTime < 60 && `${countTime}s`}
                      </Button>
                    )}
                  >
                    <a className="error-color">{intl.formatMessage({ id: 'notVerified', defaultMessage: 'Not verified!' })}</a>
                  </Popover>
                )}
              </span>
            )}
            rules={[{ type: 'email' }, {
              required: true,
              message: intl.formatMessage({
                id: 'inputEmailAddress',
                defaultMessage: 'Please input your email address!'
              })
            }]}
            hasFeedback
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input disabled={user.verifiedEmail} placeholder={intl.formatMessage({ id: 'emailAddress', defaultMessage: 'Email address' })} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'displayName', defaultMessage: 'Display name' })}
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'inputDisplayName',
                  defaultMessage: 'Please input your display name!'
                })
              },
              {
                pattern: new RegExp(/^(?=.*\S).+$/g),
                message: intl.formatMessage({
                  id: 'displayNameCannotContain',
                  defaultMessage: 'Display name can not contain only whitespace'
                })
              },
              {
                min: 3,
                message: intl.formatMessage({
                  id: 'displayNameContainAtLeastThreeCharacters',
                  defaultMessage: 'Display name must contain at least 3 characters'
                })
              }
            ]}
            hasFeedback
          >
            <Input placeholder={intl.formatMessage({ id: 'displayName', defaultMessage: 'Display name' })} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="gender"
            label={intl.formatMessage({ id: 'gender', defaultMessage: 'Gender' })}
            rules={[{
              required: true,
              message: intl.formatMessage({
                id: 'pleaseSelectYourGender',
                defaultMessage: 'Please select your gender!'
              })
            }]}
          >
            <Select>
              <Select.Option value="male" key="male">
                {intl.formatMessage({ id: 'male', defaultMessage: 'Male' })}
              </Select.Option>
              <Select.Option value="female" key="female">
                {intl.formatMessage({ id: 'female', defaultMessage: 'Female' })}
              </Select.Option>
              <Select.Option value="transgender" key="transgender">
                {intl.formatMessage({ id: 'transgender', defaultMessage: 'Transgender' })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col md={12} xs={24}>
          <Form.Item
            label={intl.formatMessage({
              id: 'newPassword',
              defaultMessage: 'New Password'
            })}
            name="password"
            hasFeedback
            rules={[
              {
                pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                message: intl.formatMessage({
                  id: 'passwordPattern',
                  defaultMessage: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                })
              }
            ]}
          >
            <Input.Password placeholder={intl.formatMessage({
              id: 'newPassword',
              defaultMessage: 'New Password'
            })}
            />
          </Form.Item>
        </Col>
        <Col md={12} xs={24}>
          <Form.Item
            label={intl.formatMessage({
              id: 'confirmNewPassword',
              defaultMessage: 'Confirm new Password'
            })}
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
                  return Promise.reject(intl.formatMessage({
                    id: 'passwordsDoNotMatchTogether',
                    defaultMessage: 'Passwords do not match together!'
                  }));
                }
              })
            ]}
          >
            <Input.Password placeholder={intl.formatMessage({
              id: 'confirmNewPassword',
              defaultMessage: 'Confirm new Password'
            })}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label={intl.formatMessage({ id: 'avatar', defaultMessage: 'Avatar' })}>
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
                {intl.formatMessage({ id: 'signUpLoginViaTwitter', defaultMessage: 'Sign up/login via Twitter' })}
              </p>
            </Form.Item>
          )}
          {user.googleConnected && (
            <Form.Item>
              <p>
                <GoogleOutlined style={{ color: '#d64b40', fontSize: '30px' }} />
                {' '}
                {intl.formatMessage({ id: 'signUpLoginViaGoogle', defaultMessage: 'Sign up/login via Google' })}
              </p>
            </Form.Item>
          )}
        </Col>
      </Row>
      <Form.Item className="text-center">
        <Button htmlType="submit" className="primary" disabled={updating} loading={updating}>
          {intl.formatMessage({ id: 'saveChanges', defaultMessage: 'Save Changes' })}
        </Button>
        {/* <Button style={{ margin: '0 5px' }} className="secondary" onClick={() => onSwitchToPerformer()}>Become a Model</Button> */}
      </Form.Item>
    </Form>
  );
};
