/* eslint-disable react/require-default-props */
/* eslint-disable no-template-curly-in-string */
import {
  Form, Input, Button, Select, Switch, Row, Col
} from 'antd';
import { IUser } from 'src/interfaces';
import { AvatarUpload } from '@components/user/avatar-upload';
import { getGlobalConfig } from '@services/config';
import { ROLE_ADMIN, ROLE_SUB_ADMIN } from 'src/constants';
import { useSelector } from 'react-redux';

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
  user?: IUser;
  updating?: boolean;
  options?: {
    uploadHeaders?: any;
    avatarUploadUrl?: string;
    onAvatarUploaded?: Function;
    beforeUpload?: Function;
    avatarUrl?: string
  };
}

export function SubAdminForm({
  onFinish, user, updating, options
}: IProps) {
  const {
    uploadHeaders, avatarUploadUrl, beforeUpload, onAvatarUploaded
  } = options;
  const currentUser: IUser = useSelector((state: any) => state.user.current);
  const config = getGlobalConfig();
  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={onFinish.bind(this)}
      validateMessages={validateMessages}
      initialValues={
          user || {
            status: 'active',
            roles: [ROLE_SUB_ADMIN]
          }
        }
    >
      <Row>
        <Col xs={12} md={12}>
          <Form.Item
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
        <Col xs={12} md={12}>
          <Form.Item
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
        <Col xs={12} md={12}>
          <Form.Item
            name="username"
            label="Username"
            validateTrigger={['onChange', 'onBlur']}
            rules={[{ required: true }, {
              pattern: new RegExp(/^[a-zA-Z0-9]+$/g),
              message: 'Username must contain lowercase alphanumerics only'
            }, { min: 3 }]}
          >
            <Input placeholder="Unique, lowercase alphanumerics only" />
          </Form.Item>
        </Col>
        <Col xs={12} md={12}>
          <Form.Item
            name="name"
            label="Display name"
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              { required: true, message: 'Please input your display name!' },
              {
                pattern: new RegExp(/^(?=.*\S).+$/g),
                message:
                    'Display name can not contain only whitespace'
              },
              {
                min: 3,
                message: 'Display name must containt at least 3 characters'
              }
            ]}
            hasFeedback
          >
            <Input placeholder="Display name" />
          </Form.Item>
        </Col>
        <Col xs={12} md={12}>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={12} md={12}>
          <Form.Item name="pathsAllow" label="Paths Allow" rules={[{ required: true }]}>
            <Select mode="multiple" disabled={currentUser?.roles && !currentUser.roles.includes(ROLE_ADMIN)}>
              <Select.Option key="block-countries" value="/block-countries">
                Block Countries
              </Select.Option>
              <Select.Option key="email-templates" value="/email-templates">
                Email Templates
              </Select.Option>
              <Select.Option key="posts" value="/posts">
                Posts
              </Select.Option>
              <Select.Option key="menu" value="/menu">
                Exiting Menu Options
              </Select.Option>
              <Select.Option key="coupon" value="/coupon">
                Coupons
              </Select.Option>
              <Select.Option key="banners" value="/banners">
                Banners
              </Select.Option>
              <Select.Option key="users" value="/users">
                Users
              </Select.Option>
              <Select.Option key="model" value="/model">
                Models
              </Select.Option>
              <Select.Option key="feed" value="/feed">
                Feed Posts
              </Select.Option>
              <Select.Option key="video" value="/video">
                Videos
              </Select.Option>
              <Select.Option key="gallery" value="/gallery">
                Galleries
              </Select.Option>
              <Select.Option key="product" value="/product">
                Products
              </Select.Option>
              <Select.Option key="report" value="/report">
                Reports
              </Select.Option>
              <Select.Option key="order" value="/order">
                Order History
              </Select.Option>
              <Select.Option key="earnings" value="/earnings">
                Earning History
              </Select.Option>
              <Select.Option key="subscription" value="/subscription">
                Subscriptions
              </Select.Option>
              <Select.Option key="cash-payments" value="/cash-payments">
                Payment History
              </Select.Option>
              <Select.Option key="wallet-transactions" value="/wallet-transactions">
                Wallet Transactions
              </Select.Option>
              <Select.Option key="payout-request" value="/payout-request">
                Payout Requests
              </Select.Option>
              <Select.Option key="language" value="/language">
                Language
              </Select.Option>
              <Select.Option key="settings" value="/settings">
                Settings
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        {!user && [
          <Col xs={12} md={12}>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                  message: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                },
                { required: true, message: 'Please enter your password!' }
              ]}
            >
              <Input.Password placeholder="User password" />
            </Form.Item>
          </Col>,
          <Col xs={12} md={12}>
            <Form.Item
              name="rePassword"
              label="Confirm password"
              rules={[
                {
                  pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                  message: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                },
                { required: true, message: 'Please confirm your password!' }
              ]}
            >
              <Input.Password placeholder="Confirm user password" />
            </Form.Item>
          </Col>
        ]}
        {currentUser?.roles && currentUser.roles.includes(ROLE_ADMIN) && (
        <Col xs={12} md={12}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option key="active" value="active">
                Active
              </Select.Option>
              <Select.Option key="inactive" value="inactive">
                Inactive
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="verifiedEmail" label="Verified Email" valuePropName="checked" help="Turn on if email account verified">
            <Switch />
          </Form.Item>
        </Col>
        )}
        <Col xs={12} md={12}>
          <Form.Item
            label="Avatar"
            help={`Avatar must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB!`}
          >
            <AvatarUpload
              headers={uploadHeaders}
              uploadUrl={avatarUploadUrl}
              onBeforeUpload={beforeUpload}
              onUploaded={onAvatarUploaded}
              image={options?.avatarUrl}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={updating}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
