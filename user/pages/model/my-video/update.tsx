import { PureComponent } from 'react';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import { connect } from 'react-redux';
import { videoService } from '@services/video.service';
import { FormUploadVideo } from '@components/video/form-upload';
import { IVideoUpdate, IUIConfig, IUser } from 'src/interfaces';
import Loader from '@components/common/base/loader';
import Router from 'next/router';
import { Layout, message } from 'antd';
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
    } finally {
      this.setState({ fetching: false });
    }
  }

  async submit(data: any) {
    try {
      const { id } = this.props;
      if (
        (data.isSale && !data.price)
        || (data.isSale && data.price < 1)
      ) {
        return message.error('Invalid price');
      }
      if (data.isSchedule && !data.scheduledAt) {
        return message.error('Invalid schedule date');
      }
      this.setState({ submiting: true });
      const submitData = {
        ...data
      };

      await videoService.update(id, submitData);
      this.setState({ submiting: false });
      message.success('Changes saved.');
      return Router.push('/model/my-video');
    } catch (e) {
      // TODO - check and show error here
      message.error(
        getResponseError(e) || 'Something went wrong, please try again!'
      );
      return this.setState({ submiting: false });
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
            | Update Video
          </title>
        </Head>

        <div className="main-container">
          <Page>
            <div className="page-heading">
              <span>Video Update</span>
            </div>
            {fetching ? (
              <Loader />
            ) : (
              <FormUploadVideo
                user={user}
                video={video}
                submit={this.submit.bind(this)}
                uploading={submiting}
              />
            )}
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
