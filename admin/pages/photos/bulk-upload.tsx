import Head from 'next/head';
import { PureComponent, createRef } from 'react';
import {
  Form, message, Button, Select, Upload
} from 'antd';
import Page from '@components/common/layout/page';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';
import { UploadOutlined } from '@ant-design/icons';
import { photoService } from '@services/photo.service';
import { SelectGalleryDropdown } from '@components/gallery/common/select-gallery-dropdown';
import Router from 'next/router';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

const { Dragger } = Upload;
interface IProps {
  galleryId: string;
}
class BulkUploadPhoto extends PureComponent<IProps> {
  state = {
    uploading: false,
    fileList: [],
    selectedPerformerId: ''
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  onUploading(file, resp: any) {
    const data = file;
    data.percent = resp.percentage;
    if (file.percent === 100) data.status = 'done';
    this.forceUpdate();
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
    if (field === 'performerId') this.setState({ selectedPerformerId: val });
  }

  async beforeUpload(file, fileList) {
    if (file.size / 1024 / 1024 > (process.env.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5)) {
      message.error(`${file.name} is over ${process.env.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB`);
    }
    this.setState({
      fileList: fileList.filter((f) => f.size / 1024 / 1024 < (process.env.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5))
    });
  }

  remove(file) {
    const { fileList } = this.state;
    this.setState({ fileList: fileList.filter((f) => f.uid !== file.uid) });
  }

  async submit(data: any) {
    const { fileList } = this.state;
    const uploadFiles = fileList.filter((f) => !['uploading', 'done'].includes(f.status));
    if (!uploadFiles.length) {
      message.error('Please select photos');
      return;
    }

    await this.setState({ uploading: true });
    // eslint-disable-next-line no-restricted-syntax
    for (const file of uploadFiles) {
      try {
        if (['uploading', 'done'].includes(file.status)) return;
        file.status = 'uploading';
        photoService.uploadPhoto(file, data, this.onUploading.bind(this, file));
      } catch (e) {
        file.status = 'error';
        message.error(`File ${file.name} error!`);
      }
    }
    message.success('Photos have been uploaded!');
    Router.push('/gallery');
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { uploading, selectedPerformerId } = this.state;
    const { galleryId } = this.props;
    return (
      <>
        <Head>
          <title>Upload photos</title>
        </Head>
        <Page>
          <Form
            {...layout}
            onFinish={this.submit.bind(this)}
            validateMessages={validateMessages}
            ref={this.formRef}
            initialValues={{
              status: 'active',
              performerId: selectedPerformerId,
              galleryId: galleryId || ''
            }}
          >
            <Form.Item name="performerId" label="Performer" rules={[{ required: true }]}>
              <SelectPerformerDropdown
                onSelect={(val) => this.setFormVal('performerId', val)}
                disabled={uploading}
                defaultValue=""
              />
            </Form.Item>
            <Form.Item
              name="galleryId"
              label="Gallery"
              rules={[{ required: true, message: 'Please select a gallery' }]}
            >
              <SelectGalleryDropdown
                performerId={selectedPerformerId}
                disabled={uploading || !selectedPerformerId}
                onSelect={(val) => this.setFormVal('galleryId', val)}
                defaultValue={galleryId || ''}
              />
            </Form.Item>
            <Form.Item name="status" label="Default status" rules={[{ required: true }]}>
              <Select disabled={uploading}>
                <Select.Option key="active" value="active">
                  Active
                </Select.Option>
                <Select.Option key="inactive" value="inactive">
                  Inactive
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Dragger
                accept="image/*"
                beforeUpload={this.beforeUpload.bind(this)}
                multiple
                showUploadList
                disabled={uploading}
                listType="picture"
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag-drop file to this area to upload</p>
                <p className="ant-upload-hint">Photo is 5MB or below</p>
              </Dragger>
            </Form.Item>
            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
              <Button type="primary" htmlType="submit" loading={uploading} disabled={uploading}>
                UPLOAD ALL
              </Button>
            </Form.Item>
          </Form>
        </Page>
      </>
    );
  }
}

export default BulkUploadPhoto;
