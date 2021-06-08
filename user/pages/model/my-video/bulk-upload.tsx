import { PureComponent, createRef } from 'react';
import Head from 'next/head';
import {
  Form, message, Layout, Button, Col, Row, Upload
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Page from '@components/common/layout/page';
import { FormInstance } from 'antd/lib/form';
import VideoUploadList from '@components/file/video-upload-list';
import { videoService } from '@services/video.service';
import { connect } from 'react-redux';
import Router from 'next/router';
import { IUIConfig, IUser } from 'src/interfaces';

interface IProps {
  ui: IUIConfig;
  user: IUser
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
    // preview: null,
    // uploadPercentage: 0,
    fileList: []
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  onUploading(file, resp: any) {
    // eslint-disable-next-line no-param-reassign
    file.percent = resp.percentage;
    // eslint-disable-next-line no-param-reassign
    if (file.percent === 100) file.status = 'done';
    this.forceUpdate();
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  beforeUpload(file, fileList) {
    this.setState({ fileList });
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

  async submit() {
    const { fileList } = this.state;
    const { user } = this.props;
    if (!fileList.length) {
      return message.error('Please select video!');
    }

    const uploadFiles = fileList.filter(
      (f) => !['uploading', 'done'].includes(f.status)
    );
    if (!uploadFiles.length) return message.error('Please select new video!');

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
      } catch (e) {
        message.error(`File ${file.name} error!`);
      }
    }
    message.success('Files has been uploaded!');
    Router.push('/model/my-video');
    return undefined;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { uploading, fileList } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Upload videos
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <PageHeading title="Upload Videos" icon={<UploadOutlined />} />
            <Form
              {...layout}
              onFinish={this.submit.bind(this)}
              validateMessages={validateMessages}
              ref={this.formRef}
            >
              <Row className="ant-form-item">
                <Col span={24}>
                  <div>
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
                        Click or drag-drop files to this area to upload
                      </p>
                      <p className="ant-upload-hint">
                        Support video format only
                      </p>
                    </Dragger>

                    <VideoUploadList
                      files={fileList}
                      remove={this.remove.bind(this)}
                    />
                  </div>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  className="secondary"
                  htmlType="submit"
                  loading={uploading}
                  disabled={uploading || !fileList.length}
                >
                  Upload
                </Button>
              </Form.Item>
            </Form>
          </Page>
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
