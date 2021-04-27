/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import Head from 'next/head';
import { PureComponent, Fragment, createRef } from 'react';
import {
  Form, message, Button, Select, Col, Row, Upload
} from 'antd';
import Page from '@components/common/layout/page';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';
import { UploadOutlined } from '@ant-design/icons';
import { photoService } from '@services/photo.service';
import UploadList from '@components/file/upload-list';
import { SelectGalleryDropdown } from '@components/gallery/common/select-gallery-dropdown';
import Router from 'next/router';
import env from 'src/env';

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

  async beforeUpload(upFile, fileList) {
    await Promise.all(
      fileList.map((file) => {
        // const ext = file.name.split('.').pop().toLowerCase();
        // const isImageAccept = env.imageAccept
        //   .split(',')
        //   .map((item: string) => item.trim())
        //   .indexOf(`.${ext}`);
        const isMaxSize = file.size / 1024 / 1024 < (env.maximumSizeUploadImage || 5);
        if (!isMaxSize) {
          fileList.splice(
            fileList.findIndex((f) => f.uid === file.uid),
            1
          );
        }
        return file;
      })
    );
    await this.setState({ fileList });
    return false;
  }

  remove(file) {
    const { fileList } = this.state;
    fileList.splice(
      fileList.findIndex((f) => f.uid === file.uid),
      1
    );
    this.setState({ fileList });
    this.forceUpdate();
  }

  async submit(data: any) {
    const { fileList } = this.state;
    if (!fileList.length) {
      return message.error('Please select photo!');
    }

    const uploadFiles = fileList.filter((f) => !['uploading', 'done'].includes(f.status));
    if (!uploadFiles.length) return message.error('Please select new file!');

    await this.setState({ uploading: true });

    for (const file of uploadFiles) {
      try {
        if (['uploading', 'done'].includes(file.status)) continue;
        file.status = 'uploading';
        photoService.uploadPhoto(file, data, this.onUploading.bind(this, file));
      } catch (e) {
        file.status = 'error';
        message.error(`File ${file.name} error!`);
      }
    }
    message.success('Photos has been uploaded!');
    Router.push('/photos');
    return undefined;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { uploading, fileList, selectedPerformerId } = this.state;
    const { galleryId } = this.props;
    return (
      <>
        <Head>
          <title>Upload photo</title>
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
            <Row className="ant-form-item">
              <Col span={4} className="ant-form-item-label">
                <label className="ant-form-item-required">Photos</label>
              </Col>
              <Col span={16}>
                <div>
                  <Dragger
                    accept="image/*"
                    beforeUpload={this.beforeUpload.bind(this)}
                    multiple
                    showUploadList={false}
                    disabled={uploading}
                    listType="picture"
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">Support image file only</p>
                  </Dragger>

                  <UploadList files={fileList} remove={this.remove.bind(this)} />
                </div>
              </Col>
            </Row>

            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
              <Button type="primary" htmlType="submit" loading={uploading} disabled={uploading}>
                Upload
              </Button>
            </Form.Item>
          </Form>
        </Page>
      </>
    );
  }
}

export default BulkUploadPhoto;
