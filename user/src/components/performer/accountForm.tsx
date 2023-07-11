/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import {
  Form, Input, Button, Row, Col, Select, DatePicker,
  Upload, Progress, message, Checkbox, Popover, Modal
} from 'antd';
import {
  IPerformer, ICountry, IBody
} from 'src/interfaces';
import AvatarUpload from '@components/user/avatar-upload';
import CoverUpload from '@components/user/cover-upload';
import {
  UploadOutlined, TwitterOutlined, GoogleOutlined
} from '@ant-design/icons';
import { getGlobalConfig } from '@services/config';
import { VideoPlayer } from '@components/common';
import moment from 'moment';
import { injectIntl, IntlShape } from 'react-intl';

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
  intl: IntlShape
}
class PerformerAccountForm extends PureComponent<IProps> {
  state = {
    isUploadingVideo: false,
    uploadVideoPercentage: 0,
    previewVideoUrl: null,
    previewVideoName: null,
    isShowPreview: false
  }

  componentDidMount() {
    const { user } = this.props;
    this.setState({
      previewVideoUrl: user?.welcomeVideoPath,
      previewVideoName: user?.welcomeVideoName
    });
  }

  handleVideoChange = (info: any) => {
    const { intl } = this.props;
    info.file && info.file.percent && this.setState({ uploadVideoPercentage: info.file.percent });
    if (info.file.status === 'uploading') {
      this.setState({ isUploadingVideo: true });
      return;
    }
    if (info.file.status === 'done') {
      message.success(intl.formatMessage({
        id: 'introVideoWasUploaded',
        defaultMessage: 'Intro video was uploaded'
      }));
      this.setState({
        isUploadingVideo: false,
        previewVideoUrl: info?.file?.response?.data.url,
        previewVideoName: info?.file?.response?.data.name
      });
    }
  };

