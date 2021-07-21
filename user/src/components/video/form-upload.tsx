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
  Col
} from 'antd';
import { IVideoUpdate, IVideoCreate, IUser } from 'src/interfaces/index';
import { CameraOutlined, VideoCameraAddOutlined, FileDoneOutlined } from '@ant-design/icons';
import { performerService } from '@services/index';
import moment from 'moment';
import { debounce } from 'lodash';
import Router from 'next/router';
import './video.less';

interface IProps {
  user: IUser;
  video?: IVideoUpdate;
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
    isSelectedVideo: false,
    isSelectedTeaser: false,
    isSale: false,
    isSchedule: false,
    scheduledAt: moment(),
    performers: []
  };

  componentDidMount() {
    const { video, user } = this.props;
    if (video) {
      this.setState(
        {
          previewThumbnail: video.thumbnail ? video.thumbnail : null,
          previewVideo: video.video && video.video.url ? video.video.url : null,
          previewTeaser: video.teaser ? video.teaser : null,
          isSale: video.isSale,
          isSchedule: video.isSchedule,
          scheduledAt: video.scheduledAt ? moment(video.scheduledAt) : moment()
        }
      );
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
      const resp = await (await performerService.search({ q, performerIds: performerIds || '', limit: 99 })).data;
      const performers = resp.data || [];
      this.setState({ performers });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
    }
  }, 500);

  beforeUpload(file: File, field: string) {
    const { beforeUpload: beforeUploadHandler } = this.props;
    if (field === 'teaser') {
      const isValid = file.size / 1024 / 1024 < 200;
      if (!isValid) {
        message.error('File is too large please provide an file 200MB or below');
        return isValid;
      }
      this.setState({ isSelectedTeaser: true });
    }
    if (field === 'video') {
      const isValid = file.size / 1024 / 1024 < 2048;
      if (!isValid) {
        message.error('File is too large please provide an file 2GB or below');
        return isValid;
      }
      this.setState({ isSelectedVideo: true });
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
      isSelectedTeaser,
      isSelectedVideo
    } = this.state;
    const haveVideo = !!video;
    return (
      <Form
        {...layout}
        onFinish={(values: IVideoUpdate) => {
          const data = values;
          if (isSchedule) {
            data.scheduledAt = scheduledAt;
          }
          submit(data);
        }}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-upload"
        validateMessages={validateMessages}
        initialValues={
          video
          || ({
            title: '',
            price: 9.99,
            description: '',
            tags: [],
            isSale: false,
            participantIds: [user._id],
            isSchedule: false,
            status: 'active'
          } as IVideoCreate)
        }
        className="account-form"
      >
        <Row>
          <Col md={12} xs={24}>
            <Form.Item
              label="Title"
              name="title"
              rules={[
                { required: true, message: 'Please input title of video!' }
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Tags" name="tags">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                size="middle"
                showArrow={false}
                defaultActiveFirstOption={false}
              />
            </Form.Item>
            <Form.Item
              label="Participants"
              name="participantIds"
            >
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
                      {p?.name || p?.username || 'N/A'}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
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
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="isSale"
              label="Pay per view?"
            >
              <Switch
                checkedChildren="Sale"
                unCheckedChildren="Free"
                checked={isSale}
                onChange={this.onSwitch.bind(this, 'saleVideo')}
              />
            </Form.Item>
            {isSale && (
              <Form.Item name="price" label="Amount of Tokens">
                <InputNumber min={1} />
              </Form.Item>
            )}
            <Form.Item
              name="isSchedule"
              label="Scheduling?'"
            >
              <Switch
                checkedChildren="Scheduling"
                unCheckedChildren="Un-scheduled"
                checked={isSchedule}
                onChange={this.onSwitch.bind(this, 'scheduling')}
              />
            </Form.Item>
            {isSchedule && (
              <Form.Item label="Schedule at">
                <DatePicker
                  disabledDate={(currentDate) => currentDate && currentDate < moment().endOf('day')}
                  defaultValue={scheduledAt}
                  onChange={this.onSchedule.bind(this)}
                />
              </Form.Item>
            )}
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Video File"
              help={previewVideo ? (
                <a href={previewVideo} target="_blank" rel="noreferrer">
                  Click here to preview video
                </a>
              ) : null}
            >
              <Upload
                customRequest={() => false}
                listType="picture-card"
                className="avatar-uploader"
                accept="video/*"
                multiple={false}
                showUploadList={false}
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'video')}
              >
                {isSelectedVideo ? <FileDoneOutlined /> : <VideoCameraAddOutlined />}
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Teaser file"
              help={previewTeaser ? (
                <a href={previewTeaser} target="_blank" rel="noreferrer">
                  Click here to preview teaser
                </a>
              ) : null}
            >
              <Upload
                customRequest={() => false}
                listType="picture-card"
                className="avatar-uploader"
                accept="video/*"
                multiple={false}
                showUploadList={false}
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'teaser')}
              >
                {isSelectedTeaser ? <FileDoneOutlined /> : <VideoCameraAddOutlined />}
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Thumbnail"
              help={previewThumbnail ? (
                <a href={previewThumbnail} target="_blank" rel="noreferrer">
                  Click here to preview thumbnail
                </a>
              ) : null}
            >
              <Upload
                listType="picture-card"
                className="avatar-uploader"
                accept="image/*"
                multiple={false}
                showUploadList
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'thumbnail')}
              >
                <CameraOutlined />
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        {uploadPercentage ? (
          <Progress percent={Math.round(uploadPercentage)} />
        ) : null}
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" htmlType="submit" loading={uploading} disabled={uploading}>
            {haveVideo ? 'Update' : 'Upload'}
          </Button>
          <Button className="secondary" onClick={() => Router.back()} loading={uploading} disabled={uploading}>
            Back
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
