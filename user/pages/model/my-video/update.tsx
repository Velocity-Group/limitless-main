import { PureComponent } from 'react';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import { connect } from 'react-redux';
import { videoService } from '@services/video.service';
import { VideoCameraOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { FormUploadVideo } from '@components/video/form-upload';
import { IVideoUpdate, IUIConfig, IUser } from 'src/interfaces';
import Router from 'next/router';
import { Layout, message, Spin } from 'antd';
import { getResponseError } from '@lib/utils';

interface IProps {
  id: string;
  ui: IUIConfig;
  user: IUser;
}
class VideoUpdate extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    submiting: false,
    fetching: true,
    video: {} as IVideoUpdate
  };

  async componentDidMount() {
    try {
      const { id } = this.props;
      const resp = await videoService.findById(id);
      this.setState({ video: resp.data });
    } catch (e) {
      message.error('Video not found!');
      Router.back();
    } finally {
      this.setState({ fetching: false });
    }
  }

  async submit(data: any) {
    try {
      const { id } = this.props;
      const submitData = { ...data };
      if (
        (data.isSale && !data.price)
        || (data.isSale && data.price < 1)
      ) {
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
      await this.setState({ submiting: true });
      await videoService.update(id, submitData);
      message.success('Changes saved.');
      Router.push('/model/my-video');
    } catch (e) {
      // TODO - check and show error here
      message.error(
        getResponseError(e) || 'Something went wrong, please try again!'
      );
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const { video, submiting, fetching } = this.state;
    const { ui, user } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Edit Video
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <PageHeading title="Edit Video" icon={<VideoCameraOutlined />} />
            <div className="page-heading">
              <span>Edit Video</span>
            </div>
            {!fetching && video && (
              <FormUploadVideo
                user={user}
                video={video}
                submit={this.submit.bind(this)}
                uploading={submiting}
              />
            )}
            {fetching && <div className="text-center"><Spin /></div>}
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
export default connect(mapStates)(VideoUpdate);
