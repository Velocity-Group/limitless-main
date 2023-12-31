import { PureComponent } from 'react';
import Head from 'next/head';
import { connect } from 'react-redux';
import { message, Layout } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { videoService } from '@services/video.service';
import FormUploadVideo from '@components/video/form-upload';
import Router from 'next/router';
import { IUIConfig, IPerformer } from 'src/interfaces';
import { getResponseError } from '@lib/utils';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  user: IPerformer;
  intl: IntlShape;
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

  componentDidMount() {
    const { user, intl } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning(
        intl.formatMessage({
          id: 'yourIdDocumentsAreNotVerifiedYet',
          defaultMessage:
            'Your ID documents are not verified yet! You could not post any content right now.'
        })
      );
      Router.back();
    }
  }

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    const { intl } = this.props;
    if (!this._files.video) {
      message.error(
        intl.formatMessage({
          id: 'pleaseSelectVideo',
          defaultMessage: 'Please select video!'
        })
      );
      return;
    }
    const submitData = { ...data };
    if ((data.isSale && !data.price) || (data.isSale && data.price < 1)) {
      message.error(
        intl.formatMessage({
          id: 'invalidAmountOfTokens',
          defaultMessage: 'Invalid amount of tokens'
        })
      );
      return;
    }
    if (data.isSchedule && !data.scheduledAt) {
      message.error(
        intl.formatMessage({
          id: 'invalidScheduleDate',
          defaultMessage: 'Invalid schedule date'
        })
      );
      return;
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
      message.success(
        intl.formatMessage({
          id: 'videosHaveBeenUploaded',
          defaultMessage: 'Videos have been uploaded!'
        })
      );
      Router.replace('/model/my-video');
    } catch (error) {
      message.error(
        getResponseError(error)
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    } finally {
      this.setState({ uploading: false });
    }
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    const { ui, user, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'uploadVideo',
              defaultMessage: 'Upload Video'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'uploadVideo',
              defaultMessage: 'Upload Video'
            })}
            icon={<VideoCameraOutlined />}
          />
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
  user: state.user.current,
  settings: state.settings
});
export default injectIntl(connect(mapStates)(UploadVideo));
