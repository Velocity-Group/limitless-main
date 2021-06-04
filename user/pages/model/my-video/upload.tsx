import { PureComponent } from 'react';
import Head from 'next/head';
import { connect } from 'react-redux';
import { message, Layout } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { videoService } from '@services/video.service';
import { FormUploadVideo } from '@components/video/form-upload';
import Router from 'next/router';
import { IUIConfig, IUser } from 'src/interfaces';
import { getResponseError } from '@lib/utils';

interface IProps {
  ui: IUIConfig;
  user: IUser;
}
interface IFiles {
  fieldname: string;
  file: File;
}

interface IResponse {
  data: { _id: string };
}

class UploadVideo extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    uploading: false,
    uploadPercentage: 0
  };

  _files: {
    thumbnail: File;
    teaser: File;
    video: File;
  } = {
    thumbnail: null,
    teaser: null,
    video: null
  };

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    if (!this._files.video) {
      message.error('Please select video!');
      return;
    }
    const submitData = { ...data };
    if ((data.isSale && !data.price) || (data.isSale && data.price < 1)) {
      message.error('Invalid amount of tokens');
      return;
    }
    if (data.isSchedule && !data.scheduledAt) {
      message.error('Invalid schedule date');
      return;
    }
    if (data.isSchedule && data.scheduledAt) {
      submitData.status = 'inactive';
    }
    submitData.tags = [...[], ...data.tags];
    submitData.participantIds = [...[], ...data.participantIds];
    const files = Object.keys(this._files).reduce((f, key) => {
      if (this._files[key]) {
        f.push({
          fieldname: key,
          file: this._files[key] || null
        });
      }
      return f;
    }, [] as IFiles[]) as [IFiles];

    await this.setState({
      uploading: true
    });
    try {
      (await videoService.uploadVideo(
        files,
        data,
        this.onUploading.bind(this)
      )) as IResponse;
      message.success('Video has been uploaded');
      Router.replace('/model/my-video');
    } catch (error) {
      message.error(
        getResponseError(error) || 'An error occurred, please try again!'
      );
    } finally {
      this.setState({ uploading: false });
    }
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    const { ui, user } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Upload Video
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="Upload Video" icon={<UploadOutlined />} />
          <FormUploadVideo
            user={user}
            submit={this.submit.bind(this)}
            beforeUpload={this.beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={uploadPercentage}
          />
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui,
  user: state.user.current
});
export default connect(mapStates)(UploadVideo);
