import { PureComponent } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  message,
  Progress,
  Switch,
  DatePicker,
  Row,
  Col,
  Avatar,
  Modal
} from 'antd';
import { IUser, IVideo } from 'src/interfaces/index';
import {
  CameraOutlined,
  VideoCameraAddOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import { performerService } from '@services/index';
import moment from 'moment';
import { debounce } from 'lodash';
import Router from 'next/router';
import './video.less';
import { VideoPlayer } from '@components/common';
import { getGlobalConfig } from '@services/config';

interface IProps {
  user: IUser;
  video?: IVideo;
  submit: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const { Option } = Select;

const validateMessages = {
  required: 'This field is required!'
};

export class FormUploadVideo extends PureComponent<IProps> {
  state = {
    previewThumbnail: null,
    previewTeaser: null,
    previewVideo: null,
    selectedThumbnail: null,
    selectedVideo: null,
    selectedTeaser: null,
    isSale: false,
    isSchedule: false,
    scheduledAt: moment(),
    performers: [],
    isShowPreview: false,
    previewUrl: '',
    previewType: ''
  };

  componentDidMount() {
    const { video, user } = this.props;
    if (video) {
      this.setState({
        previewThumbnail: video.thumbnail ? video.thumbnail : null,
        previewVideo: video.video && video.video.url ? video.video.url : null,
        previewTeaser: video.teaser ? video.teaser : null,
        isSale: video.isSale,
        isSchedule: video.isSchedule,
        scheduledAt: video.scheduledAt ? moment(video.scheduledAt) : moment()
      });
    }
    this.getPerformers('', video?.participantIds || [user._id]);
  }

  onSwitch(field: string, checked: boolean) {
    if (field === 'saleVideo') {
      this.setState({
        isSale: checked
      });
    }
    if (field === 'scheduling') {
      this.setState({
        isSchedule: checked
      });
    }
  }

  onSchedule(val: any) {
    this.setState({
      scheduledAt: val
    });
  }

  getPerformers = debounce(async (q, performerIds) => {
    try {
      const resp = await (
        await performerService.search({
          q,
          performerIds: performerIds || '',
          limit: 500
        })
      ).data;
      const performers = resp.data || [];
      this.setState({ performers });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
    }
  }, 500);

  previewModal = () => {
    const {
      isShowPreview: isShow,
      previewUrl: url,
      previewType: type
    } = this.state;
    return (
      <Modal
        title={(
          <span style={{ textTransform: 'capitalize' }}>
            {type}
            {' '}
            preview
          </span>
        )}
        closable={false}
        visible={isShow}
        footer={(
          <Button type="primary" onClick={() => this.setState({ isShowPreview: false })}>
            Ok
          </Button>
        )}
      >
        {type === 'teaser' && (
          <VideoPlayer
            {...{
              autoplay: true,
              controls: true,
              playsinline: true,
              fluid: true,
              sources: [
                {
                  src: url,
                  type: 'video/mp4'
                }
              ]
            }}
          />
        )}
        {type === 'thumbnail' && (
          <img
            src={url}
            alt="thumbnail"
            width="100%"
            style={{ borderRadius: 5 }}
          />
        )}
      </Modal>
    );
  };

  beforeUpload(file: File, field: string) {
    const { beforeUpload: beforeUploadHandler } = this.props;
    const config = getGlobalConfig();
    if (field === 'thumbnail') {
      const isValid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
      if (!isValid) {
        message.error(`File is too large please provide an file ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB or below`);
        return isValid;
      }
      this.setState({ selectedThumbnail: file });
    }
    if (field === 'teaser') {
      const isValid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
      if (!isValid) {
        message.error(`File is too large please provide an file ${config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB or below`);
        return isValid;
      }
      this.setState({ selectedTeaser: file });
    }
    if (field === 'video') {
      const isValid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000);
      if (!isValid) {
        message.error(`File is too large please provide an file ${config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000}MB or below`);
        return isValid;
      }
      this.setState({ selectedVideo: file });
    }
    return beforeUploadHandler(file, field);
  }

  render() {
    const {
      video, submit, uploading, uploadPercentage, user
    } = this.props;
    const {
      previewThumbnail,
      previewTeaser,
      previewVideo,
      performers,
      isSale,
      isSchedule,
      scheduledAt,
      selectedThumbnail,
      selectedTeaser,
      selectedVideo
    } = this.state;
    const config = getGlobalConfig();
    return (
      <>
        <Form
          {...layout}
          onFinish={(values) => {
            const data = values;
            if (isSchedule) {
              data.scheduledAt = scheduledAt;
            }
            if (values.tags && values.tags.length) {
              data.tags = values.tags.map((tag) => tag.replace(/[^a-zA-Z0-9 ]/g, '_'));
            }
            submit(data);
          }}
          onFinishFailed={() => message.error('Please complete the required fields')}
          name="form-upload"
          validateMessages={validateMessages}
          initialValues={
            video || {
              title: '',
              price: 9.99,
              description: '',
              tags: [],
              isSale: false,
              participantIds: [user._id],
              isSchedule: false,
              status: 'active'
            }
          }
          className="account-form"
        >
          <Row>
            <Col md={24} xs={24}>
              <Form.Item
                label="Title"
                name="title"
                rules={[
                  { required: true, message: 'Please input title of video!' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col md={24} xs={24}>
              <Form.Item label="Participants" name="participantIds">
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  showSearch
                  placeholder="Search performers here"
                  optionFilterProp="children"
                  onSearch={this.getPerformers.bind(this)}
                  loading={uploading}
                >
                  {performers
                    && performers.length > 0
                    && performers.map((p) => (
                      <Option key={p._id} value={p._id}>
                        <Avatar src={p?.avatar || '/static/no-avatar.png'} />
                        {' '}
                        {p?.name || p?.username || 'N/A'}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item label="Tags" name="tags">
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  size="middle"
                  showArrow={false}
                  defaultActiveFirstOption={false}
                />
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select>
                  <Select.Option key="error" value="file-error" disabled>
                    File Error
                  </Select.Option>
                  <Select.Option key="active" value="active">
                    Active
                  </Select.Option>
                  <Select.Option key="inactive" value="inactive">
                    Inactive
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col md={12} xs={24}>
              <Form.Item name="isSale" label="For sale?">
                <Switch
                  checkedChildren="Pay per view"
                  unCheckedChildren="Subscribe to view"
                  checked={isSale}
                  onChange={this.onSwitch.bind(this, 'saleVideo')}
                />
              </Form.Item>
              {isSale && (
                <Form.Item name="price" label="Amount of Tokens">
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              )}
            </Col>
            <Col md={12} xs={24}>
              <Form.Item name="isSchedule" label="Scheduling?">
                <Switch
                  checkedChildren="Scheduling"
                  unCheckedChildren="Unschedule"
                  checked={isSchedule}
                  onChange={this.onSwitch.bind(this, 'scheduling')}
                />
              </Form.Item>
              {isSchedule && (
                <Form.Item label="Schedule at">
                  <DatePicker
                    style={{ width: '100%' }}
                    disabledDate={(currentDate) => currentDate && currentDate < moment().endOf('day')}
                    defaultValue={scheduledAt}
                    onChange={this.onSchedule.bind(this)}
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Video"
                help={
                  (selectedVideo && <a>{selectedVideo.name}</a>)
                  || (previewVideo && (
                    <a href={previewVideo} target="_blank" rel="noreferrer">
                      Click here to preview
                    </a>
                  ))
                  || `Video file is ${
                    config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2048
                  }MB or below`
                }
              >
                <Upload
                  customRequest={() => false}
                  listType="picture-card"
                  className="avatar-uploader"
                  accept="video/*"
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading}
                  beforeUpload={(file) => this.beforeUpload(file, 'video')}
                >
                  {selectedVideo ? (
                    <FileDoneOutlined />
                  ) : (
                    <VideoCameraAddOutlined />
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Teaser"
                help={
                  (selectedTeaser && <a>{selectedTeaser.name}</a>)
                  || (previewTeaser && (
                    <p>
                      <a
                        aria-hidden
                        onClick={() => this.setState({
                          isShowPreview: true,
                          previewUrl: previewTeaser,
                          previewType: 'teaser'
                        })}
                        rel="noreferrer"
                      >
                        Click here to preview
                      </a>
                    </p>
                  ))
                  || `Teaser is ${
                    config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200
                  }MB or below`
                }
              >
                <Upload
                  customRequest={() => false}
                  listType="picture-card"
                  className="avatar-uploader"
                  accept="video/*"
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading}
                  beforeUpload={(file) => this.beforeUpload(file, 'teaser')}
                >
                  {selectedTeaser ? (
                    <FileDoneOutlined />
                  ) : (
                    <VideoCameraAddOutlined />
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Thumbnail"
                help={
                  (selectedThumbnail && <a>{selectedThumbnail.name}</a>)
                  || (previewThumbnail && (
                    <p>
                      <a
                        aria-hidden
                        rel="noreferrer"
                        onClick={() => this.setState({
                          isShowPreview: true,
                          previewUrl: previewThumbnail,
                          previewType: 'thumbnail'
                        })}
                      >
                        Click here to preview
                      </a>
                    </p>
                  ))
                  || `Thumbnail is ${
                    config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5
                  }MB or below`
                }
              >
                <Upload
                  listType="picture-card"
                  className="avatar-uploader"
                  accept="image/*"
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading}
                  beforeUpload={(file) => this.beforeUpload(file, 'thumbnail')}
                >
                  {selectedThumbnail ? (
                    <FileDoneOutlined />
                  ) : (
                    <CameraOutlined />
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          {uploadPercentage ? (
            <Progress percent={Math.round(uploadPercentage)} />
          ) : null}
          <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
            <Button
              className="primary"
              htmlType="submit"
              loading={uploading}
              disabled={uploading}
            >
              {video ? 'Update' : 'Upload'}
            </Button>
            <Button
              className="secondary"
              onClick={() => Router.back()}
              disabled={uploading}
            >
              Back
            </Button>
          </Form.Item>
        </Form>

        {this.previewModal()}
      </>
    );
  }
}
