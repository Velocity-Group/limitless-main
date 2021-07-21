/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Head from 'next/head';
import { PureComponent, Fragment } from 'react';
import { message } from 'antd';
import Page from '@components/common/layout/page';
import { videoService } from '@services/video.service';
import Router from 'next/router';
import { BreadcrumbComponent } from '@components/common';
import { FormUploadVideo } from '@components/video/form-upload-video';
import { IVideoUpdate } from 'src/interfaces';

interface IFiles {
  fieldname: string;
  file: File;
}

interface IResponse {
  data: { _id: string };
}
class UploadVideo extends PureComponent {
  state = {
    uploading: false,
    uploadPercentage: 0
  };

  _files: {
    thumbnail: File;
    video: File;
    teaser: File;
  } = {
    thumbnail: null,
    video: null,
    teaser: null
  };

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: IVideoUpdate) {
    if (!this._files.video) {
      return message.error('Please select video!');
    }
    if (
      (data.isSale && !data.price) || (data.isSale && data.price < 1)
    ) {
      return message.error('Invalid amount of tokens');
    }
    data.tags = [...data.tags];
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
      const resp = (await videoService.uploadVideo(files as any, data, this.onUploading.bind(this))) as IResponse;
      message.success('Video has been uploaded');
      // TODO - process for response data?
      Router.push('/video');
    } catch (error) {
      message.error('An error occurred, please try again!');
      await this.setState({
        uploading: false
      });
    }
    return undefined;
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    return (
      <>
        <Head>
          <title>Upload video</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Video', href: '/video' }, { title: 'Upload new video' }]} />
        <Page>
          <FormUploadVideo
            submit={this.submit.bind(this)}
            beforeUpload={this.beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={uploadPercentage}
          />
        </Page>
      </>
    );
  }
}

export default UploadVideo;
