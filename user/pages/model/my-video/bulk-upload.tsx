import { PureComponent, createRef } from 'react';
import Head from 'next/head';
import {
  Form, message, Layout, Button, Upload
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { FormInstance } from 'antd/lib/form';
import VideoUploadList from '@components/file/video-upload-list';
import { videoService } from '@services/video.service';
import { connect } from 'react-redux';
import Router from 'next/router';
import { IUIConfig, IPerformer } from 'src/interfaces';
import { getGlobalConfig } from '@services/config';

interface IProps {
  ui: IUIConfig;
  user: IPerformer
}

const validateMessages = {
  required: 'This field is required!'
};
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const { Dragger } = Upload;

class BulkUploadVideo extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    uploading: false,
    fileList: []
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { user } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning('Your ID documents are not verified yet! You could not post any content right now.');
      Router.back();
    }
    if (!user?.stripeAccount?.payoutsEnabled || !user?.stripeAccount?.detailsSubmitted) {
      message.warning('You have not connected with stripe. So you cannot post any content right now!');
      Router.push('/model/banking');
    }
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

  async submit() {
    const { fileList } = this.state;
    const { user } = this.props;
    const uploadFiles = fileList.filter((f) => !['uploading', 'done'].includes(f.status));
    if (!uploadFiles.length) {
      message.error('Please select videos');
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
            participantIds: [user._id],
            isSale: false,
            isSchedule: false,
            status: 'inactive'
          },
          this.onUploading.bind(this, file)
        );
        file.status = 'done';
      } catch (e) {
        file.status = 'error';
        message.error(`File ${file.name} error!`);
      }
    }
    message.success('Videos have been uploaded!');
    Router.push('/model/my-video');
  }

  render() {
    const { uploading, fileList } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Upload Videos
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="Upload Videos" icon={<UploadOutlined />} />
          <Form
            {...layout}
            onFinish={this.submit.bind(this)}
            validateMessages={validateMessages}
            ref={this.formRef}
          >
            <Form.Item>
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
                <p className="ant-upload-text">
                  Click here or drag & drop your VIDEO files to this area to upload
                </p>
              </Dragger>
            </Form.Item>
            <VideoUploadList
              files={fileList}
              remove={this.remove.bind(this)}
            />
            <Form.Item>
              <Button
                className="secondary"
                htmlType="submit"
                loading={uploading}
                disabled={uploading || !fileList.length}
              >
                UPLOAD ALL
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current
});
export default connect(mapStates)(BulkUploadVideo);