  beforeUploadVideo = (file) => {
    const { intl } = this.props;
    const isValid = file.size / 1024 / 1024 < (getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
    if (!isValid) {
      message.error(`${intl.formatMessage({
        id: 'fileIsTooLargePleaseProvideAnFile',
        defaultMessage: 'File is too large please provide an file'
      })} ${getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200}BM ${intl.formatMessage({
        id: 'orBelow',
        defaultMessage: 'or below'
      })}`);
      return false;
    }
    this.setState({ previewVideoName: file.name });
    return true;
  }

  render() {
    const {
      onFinish, user, updating, countries, options, bodyInfo, onVerifyEmail, countTime = 60, intl
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
      isUploadingVideo, uploadVideoPercentage, previewVideoUrl, previewVideoName, isShowPreview
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
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
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
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
                  message:
                    intl.formatMessage({
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
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
              <Input placeholder="user1, john99,..." />
            </Form.Item>
          </Col>
          <Col lg={24} md={24} xs={24}>
            <Form.Item
              name="email"
              label={(
                <span style={{ fontSize: 10 }}>
                  {intl.formatMessage({ id: 'emailAddress', defaultMessage: 'Email Address' })}
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
                          disabled={updating || countTime < 60}
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
              <Input disabled={user.googleConnected} />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="gender"
              label={intl.formatMessage({ id: 'gender', defaultMessage: 'Gender' })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pleaseSelectYourGender',
                    defaultMessage: 'Please select your gender!'
                  })
                }]}
            >
              <Select>
                {genders.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="sexualOrientation"
              label={intl.formatMessage({
                id: 'sexualOrientation',
                defaultMessage: 'Sexual orientation'
              })}
            >
              <Select>
                {sexualOrientations.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="country"
              label={intl.formatMessage({
                id: 'country',
                defaultMessage: 'Country'
              })}
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
                    {intl.formatMessage({ id: c.code, defaultMessage: c.name })}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              label={intl.formatMessage({
                id: 'dateOfBirth',
                defaultMessage: 'Date of Birth'
              })}
              name="dateOfBirth"
              validateTrigger={['onChange', 'onBlur']}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'selectDateOfBirth',
                    defaultMessage: 'Select your date of birth!'
                  })
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
              label={intl.formatMessage({ id: 'bio', defaultMessage: 'Bio' })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pleaseInputYourBio',
                    defaultMessage: 'Please input your bio!'
                  })
                }
              ]}
            >
              <TextArea
                rows={3}
                placeholder={intl.formatMessage({
                  id: 'tellPeopleSomethingAboutYou',
                  defaultMessage: 'Tell people something about you...'
                })}
              />
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
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="state"
              label={intl.formatMessage({
                id: 'state',
                defaultMessage: 'State'
              })}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="city"
              label={intl.formatMessage({
                id: 'city',
                defaultMessage: 'City'
              })}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col lg={24} md={24} xs={24}>
            <Form.Item
              name="address"
              label={intl.formatMessage({
                id: 'address',
                defaultMessage: 'Address'
              })}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="zipcode"
              label={intl.formatMessage({
                id: 'zipCode',
                defaultMessage: 'Zip code'
              })}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="ethnicity"
              label={intl.formatMessage({
                id: 'ethnicity',
                defaultMessage: 'Ethnicity'
              })}
            >
              <Select>
                {ethnicities.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="height"
              label={intl.formatMessage({
                id: 'height',
                defaultMessage: 'Height'
              })}
            >
              <Select showSearch>
                {heights.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="weight"
              label={intl.formatMessage({
                id: 'weight',
                defaultMessage: 'Weight'
              })}
            >
              <Select showSearch>
                {weights.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="bodyType"
              label={intl.formatMessage({
                id: 'bodyType',
                defaultMessage: 'Body type'
              })}
            >
              <Select>
                {bodyTypes.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="eyes"
              label={intl.formatMessage({
                id: 'eyeColor',
                defaultMessage: 'Eye color'
              })}
            >
              <Select>
                {eyes.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="hair"
              label={intl.formatMessage({
                id: 'hairColor',
                defaultMessage: 'Hair color'
              })}
            >
              <Select>
                {hairs.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item
              name="butt"
              label={intl.formatMessage({
                id: 'buttSize',
                defaultMessage: 'Butt size'
              })}
            >
              <Select>
                {butts.map((s) => (
                  <Select.Option key={s.value} value={s.text}>
                    {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <Form.Item label={intl.formatMessage({
              id: 'introVideo',
              defaultMessage: 'Intro Video'
            })}
            >
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
                {((previewVideoUrl || previewVideoName) && <a aria-hidden onClick={() => this.setState({ isShowPreview: true })}>{previewVideoName || previewVideoUrl || 'Click here to preview'}</a>)
                  || (
                    <a>
                      {intl.formatMessage({ id: 'introVideoIs', defaultMessage: 'Intro video is' })}
                      {' '}
                      {getGlobalConfig().NEXT_PUBLIC_MAX_SIZE_TEASER || 200}
                      MB
                      {' '}
                      {intl.formatMessage({ id: 'orBelow', defaultMessage: 'or below' })}
                    </a>
                  )}
              </div>
              {uploadVideoPercentage ? (
                <Progress percent={Math.round(uploadVideoPercentage)} />
              ) : null}
            </Form.Item>
            <Form.Item name="activateWelcomeVideo" valuePropName="checked">
              <Checkbox>{intl.formatMessage({ id: 'activateIntroVideo', defaultMessage: 'Activate intro video' })}</Checkbox>
            </Form.Item>
          </Col>
          <Col lg={12} md={12} xs={24}>
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
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" type="primary" htmlType="submit" loading={updating || isUploadingVideo} disabled={updating || isUploadingVideo}>
            {intl.formatMessage({ id: 'saveChanges', defaultMessage: 'Save Changes' })}
          </Button>
        </Form.Item>
        <Modal
          width={767}
          footer={null}
          onOk={() => this.setState({ isShowPreview: false })}
          onCancel={() => this.setState({ isShowPreview: false })}
          visible={isShowPreview}
          destroyOnClose
          centered
        >
          <VideoPlayer
            {...{
              autoplay: true,
              controls: true,
              playsinline: true,
              fluid: true,
              sources: [
                {
                  src: previewVideoUrl,
                  type: 'video/mp4'
                }
              ]
            }}
          />
        </Modal>
      </Form>
    );
  }
}

export default injectIntl(PerformerAccountForm);
