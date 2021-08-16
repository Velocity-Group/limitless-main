/* eslint-disable jsx-a11y/label-has-associated-control */
import { PureComponent, createRef, Fragment } from 'react';
import {
  Form, Input, Select, Upload, Button, message, Progress
} from 'antd';
import { IBannerUpdate, IBannerCreate } from 'src/interfaces';
import { UploadOutlined } from '@ant-design/icons';
import { FormInstance } from 'antd/lib/form';
import { ThumbnailBanner } from '@components/banner/thumbnail-banner';
import env from 'src/env';

interface IProps {
  banner?: IBannerUpdate;
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

export class FormUploadBanner extends PureComponent<IProps> {
  state = {
    preview: null
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  beforeUpload(file) {
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
      banner, submit, uploading, uploadPercentage
    } = this.props;
    const { preview } = this.state;
    const haveBanner = !!banner;
    return (
      <Form
        {...layout}
        onFinish={submit && submit.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-upload-banner"
        ref={this.formRef}
        validateMessages={validateMessages}
        initialValues={
          banner || ({
            title: '',
            description: '',
            status: 'active',
            position: 'top'
          } as IBannerCreate)
        }
      >
        <Form.Item name="title" rules={[{ required: true, message: 'Please input title of banner!' }]} label="Title">
          <Input placeholder="Enter banner title" />
        </Form.Item>
        <Form.Item name="position" label="Position" rules={[{ required: true, message: 'Please select position!' }]}>
          <Select>
            <Select.Option key="top" value="top">
              Top
            </Select.Option>
            {/* <Select.Option key="bottom" value="bottom">
              Bottom
            </Select.Option>
            <Select.Option key="left" value="left">
              Left
            </Select.Option>
            <Select.Option key="right" value="right">
              Right
            </Select.Option>
            <Select.Option key="middle" value="middle">
              Middle
            </Select.Option> */}
          </Select>
        </Form.Item>
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
              <label>Banner </label>
            </div>
            <div className="ant-col ant-col-16 ant-form-item-control">
              <p>Ratio dimension 4:1 (eg: 1600px:400px)</p>
              {!haveBanner ? (
                <>
                  <Upload
                    accept={'image/*'}
                    multiple={false}
                    showUploadList={false}
                    disabled={uploading || haveBanner}
                    beforeUpload={(file) => this.beforeUpload(file)}
                  >
                    {preview ? <img src={preview} alt="file" style={{ width: '250px', marginBottom: '10px' }} /> : null}
                    <div style={{ clear: 'both' }} />
                    {!haveBanner && (
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
                <ThumbnailBanner banner={banner} style={{ width: '250px' }} />
              )}
              <div className="ant-form-item-explain">
                <div>
                  Image must smaller than
                  {' '}
                  {env.maximumSizeUploadImage || 5}
                  {' '}
                  MB!
                </div>
              </div>
            </div>
          </div>
        </>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={uploading}>
            {haveBanner ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
