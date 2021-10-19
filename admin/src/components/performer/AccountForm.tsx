import { PureComponent } from 'react';
import {
  Form, Input, Button, Select, message, Switch, Row, Col, DatePicker, InputNumber
} from 'antd';
import {
  IPerformer,
  ICountry,
  ILangguges,
  IPhoneCodes,
  IPerformerCategory,
  IHeight,
  IWeight
} from 'src/interfaces';
import { AvatarUpload } from '@components/user/avatar-upload';
import { CoverUpload } from '@components/user/cover-upload';
import { authService, performerService } from '@services/index';
import Router from 'next/router';
import moment from 'moment';
import './index.less';

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
    // eslint-disable-next-line no-template-curly-in-string
    range: 'Must be between ${min} and ${max}'
  }
};

const { TextArea } = Input;
const { Option } = Select;

interface IProps {
  onFinish: Function;
  onUploaded: Function;
  performer?: IPerformer;
  submiting?: boolean;
  countries: ICountry[];
  languages: ILangguges[];
  phoneCodes?: IPhoneCodes[];
  categories?: IPerformerCategory[];
  heights?: IHeight[];
  weights?: IWeight[];
  avatarUrl?: string;
  coverUrl?: string;
}

export class AccountForm extends PureComponent<IProps> {
  render() {
    const {
      performer, onFinish, submiting, countries, onUploaded, heights, weights,
      avatarUrl, coverUrl
    } = this.props;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <Form
        {...layout}
        name="form-performer"
        onFinish={onFinish.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        validateMessages={validateMessages}
        initialValues={
          performer ? { ...performer, dateOfBirth: moment(performer?.dateOfBirth) || '' } : {
            country: 'US',
            status: 'active',
            gender: 'male',
            sexualOrientation: 'female',
            languages: ['en'],
            dateOfBirth: '',
            verifiedEmail: false,
            verifiedAccount: false,
            verifiedDocument: false,
            balance: 0
          }
        }
      >
        <Row>
          <Col xs={24} md={24}>
            <div
              className="top-profile"
              style={{
                position: 'relative',
                marginBottom: 25,
                backgroundImage:
                  coverUrl
                    ? `url('${coverUrl}')`
                    : "url('/banner-image.jpg')"
              }}
            >
              <div className="avatar-upload">
                <AvatarUpload
                  headers={uploadHeaders}
                  uploadUrl={performerService.getAvatarUploadUrl()}
                  onUploaded={onUploaded.bind(this, 'avatarId')}
                  image={avatarUrl}
                />
              </div>
              <div className="cover-upload">
                <CoverUpload
                  options={{ fieldName: 'cover' }}
                  image={performer && performer.cover ? performer.cover : ''}
                  headers={uploadHeaders}
                  uploadUrl={performerService.getCoverUploadUrl()}
                  onUploaded={onUploaded.bind(this, 'coverId')}
                />
              </div>
            </div>
          </Col>
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
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true },
                {
                  pattern: new RegExp(/^[a-z0-9]+$/g),
                  message: 'Username must contain lowercase alphanumerics only'
                }, { min: 3 }]}
            >
              <Input placeholder="Unique, lowercase alphanumerics only" />
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true }]}>
              <Input placeholder="Email address" />
            </Form.Item>
          </Col>
          <Col md={12} xs={12}>
            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
              validateTrigger={['onChange', 'onBlur']}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: 'Select your date of birth'
                }
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="DD/MM/YYYY"
                format="DD/MM/YYYY"
                disabledDate={(currentDate) => currentDate && currentDate > moment().subtract(14, 'year').endOf('day')}
              />
            </Form.Item>
          </Col>
          <Col md={12} xs={12}>
            <Form.Item
              label="Token balance"
              name="balance"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="gender" label="Gender" required>
              <Select>
                <Select.Option key="male" value="male">
                  Male
                </Select.Option>
                <Select.Option key="female" value="female">
                  Female
                </Select.Option>
                <Select.Option key="transgender" value="transgender">
                  Transgender
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="sexualOrientation" label="Sexual orientation">
              <Select>
                <Select.Option key="male" value="male">
                  Male
                </Select.Option>
                <Select.Option key="female" value="female">
                  Female
                </Select.Option>
                <Select.Option key="transgender" value="transgender">
                  Transgender
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { min: 9 },
                { max: 14 },
                {
                  pattern: /^[0-9\b\\+ ]+$/,
                  message: 'The phone number is not in the correct format'
                }
              ]}
            >
              <Input style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          {/* {categories && categories.length > 0 && (
          <Form.Item
            name="categoryIds"
            label="Categories"
            rules={[
              {
                type: 'array'
              }
            ]}
          >
            <Select mode="multiple">
              {categories.map((cat) => (
                <Select.Option key={cat.slug} value={cat._id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )} */}
          {!performer && [
            <Col xs={12} md={12}>
              <Form.Item
                key="password"
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password' }, { min: 6, message: 'Password must be at least 6 characters' }]}
              >
                <Input.Password placeholder="Password" />
              </Form.Item>
            </Col>,
            <Col xs={12} md={12}>
              <Form.Item
                key="rePassword"
                name="rePassword"
                label="Confirm password"
                rules={[{ required: true, message: 'Please confirm your password' }, { min: 6, message: 'Password must be at least 6 characters' }]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </Col>
          ]}
          <Col xs={12} md={12}>
            <Form.Item name="country" label="Country">
              <Select showSearch>
                {countries.map((country) => (
                  <Select.Option key={country.code} value={country.code}>
                    <img src={country.flag} alt="flag" width="20px" />
                    {country.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="state" label="State">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="city" label="City">
              <Input placeholder="Enter the city" />
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="address" label="Address">
              <Input placeholder="Enter the address" />
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="zipcode" label="Zipcode">
              <Input placeholder="Enter the zipcode" />
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="ethnicity" label="Ethnicity">
              <Select>
                <Option key="white" value="white">
                  White
                </Option>
                <Option key="Asian" value="asian">
                  Asian
                </Option>
                <Option key="latino" value="latino">
                  Latino
                </Option>
                <Option key="hispanic" value="hispanic">
                  Hispanic
                </Option>
                <Option key="blackOrAfricanAmerican" value="black or african american">
                  Black or African American
                </Option>
                <Option key="native hawaiian or other pacific islander" value="native hawaiian or other pacific islander">
                  Native Hawaiian or Other Pacific Islander
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="bodyType" label="Body Type">
              <Select>
                <Option key="slim" value="slim">
                  Slim
                </Option>
                <Option key="petite" value="petite">
                  Petite
                </Option>
                <Option key="curvy" value="curvy">
                  Curvy
                </Option>
                <Option key="large" value="large">
                  Large
                </Option>
                <Option key="toned" value="toned">
                  Toned
                </Option>
                <Option key="fit" value="fit">
                  Fit
                </Option>
                <Option key="gymBody" value="gymBody">
                  Gym Body
                </Option>
                <Option key="muscular" value="muscular">
                  Muscular
                </Option>
                <Option key="ripped" value="ripped">
                  Ripped
                </Option>
                <Option key="tanned" value="tanned">
                  Tanned
                </Option>
                <Option key="runner" value="runner">
                  Runner
                </Option>
                <Option key="swimmer" value="swimmer">
                  Swimmer
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="height" label="Height">
              <Select showSearch>
                {heights
                  && heights.map((h: IHeight) => (
                    <Option key={h.text} value={h.text}>
                      {h.text}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="weight" label="Weight">
              <Select showSearch>
                {weights
              && weights.map((w: IWeight) => (
                <Option key={w.text} value={w.text}>
                  {w.text}
                </Option>
              ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="eyes" label="Eyes">
              <Select>
                <Option key="blue" value="blue">
                  Blue
                </Option>
                <Option key="brown" value="brown">
                  Brown
                </Option>
                <Option key="green" value="green">
                  Green
                </Option>
                <Option key="amber" value="amber">
                  Amber
                </Option>
                <Option key="gray" value="gray">
                  Gray
                </Option>
                <Option key="hazel" value="hazel">
                  Hazel
                </Option>
                <Option key="red" value="red">
                  Red
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="hair" label="Hair">
              <Select>
                <Option key="blonde" value="blonde">
                  Blond
                </Option>
                <Option key="brown" value="brown">
                  Brown
                </Option>
                <Option key="brunet" value="brunet">
                  Brunet
                </Option>
                <Option key="black" value="black">
                  Black
                </Option>
                <Option key="red" value="red">
                  Red Head
                </Option>
                <Option key="blue" value="blue">
                  Blue
                </Option>
                <Option key="green" value="green">
                  Green
                </Option>
                <Option key="pink" value="pink">
                  Pink
                </Option>
                <Option key="white" value="white">
                  White
                </Option>
                <Option key="ginger" value="ginger">
                  Ginger
                </Option>
                <Option key="multiColored" value="multiColored">
                  MultiColored
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="butt" label="Butt size">
              <Select>
                <Option key="large" value="large">
                  Large
                </Option>
                <Option key="medium" value="medium">
                  Medium
                </Option>
                <Option key="small" value="small">
                  Small
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={24}>
            <Form.Item name="bio" label="Bio">
              <TextArea rows={3} />
            </Form.Item>
          </Col>
          {/* <Form.Item
          name="languages"
          label="Languages"
          rules={[
            {
              type: 'array'
            }
          ]}
        >
          <Select mode="multiple">
            {languages.map((l) => (
              <Select.Option key={l.code} value={l.code}>
                {l.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item> */}
          <Col xs={8} md={8}>
            <Form.Item name="verifiedEmail" label="Verified Email" valuePropName="checked" help="Tracking reality email-adress">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={8} md={8}>
            <Form.Item name="verifiedDocument" label="Verified ID Documents" valuePropName="checked" help="Accept model to start posting contents">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={8} md={8}>
            <Form.Item name="verifiedAccount" label="Verified Account" valuePropName="checked" help="Display verification tick beside model name">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={24}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option key="active" value="active">
                  Active
                </Select.Option>
                <Select.Option key="inactive" value="inactive">
                  Inactive
                </Select.Option>
                <Select.Option key="pending-email-confirmation" value="pending-email-confirmation" disabled>
                  Pending email confirmation
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={24}>
            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
              <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
                Submit
              </Button>
              &nbsp;
              <Button onClick={() => Router.back()} disabled={submiting}>
                Back
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
}
