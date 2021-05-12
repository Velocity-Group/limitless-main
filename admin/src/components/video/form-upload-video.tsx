/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/label-has-associated-control */
import { PureComponent, createRef } from 'react';
import {
  Form, Input, InputNumber, Select, Upload, Button,
  message, Progress, Switch, DatePicker
} from 'antd';
import { IVideoCreate, IVideoUpdate } from 'src/interfaces';
import { CameraOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';
import { ThumbnailVideo } from '@components/video/thumbnail-video';
import env from 'src/env';
import moment from 'moment';

interface IProps {
  video?: IVideoUpdate;
  submit?: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

export class FormUploadVideo extends PureComponent<IProps> {
  state = {
    previewThumbnail: null,
    previewTeaserVideo: null,
    previewVideo: null,
    isSchedule: false,
    isSale: false,
    scheduledAt: moment()
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { video } = this.props;
    if (video) {
      this.setState(
        {
          previewThumbnail: video.thumbnail ? video.thumbnail : null,
          previewTeaserVideo: video.teaser ? video.teaser : null,
          previewVideo: video.video && video.video.url ? video.video.url : null,
          isSchedule: video.isSchedule,
          isSale: video.isSale,
          scheduledAt: video.scheduledAt ? moment(video.scheduledAt) : moment()
        }
      );
    }
  }

  onSchedule(val: any) {
    this.setState({
      scheduledAt: val
    });
  }

  onSwitch(field: string, checked: boolean) {
    if (field === 'scheduling') {
      this.setState({
        isSchedule: checked
      });
    }
    if (field === 'isSale') {
      this.setState({
        isSale: checked
      });
    }
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  beforeUpload(file: File, field: string) {
    const { beforeUpload: beforeUploadHandler } = this.props;
    return beforeUploadHandler(file, field);
  }

  render() {
    const { scheduledAt, isSchedule, isSale } = this.state;
    if (!this.formRef) this.formRef = createRef();
    const {
      video, submit, uploading, uploadPercentage
    } = this.props;
    const { previewThumbnail, previewVideo, previewTeaserVideo } = this.state;
    const haveVideo = !!(video && video.performerId);
    return (
      <Form
        {...layout}
        onFinish={(values: IVideoUpdate) => {
          const a = values;
          a.isSchedule = isSchedule;
          if (a.isSchedule) {
            a.scheduledAt = scheduledAt;
          }
          a.isSale = isSale;
          if (!a.isSale) {
            a.price = 0;
          }
          return submit && submit(values);
        }}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-upload"
        ref={this.formRef}
        validateMessages={validateMessages}
        initialValues={
          video || ({
            title: '',
            price: 1,
            description: '',
            status: 'active',
            performerId: '',
            isSale: false,
            participantIds: [],
            isSchedule: false,
            scheduledAt: null,
            tags: []
          } as IVideoCreate)
        }
      >
        <Form.Item name="performerId" label="Performer" rules={[{ required: true }]}>
          <SelectPerformerDropdown
            disabled={haveVideo}
            defaultValue={video && video.performerId}
            onSelect={(val) => this.setFormVal('performerId', val)}
          />
        </Form.Item>
        <Form.Item name="title" rules={[{ required: true, message: 'Please input title of video!' }]} label="Title">
          <Input placeholder="Enter video title" />
        </Form.Item>
        <Form.Item label="Tag" name="tags">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            size="middle"
            showArrow={false}
            defaultActiveFirstOption={false}
            placeholder="Add Tags"
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="isSale" label="PPV" valuePropName="checked">
          <Switch unCheckedChildren="Free Content" checkedChildren="PPV Content" onChange={this.onSwitch.bind(this, 'isSale')} />
        </Form.Item>
        {isSale && (
        <Form.Item name="price" label="Amount of Tokens">
          <InputNumber min={1} />
        </Form.Item>
        )}
        <Form.Item name="isSchedule" label="Scheduling?" valuePropName="checked">
          <Switch unCheckedChildren="Unscheduled" checkedChildren="Scheduling" onChange={this.onSwitch.bind(this, 'scheduling')} />
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
        <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status!' }]}>
          <Select>
            <Select.Option key="active" value="active">
              Active
            </Select.Option>
            <Select.Option key="inactive" value="inactive">
              Inactive
            </Select.Option>
          </Select>
        </Form.Item>
        <div key="thumbnail" className="ant-row ant-form-item">
          <div className="ant-col ant-col-4 ant-form-item-label">
            <label>Thumbnail</label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            {!haveVideo ? (
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
            ) : (
              <ThumbnailVideo video={video} style={{ width: '250px' }} />
            )}
            <div className="ant-form-item-explain">
              <div>
                Image must smaller than
                {' '}
                {env.maximumSizeUploadImage || 5}
                MB!
              </div>
            </div>
          </div>
        </div>
        <div key="teaser-video" className="ant-row ant-form-item">
          <div className="ant-col ant-col-4 ant-form-item-label">
            <label>Teaser Video</label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            {!previewTeaserVideo && (
            <Upload
              listType="picture-card"
              className="avatar-uploader"
              accept="video/*"
              multiple={false}
              showUploadList
              disabled={uploading || haveVideo}
              beforeUpload={(file) => this.beforeUpload(file, 'teaser')}
            >
              <VideoCameraAddOutlined />
            </Upload>
            )}
            {previewTeaserVideo && <p><a href={previewTeaserVideo} target="_blank" rel="noreferrer">Click to view</a></p>}
          </div>
        </div>
        <div key="video" className="ant-row ant-form-item">
          <div className="ant-col ant-col-4 ant-form-item-label">
            <label>Video</label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            {!previewVideo && (
              <Upload
                listType="picture-card"
                className="avatar-uploader"
                accept="video/*"
                multiple={false}
                showUploadList
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'video')}
              >
                <VideoCameraAddOutlined />
              </Upload>
            )}
            {previewVideo && <p><a href={previewVideo} target="_blank" rel="noreferrer">Click to view</a></p>}
            <div className="ant-form-item-explain">
              <div>
                Video must smaller than
                {' '}
                {env.maximumSizeUploadVideo || 2000}
                MB!
              </div>
            </div>
          </div>
        </div>
        <div>
          {uploadPercentage ? (
            <Progress percent={Math.round(uploadPercentage)} />
          ) : null}
        </div>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={uploading}>
            {haveVideo ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
