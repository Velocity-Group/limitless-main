/* eslint-disable jsx-a11y/label-has-associated-control */
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
import { CameraOutlined } from '@ant-design/icons';
import { performerService } from '@services/index';
import moment from 'moment';
import './video.less';
import { debounce } from 'lodash';

interface IProps {
  user?: IUser;
  video?: IVideoUpdate;
  submit?: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};

const { Option } = Select;

const validateMessages = {
  required: 'This field is required!'
};

export class FormUploadVideo extends PureComponent<IProps> {
  state = {
    previewThumbnail: null,
    previewVideo: null,
    isSale: false,
    isSchedule: false,
    scheduledAt: moment(),
    performers: []
  };

  formRef: any;

  componentDidMount() {
    const { video } = this.props;
    if (video) {
      this.setState(
        {
          previewThumbnail: video.thumbnail ? video.thumbnail : null,
          previewVideo: video.video && video.video.url ? video.video.url : null,
          isSale: video.isSaleVideo,
          isSchedule: video.isSchedule,
          scheduledAt: video.scheduledAt ? moment(video.scheduledAt) : moment()
        }
      );
      this.getPerformers('', [video.participantIds]);
    }
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
      const resp = await (await performerService.search({ q, performerIds: performerIds || '' })).data;
      const performers = resp.data || [];
      this.setState({ performers });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
    }
  }, 500);

  beforeUpload(file: File, field: string) {
    const { beforeUpload: beforeUploadHandler } = this.props;
    return beforeUploadHandler(file, field);
  }

  render() {
    const {
      video, submit, uploading, uploadPercentage, user
    } = this.props;
    const {
      previewThumbnail,
      previewVideo,
      performers,
      isSale,
      isSchedule,
      scheduledAt
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
            price: 0,
            description: '',
            tags: [],
            isSaleVideo: false,
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
              labelCol={{ span: 24 }}
              name="title"
              rules={[
                { required: true, message: 'Please input title of video!' }
              ]}
            >
              <Input placeholder="Enter video title" />
            </Form.Item>
            <Form.Item label="Tag" labelCol={{ span: 24 }} name="tags">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                size="middle"
                showArrow={false}
                defaultActiveFirstOption={false}
                placeholder="Add Tags here"
              />
            </Form.Item>
            <Form.Item
              label="Participants"
              labelCol={{ span: 24 }}
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
                      {p.name}
                      /
                      {p.username}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="isSaleVideo"
              label="For Sale?"
              labelCol={{ span: 24 }}
            >
              <Switch
                checked={isSale}
                onChange={this.onSwitch.bind(this, 'saleVideo')}
              />
            </Form.Item>
            {isSale && (
              <Form.Item name="price" label="Price $" labelCol={{ span: 24 }}>
                <InputNumber min={1} />
              </Form.Item>
            )}
            <Form.Item
              name="isSchedule"
              label="Schedule activate time while status 'Inactive'"
              labelCol={{ span: 24 }}
            >
              <Switch
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
          <Col md={12} xs={24}>
            <Form.Item
              name="description"
              label="Description"
              labelCol={{ span: 24 }}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            {(!haveVideo || (haveVideo && video.thumbnail)) && (
            <div key="thumbnail" className="ant-form-item">
              <label>Thumbnail</label>
              <Upload
                listType="picture-card"
                className="avatar-uploader"
                accept="image/*"
                multiple={false}
                showUploadList
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'thumbnail')}
              >
                {previewThumbnail ? (
                  <img
                    src={previewThumbnail}
                    alt="file"
                    style={{ width: '100px' }}
                  />
                ) : <CameraOutlined />}
              </Upload>
            </div>
            )}
            <Form.Item label="Video File" labelCol={{ span: 24 }}>
              {!previewVideo && (
              <Upload
                listType="picture-card"
                className="avatar-uploader"
                accept="video/*,.mkv"
                multiple={false}
                showUploadList
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'video')}
              >
                <CameraOutlined />
              </Upload>
              )}
              {previewVideo && <a href={previewVideo} rel="noreferrer" target="_blank">Click to view</a>}
              {uploadPercentage ? (
                <Progress percent={Math.round(uploadPercentage)} />
              ) : null}
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              labelCol={{ span: 24 }}
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
        </Row>

        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button className="primary" htmlType="submit" loading={uploading} disabled={uploading}>
            {haveVideo ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
