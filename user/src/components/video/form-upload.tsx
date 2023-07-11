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
import { IPerformer, IVideo } from 'src/interfaces/index';
import {
  CameraOutlined, VideoCameraAddOutlined, FileDoneOutlined, DeleteOutlined
} from '@ant-design/icons';
import { performerService, videoService } from '@services/index';
import moment from 'moment';
import { debounce } from 'lodash';
import Router from 'next/router';
import { VideoPlayer } from '@components/common';
import { getGlobalConfig } from '@services/config';
import './video.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  user: IPerformer;
  video?: IVideo;
  submit: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
  intl: IntlShape
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const { Option } = Select;

class FormUploadVideo extends PureComponent<IProps> {
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
    previewType: '',
    removedTeaser: false,
    removedThumbnail: false
  };

  componentDidMount() {
    const { video, user } = this.props;
    if (video) {
      this.setState({
        previewThumbnail: video?.thumbnail,
        previewVideo: video?.video,
        previewTeaser: video?.teaser,
        isSale: video.isSale,
        isSchedule: video.isSchedule,
        scheduledAt: video.scheduledAt ? moment(video.scheduledAt) : moment()
      });
    }
    this.getPerformers('', video?.participantIds || [user._id]);
  }

  async handleRemovefile(type: string) {
    const { intl } = this.props;
    if (!window.confirm('Confirm to remove file!')) return;
    const { video } = this.props;
    try {
      await videoService.deleteFile(video._id, type);
      type === 'teaser' && this.setState({ removedTeaser: true });
      type === 'thumbnail' && this.setState({ removedThumbnail: true });
    } catch (e) {
      const err = await e;
      message.error(err?.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
    }
  }

  getPerformers = debounce(async (q, performerIds) => {
    const { intl } = this.props;
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
      message.error(err?.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
    }
  }, 500);

  previewModal = () => {
    const {
      isShowPreview, previewUrl, previewType
    } = this.state;
    return (
      <Modal
        width={767}
        footer={null}
        onOk={() => this.setState({ isShowPreview: false })}
        onCancel={() => this.setState({ isShowPreview: false })}
        visible={isShowPreview}
        destroyOnClose
      >
        {['teaser', 'video'].includes(previewType) && (
          <VideoPlayer
            {...{
              autoplay: true,
              controls: true,
              playsinline: true,
              fluid: true,
              sources: [
                {
                  src: previewUrl,
                  type: 'video/mp4'
                }
              ]
            }}
          />
        )}
        {previewType === 'thumbnail' && (
          <img
            src={previewUrl}
            alt="thumbnail"
            width="100%"
            style={{ borderRadius: 5 }}
          />
        )}
      </Modal>
    );
  };

  beforeUpload(file: File, field: string) {
    const { beforeUpload: beforeUploadHandler, intl } = this.props;
    const config = getGlobalConfig();
    if (field === 'thumbnail') {
      const isValid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
      if (!isValid) {
        message.error(`${intl.formatMessage({
          id: 'fileIsTooLargePleaseProvideAnFile',
          defaultMessage: 'File is too large please provide an file'
        })} ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB ${intl.formatMessage({
          id: 'orBelow',
          defaultMessage: 'or below'
        })}`);
        return isValid;
      }
      this.setState({ selectedThumbnail: file });
    }
    if (field === 'teaser') {
      const isValid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
      if (!isValid) {
        message.error(`${intl.formatMessage({
          id: 'fileIsTooLargePleaseProvideAnFile',
          defaultMessage: 'File is too large please provide an file'
        })} ${config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB ${intl.formatMessage({
          id: 'orBelow',
          defaultMessage: 'or below'
        })}`);
        return isValid;
      }
      this.setState({ selectedTeaser: file });
    }
    if (field === 'video') {
      const isValid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000);
      if (!isValid) {
        message.error(`${intl.formatMessage({
          id: 'fileIsTooLargePleaseProvideAnFile',
          defaultMessage: 'File is too large please provide an file'
        })} ${config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000}MB ${intl.formatMessage({
          id: 'orBelow',
          defaultMessage: 'or below'
        })}`);
        return isValid;
      }
      this.setState({ selectedVideo: file });
    }
    return beforeUploadHandler(file, field);
  }

  render() {
    const {
      video, submit, uploading, uploadPercentage, user, intl
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
      selectedVideo,
      removedTeaser,
      removedThumbnail
    } = this.state;
    const config = getGlobalConfig();
    const validateMessages = {
      required: intl.formatMessage({ id: 'thisFieldIsRequired', defaultMessage: 'This field is required!' })
    };

    return (
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
        onFinishFailed={() => message.error(intl.formatMessage({
          id: 'pleaseCompleteTheRequiredFields',
          defaultMessage: 'Please complete the required fields'
        }))}
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
        scrollToFirstError
        className="account-form"
      >
        <Row>
          <Col md={24} xs={24}>
            <Form.Item
              label={intl.formatMessage({ id: 'title', defaultMessage: 'Title' })}
              name="title"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pleaseInputTitleOfVideo',
                    defaultMessage: 'Please input title of video!'
                  })
                }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col md={24} xs={24}>
            <Form.Item
              label={intl.formatMessage({
                id: 'participants',
                defaultMessage: 'Participants'
              })}
              name="participantIds"
            >
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                showSearch
                placeholder={intl.formatMessage({ id: 'searchModel', defaultMessage: 'Search model here' })}
                optionFilterProp="children"
                onSearch={this.getPerformers.bind(this)}
                loading={uploading}
                defaultValue={video?.participantIds || []}
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
            <Form.Item label={intl.formatMessage({ id: 'tags', defaultMessage: 'Tags' })} name="tags">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                size="middle"
                showArrow={false}
                defaultValue={video?.tags || []}
              />
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item
              name="status"
              label={intl.formatMessage({ id: 'status', defaultMessage: 'Status' })}
              rules={[{
                required: true,
                message: intl.formatMessage({
                  id: 'pleaseSelectStatus',
                  defaultMessage: 'Please select status'
                })
              }]}
            >
              <Select>
                <Select.Option key="active" value="active">
                  {intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}
                </Select.Option>
                <Select.Option key="inactive" value="inactive">
                  {intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item name="isSale" label={intl.formatMessage({ id: 'forSale', defaultMessage: 'For sale?' })}>
              <Switch
                checkedChildren={intl.formatMessage({ id: 'payPerView', defaultMessage: 'Pay per view' })}
                unCheckedChildren={intl.formatMessage({ id: 'subscribeToView', defaultMessage: 'Subscribe to view' })}
                checked={isSale}
                onChange={(val) => this.setState({ isSale: val })}
              />
            </Form.Item>
            {isSale && (
            <Form.Item name="price" label={intl.formatMessage({ id: 'Price', defaultMessage: 'Price' })}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            )}
          </Col>
          <Col md={12} xs={24}>
            <Form.Item name="isSchedule" label={`${intl.formatMessage({ id: 'scheduled', defaultMessage: 'Scheduled' })}?`}>
              <Switch
                checkedChildren={intl.formatMessage({ id: 'scheduled', defaultMessage: 'Scheduled' })}
                unCheckedChildren={intl.formatMessage({ id: 'notScheduled', defaultMessage: 'Not scheduled' })}
                checked={isSchedule}
                onChange={(val) => this.setState({ isSchedule: val })}
              />
            </Form.Item>
            {isSchedule && (
            <Form.Item label={intl.formatMessage({ id: 'scheduledFor', defaultMessage: 'Scheduled for' })}>
              <DatePicker
                style={{ width: '100%' }}
                disabledDate={(currentDate) => currentDate && currentDate < moment().endOf('day')}
                defaultValue={scheduledAt}
                onChange={(val) => this.setState({ scheduledAt: val })}
              />
            </Form.Item>
            )}
          </Col>
          <Col span={24}>
            <Form.Item name="description" label={intl.formatMessage({ id: 'description', defaultMessage: 'Description' })}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={intl.formatMessage({ id: 'video', defaultMessage: 'Video' })}
              className="upload-bl"
              help={
                  (previewVideo && (
                  <a
                    aria-hidden
                    onClick={() => this.setState({
                      isShowPreview: true, previewUrl: previewVideo?.url, previewType: 'video'
                    })}
                  >
                    {previewVideo?.name || intl.formatMessage({ id: 'clickHereToPreview', defaultMessage: 'Click here to preview' })}
                  </a>
                  ))
                  || (selectedVideo && <a>{selectedVideo.name}</a>)
                  || `Video file is ${config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2048}MB ${intl.formatMessage({
                    id: 'orBelow',
                    defaultMessage: 'or below'
                  })}`
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
              label={intl.formatMessage({ id: 'teaser', defaultMessage: 'Teaser' })}
              className="upload-bl"
              help={
                (previewTeaser && !removedTeaser && (
                  <a
                    aria-hidden
                    onClick={() => this.setState({
                      isShowPreview: true, previewUrl: previewTeaser?.url, previewType: 'teaser'
                    })}
                  >
                    {previewTeaser?.name || intl.formatMessage({ id: 'clickHereToPreview', defaultMessage: 'Click here to preview' })}
                  </a>
                ))
                  || (selectedTeaser && <a>{selectedTeaser.name}</a>)
                  || `Teaser is ${config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB ${intl.formatMessage({
                    id: 'orBelow',
                    defaultMessage: 'or below'
                  })}`
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
              {video?.teaserId && !removedTeaser && <Button className="remove-btn" type="primary" onClick={() => this.handleRemovefile('teaser')}><DeleteOutlined /></Button>}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              className="upload-bl"
              label={intl.formatMessage({ id: 'thumbnail', defaultMessage: 'Thumbnail' })}
              help={
                (previewThumbnail && !removedThumbnail && (
                  <a
                    aria-hidden
                    onClick={() => this.setState({
                      isShowPreview: true, previewUrl: previewThumbnail?.url, previewType: 'thumbnail'
                    })}
                  >
                    {previewThumbnail?.name || intl.formatMessage({ id: 'clickHereToPreview', defaultMessage: 'Click here to preview' })}
                  </a>
                ))
                  || (selectedThumbnail && <a>{selectedThumbnail.name}</a>)
                  || `Thumbnail is ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB ${intl.formatMessage({
                    id: 'orBelow',
                    defaultMessage: 'or below'
                  })}`
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
              {video?.thumbnailId && !removedThumbnail && <Button className="remove-btn" type="primary" onClick={() => this.handleRemovefile('thumbnail')}><DeleteOutlined /></Button>}
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
            {video ? intl.formatMessage({
              id: 'update',
              defaultMessage: 'Update'
            }) : intl.formatMessage({
              id: 'upload',
              defaultMessage: 'Upload'
            })}
          </Button>
          <Button
            className="secondary"
            onClick={() => Router.back()}
            disabled={uploading}
          >
            {intl.formatMessage({ id: 'back', defaultMessage: 'Back' })}
          </Button>
        </Form.Item>
        {this.previewModal()}
      </Form>
    );
  }
}

export default injectIntl(FormUploadVideo);
