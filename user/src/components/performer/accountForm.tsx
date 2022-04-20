/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import {
  Form, Input, Button, Row, Col, Select, DatePicker,
  Upload, Progress, message, Checkbox, Popover
} from 'antd';
import {
  IPerformer, ICountry, IBody
} from 'src/interfaces';
import { AvatarUpload } from '@components/user/avatar-upload';
import { CoverUpload } from '@components/user/cover-upload';
import {
  UploadOutlined, TwitterOutlined, GoogleOutlined
} from '@ant-design/icons';
import { getGlobalConfig } from '@services/config';
import moment from 'moment';

const { Option } = Select;

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const { TextArea } = Input;

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
  onVerifyEmail: Function;
  countTime: number;
  user: IPerformer;
  updating: boolean;
  options?: {
    uploadHeaders?: any;
    avatarUploadUrl?: string;
    onAvatarUploaded?: Function;
    coverUploadUrl?: string;
    onCoverUploaded?: Function;
    beforeUpload?: Function;
    videoUploadUrl?: string;
    onVideoUploaded?: Function;
    uploadPercentage?: number;
  };
  countries: ICountry[];
  bodyInfo: IBody;
}

export class PerformerAccountForm extends PureComponent<IProps> {
  state = {
    isUploadingVideo: false,
    uploadVideoPercentage: 0,
    previewVideoUrl: null,
    previewVideoName: null
  }

  componentDidMount() {
    const { user } = this.props;
    this.setState({
      previewVideoUrl: user?.welcomeVideoPath,
      previewVideoName: user?.welcomeVideoName
    });
  }

  handleVideoChange = (info: any) => {
    info.file && info.file.percent && this.setState({ uploadVideoPercentage: info.file.percent });
    if (info.file.status === 'uploading') {
      this.setState({ isUploadingVideo: true });
      return;
    }
    if (info.file.status === 'done') {
      message.success('Intro video was uploaded');
      this.setState({
        isUploadingVideo: false,
        previewVideoUrl: info?.file?.response?.data.url,
        previewVideoName: info?.file?.response?.data.name
      });
    }
  };

  beforeUploadVideo = (file) => {
    const isValid = file.size / 1024 / 1024 < (getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
    if (!isValid) {
      message.error(`File is too large please provide an file ${getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB or below`);
      return false;
    }
    this.setState({ previewVideoName: file.name });
    return true;
  }

  render() {
    const {
      onFinish, user, updating, countries, options, bodyInfo, onVerifyEmail, countTime = 60
    } = this.props;
    const {
      heights = [], weights = [], bodyTypes = [], genders = [], sexualOrientations = [], ethnicities = [],
      hairs = [], eyes = [], butts = []
    } = bodyInfo;
    const {
      uploadHeaders,
      avatarUploadUrl,
      onAvatarUploaded,
      coverUploadUrl,
      onCoverUploaded,
      videoUploadUrl
    } = options;
    const {
      isUploadingVideo, uploadVideoPercentage, previewVideoUrl, previewVideoName
    } = this.state;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish.bind(this)}
        validateMessages={validateMessages}
        initialValues={{
          ...user,
          dateOfBirth: (user.dateOfBirth && moment(user.dateOfBirth)) || ''
        }}
        scrollToFirstError
        className="account-form"
      >
        <div
          className="top-profile"
          style={{
            position: 'relative',
            marginBottom: 25,
            backgroundImage:
              user?.cover
                ? `url('${user.cover}')`
                : "url('/static/banner-image.jpg')"
          }}
        >
          <div className="avatar-upload">
            <AvatarUpload
              headers={uploadHeaders}
              uploadUrl={avatarUploadUrl}
              onUploaded={onAvatarUploaded}
              image={user.avatar}
            />
          </div>
          <div className="cover-upload">
            <CoverUpload
              headers={uploadHeaders}
              uploadUrl={coverUploadUrl}
              onUploaded={onCoverUploaded}
              image={user.cover}
              options={{ fieldName: 'cover' }}
            />
          </div>
        </div>
        <Row>
          <Col lg={12} md={12} xs={24}>
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
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="name"
              label="Display Name"
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
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
              <Input placeholder="user1, john99,..." />
            </Form.Item>
          </Col>
          <Col lg={24} md={24} xs={24}>
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
                          disabled={updating || countTime < 60}
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
              <Input disabled={user.googleConnected} />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[
                { required: true, message: 'Please select your gender!' }]}
            >
              <Select>
                {genders.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="sexualOrientation"
              label="Sexual orientation"
            >
              <Select>
                {sexualOrientations.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
              >
                {countries.map((c) => (
                  <Option value={c.code} label={c.name} key={c.code}>
                    <img alt="country_flag" src={c.flag} width="25px" />
                    {' '}
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
                disabledDate={(currentDate) => currentDate && currentDate > moment().subtract(18, 'year').endOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="bio"
              label="Bio"
              rules={[
                {
                  required: true,
                  message: 'Please enter your bio!'
                }
              ]}
            >
              <TextArea rows={3} placeholder="Tell people something about you..." />
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
              label="Confirm new Password"
              name="confirm"
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
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="state" label="State">
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>
          </Col>
          <Col lg={24} md={24} xs={24}>
            <Form.Item name="address" label="Address">
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="zipcode" label="Zip Code">
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="ethnicity" label="Ethnicity">
              <Select>
                {ethnicities.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="height" label="Height">
              <Select showSearch>
                {heights.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="weight" label="Weight">
              <Select showSearch>
                {weights.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="bodyType" label="Body Type">
              <Select>
                {bodyTypes.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="eyes" label="Eye color">
              <Select>
                {eyes.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="hair" label="Hair color">
              <Select>
                {hairs.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item name="butt" label="Butt size">
              <Select>
                {butts.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item label="Intro Video">
              <Upload
                accept={'video/*'}
                name="welcome-video"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action={videoUploadUrl}
                headers={uploadHeaders}
                beforeUpload={(file) => this.beforeUploadVideo(file)}
                onChange={this.handleVideoChange.bind(this)}
              >
                <UploadOutlined />
              </Upload>
              <div className="ant-form-item-explain" style={{ textAlign: 'left' }}>
                {((previewVideoUrl || previewVideoName) && <a rel="noreferrer" href={previewVideoUrl} target="_blank">{previewVideoName || 'Click here to preview'}</a>)
                  || (
                    <a>
                      Intro video is
                      {' '}
                      {getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200}
                      MB or below
                    </a>
                  )}
              </div>
              {uploadVideoPercentage ? (
                <Progress percent={Math.round(uploadVideoPercentage)} />
              ) : null}
            </Form.Item>
            <Form.Item name="activateWelcomeVideo" valuePropName="checked">
              <Checkbox>Activate intro video</Checkbox>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" type="primary" htmlType="submit" loading={updating || isUploadingVideo} disabled={updating || isUploadingVideo}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
