/* eslint-disable jsx-a11y/label-has-associated-control */
import { PureComponent, createRef, Fragment } from 'react';
import {
  Form, Input, Select, Upload, Button, message, Progress
} from 'antd';
import { IPhotoUpdate, IPhotoCreate } from 'src/interfaces';
import { UploadOutlined } from '@ant-design/icons';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';
import { ThumbnailPhoto } from '@components/photo/thumbnail-photo';
import { SelectGalleryDropdown } from '@components/gallery/common/select-gallery-dropdown';
import env from 'src/env';

interface IProps {
  photo?: IPhotoUpdate;
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

export class FormUploadPhoto extends PureComponent<IProps> {
  state = {
    preview: null,
    selectedPerformerId: ''
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { photo } = this.props;
    if (photo) this.setState({ selectedPerformerId: photo.performerId });
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
    if (field === 'performerId') this.setState({ selectedPerformerId: val });
  }

  beforeUpload(file) {
    // const ext = file.name.split('.').pop().toLowerCase();
    // const isImageAccept = env.imageAccept
    //   .split(',')
    //   .map((item: string) => item.trim())
    //   .indexOf(`.${ext}`);
    // if (isImageAccept === -1) {
    //   message.error(`You can only upload ${env.imageAccept} file!`);
    //   return false;
    // }
    const { beforeUpload: handleUpload } = this.props;
    const isMaxSize = file.size / 1024 / 1024 < (env.maximumSizeUploadImage || 5);
    if (!isMaxSize) {
      message.error(`Image must be smaller than ${env.maximumSizeUploadImage || 5}MB!`);
      return false;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => this.setState({ preview: reader.result }));
    reader.readAsDataURL(file);
    handleUpload(file);
    return false;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const {
      photo, submit, uploading, uploadPercentage
    } = this.props;
    const { preview, selectedPerformerId } = this.state;
    const havePhoto = !!photo;
    return (
      <Form
        {...layout}
        onFinish={submit && submit.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-upload"
        ref={this.formRef}
        validateMessages={validateMessages}
        initialValues={
          photo || ({
            title: '',
            description: '',
            status: 'active',
            performerId: '',
            galleryId: ''
          } as IPhotoCreate)
        }
      >
        <Form.Item name="performerId" label="Performer" rules={[{ required: true }]}>
          <SelectPerformerDropdown
            disabled={havePhoto}
            defaultValue={selectedPerformerId || ''}
            onSelect={(val) => this.setFormVal('performerId', val)}
          />
        </Form.Item>
        <Form.Item name="galleryId" label="Gallery" rules={[{ required: true, message: 'Please select a gallery' }]}>
          <SelectGalleryDropdown
            disabled={uploading || !selectedPerformerId}
            defaultValue={photo && photo.galleryId ? photo.galleryId : ''}
            onSelect={(val) => this.setFormVal('galleryId', val)}
            performerId={selectedPerformerId}
          />
        </Form.Item>
        <Form.Item name="title" rules={[{ required: true, message: 'Please input title of photo!' }]} label="Title">
          <Input placeholder="Enter photo title" />
        </Form.Item>
        {/* <Form.Item name="token" label="Token">
          <InputNumber />
        </Form.Item> */}
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
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
        <>
          <div key="thumbnail" className="ant-row ant-form-item">
            <div className="ant-col ant-col-4 ant-form-item-label">
              <label>Photo</label>
            </div>
            <div className="ant-col ant-col-16 ant-form-item-control">
              {!havePhoto ? (
                <>
                  <Upload
                    accept={'image/*'}
                    multiple={false}
                    showUploadList={false}
                    disabled={uploading || havePhoto}
                    beforeUpload={(file) => this.beforeUpload(file)}
                  >
                    {preview ? <img src={preview} alt="file" style={{ width: '250px', marginBottom: '10px' }} /> : null}
                    <div style={{ clear: 'both' }} />
                    {!havePhoto && (
                      <Button>
                        <UploadOutlined />
                        {' '}
                        Select File
                      </Button>
                    )}
                  </Upload>
                  {uploadPercentage ? <Progress percent={uploadPercentage} /> : null}
                </>
              ) : (
                <ThumbnailPhoto photo={photo} style={{ width: '250px' }} />
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
        </>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={uploading}>
            {havePhoto ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
