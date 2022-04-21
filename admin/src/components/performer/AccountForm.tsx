import { PureComponent } from 'react';
import {
  Form, Input, Button, Select, message, Switch, Row, Col, DatePicker, InputNumber, Upload, Checkbox, Progress
} from 'antd';
import {
  IPerformer, ICountry, ILangguges, IPhoneCodes, IBody
} from 'src/interfaces';
import {
  UploadOutlined
} from '@ant-design/icons';
import { AvatarUpload } from '@components/user/avatar-upload';
import { CoverUpload } from '@components/user/cover-upload';
import { authService, performerService, getGlobalConfig } from '@services/index';
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

interface IProps {
  onFinish: Function;
  onUploaded: Function;
  performer?: IPerformer;
  submiting: boolean;
  countries: ICountry[];
  languages: ILangguges[];
  phoneCodes: IPhoneCodes[];
  bodyInfo: IBody;
  avatarUrl: string;
  coverUrl: string;
}

export class AccountForm extends PureComponent<IProps> {
  state = {
    isUploadingVideo: false,
    uploadVideoPercentage: 0,
    previewVideoUrl: '',
    previewVideoName: ''
  }

  componentDidMount() {
    const { performer } = this.props;
    this.setState({
      previewVideoUrl: performer?.welcomeVideoPath,
      previewVideoName: performer?.welcomeVideoName
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
        previewVideoUrl: info?.file?.response?.data?.url,
        previewVideoName: info?.file?.response?.data?.name
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
      performer, onFinish, submiting, countries, onUploaded, bodyInfo, avatarUrl, coverUrl
    } = this.props;
    const {
      heights = [], weights = [], bodyTypes = [], genders = [], sexualOrientations = [], ethnicities = [],
      hairs = [], eyes = [], butts = []
    } = bodyInfo;
    const {
      uploadVideoPercentage, isUploadingVideo, previewVideoName, previewVideoUrl
    } = this.state;
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
              rules={[
                { required: true },
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
                {genders.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="sexualOrientation" label="Sexual orientation">
              <Select>
                {sexualOrientations.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
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
          {!performer && [
            <Col xs={12} md={12}>
              <Form.Item
                key="password"
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
                <Input.Password placeholder="Password" />
              </Form.Item>
            </Col>,
            <Col xs={12} md={12}>
              <Form.Item
                key="rePassword"
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
                {ethnicities.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
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
          <Col xs={12} md={12}>
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
          <Col xs={12} md={12}>
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
          <Col xs={12} md={12}>
            <Form.Item name="eyes" label="Eyes">
              <Select>
                {eyes.map((s) => (
                  <Select.Option key={s.value} value={s.value}>
                    {s.text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} md={12}>
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
          <Col xs={12} md={12}>
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
            <Form.Item name="verifiedEmail" label="Verified Email?" valuePropName="checked" help="Turn on if email account verified">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={8} md={8}>
            <Form.Item name="verifiedDocument" label="Verified ID Documents?" valuePropName="checked" help="Allow model to start posting contents">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={8} md={8}>
            <Form.Item name="verifiedAccount" label="Verified Account?" valuePropName="checked" help="Display verification tick beside model name">
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
                  Not verified email
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          {performer && (
            <Col md={12} xs={12}>
              <Form.Item label="Intro Video">
                <Upload
                  accept={'video/*'}
                  name="welcome-video"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  action={performerService.getWelcomeVideoUploadUrl(performer._id)}
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
                   Intro video is $
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
          )}
          <Col xs={24} md={24}>
            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
              <Button type="primary" htmlType="submit" disabled={submiting || isUploadingVideo} loading={submiting || isUploadingVideo}>
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
