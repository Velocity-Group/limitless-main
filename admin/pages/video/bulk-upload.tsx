import Head from 'next/head';
import { PureComponent, createRef } from 'react';
import {
  message, Form, Upload, Button
} from 'antd';
import Page from '@components/common/layout/page';
import { videoService } from '@services/video.service';
import Router from 'next/router';
import { BreadcrumbComponent } from '@components/common';
import { FormInstance } from 'antd/lib/form';
import { UploadOutlined } from '@ant-design/icons';
import VideoUploadList from '@components/file/video-upload-list';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { getGlobalConfig } from '@services/config';

const { Dragger } = Upload;

const validateMessages = {
  required: 'This field is required!'
};

interface IProps {
  performerId: string;
}

class BulkUploadVideo extends PureComponent<IProps> {
  state = {
    uploading: false,
    fileList: []
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  onUploading(file, resp: any) {
    // eslint-disable-next-line no-param-reassign
    file.percent = resp.percentage;
    this.forceUpdate();
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  beforeUpload(file, listFile) {
    const config = getGlobalConfig();
    if (file.size / 1024 / 1024 > (config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000)) {
      message.error(`${file.name} is over ${config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000}MB`);
      return false;
    }
    const { fileList } = this.state;
    this.setState({
      fileList: [...fileList, ...listFile.filter((f) => f.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_VIDEO || 2000))]
    });
    return true;
  }

  remove(file) {
    const { fileList } = this.state;
    this.setState({ fileList: fileList.filter((f) => f.uid !== file.uid) });
  }

  async submit(formValues: any) {
    const { fileList } = this.state;
    const uploadFiles = fileList.filter((f) => !['uploading', 'done'].includes(f.status));
    if (!uploadFiles.length) {
      message.error('Please select new video!');
      return;
    }
    await this.setState({ uploading: true });
    // eslint-disable-next-line no-restricted-syntax
    for (const file of uploadFiles) {
      try {
        // eslint-disable-next-line no-continue
        if (['uploading', 'done'].includes(file.status)) continue;
        file.status = 'uploading';
        // eslint-disable-next-line no-await-in-loop
        await videoService.uploadVideo(
          [
            {
              fieldname: 'video',
              file
            }
          ],
          {
            title: file.name,
            price: 0,
            description: '',
            tags: [],
            isSale: false,
            isSchedule: false,
            status: 'inactive',
            participantIds: [formValues.performerId],
            performerId: formValues.performerId
          },
          this.onUploading.bind(this, file)
        );
        file.status = 'done';
      } catch (e) {
        message.error(`File ${file.name} error!`);
        file.status = 'error';
      }
    }
    message.success('Files has been uploaded!');
    Router.push('/video');
  }

  render() {
    const { uploading, fileList } = this.state;
    const { performerId } = this.props;
    if (!this.formRef) this.formRef = createRef();
    return (
      <>
        <Head>
          <title>Bulk upload video</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Videos', href: '/video' }, { title: 'Bulk upload video' }]} />
        <Page>
          <Form
            layout="vertical"
            onFinish={this.submit.bind(this)}
            validateMessages={validateMessages}
            ref={this.formRef}
            initialValues={{
              status: 'inactive',
              performerId: performerId || ''
            }}
          >
            <Form.Item name="performerId" label="Model" rules={[{ required: true }]}>
              <SelectPerformerDropdown
                onSelect={(val) => this.setFormVal('performerId', val)}
                disabled={uploading}
                defaultValue={performerId || ''}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ span: 24 }}>
              <Dragger
                accept="video/*"
                beforeUpload={this.beforeUpload.bind(this)}
                multiple
                showUploadList={false}
                disabled={uploading}
                listType="picture"
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag and drop files to this area to upload video file only</p>
              </Dragger>
              <VideoUploadList files={fileList} remove={this.remove.bind(this)} />
            </Form.Item>
            <Form.Item className="text-center">
              <Button type="primary" htmlType="submit" loading={uploading} disabled={uploading || !fileList.length}>
                UPLOAD ALL
              </Button>
            </Form.Item>
          </Form>
        </Page>
      </>
    );
  }
}

export default BulkUploadVideo;
