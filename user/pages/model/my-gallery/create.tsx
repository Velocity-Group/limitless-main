import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import Head from 'next/head';
import FormGallery from '@components/gallery/form-gallery';
import PageHeading from '@components/common/page-heading';
import { IPerformer, IUIConfig } from 'src/interfaces';
import { galleryService } from 'src/services';
import { getResponseError } from '@lib/utils';
import Router from 'next/router';
import { connect } from 'react-redux';

interface IProps {
  ui: IUIConfig;
  user: IPerformer;
}

interface IStates {
  submiting: boolean;
}

class GalleryCreatePage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    submiting: false
  };

  componentDidMount() {
    const { user } = this.props;
    if (!user.verifiedDocument) {
      message.warning('Your ID documents are not verified yet! You could not post any content right now.');
      Router.back();
    }
    if (!user?.stripeAccount?.payoutsEnabled || !user?.stripeAccount?.detailsSubmitted) {
      message.warning('You have not connected with stripe. So you cannot post any content right now!');
      Router.push('/model/banking');
    }
  }

  async onFinish(data) {
    try {
      await this.setState({ submiting: true });
      const resp = await galleryService.create(data);
      message.success('New gallery created successfully');
      Router.replace(`/model/my-gallery/update?id=${resp.data._id}`);
    } catch (e) {
      message.error(getResponseError(e) || 'An error occurred, please try again!');
    } finally {
      this.setState({ submiting: false });
    }
  }

  render() {
    const { ui } = this.props;
    const { submiting } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui && ui.siteName}
            {' '}
            | New Gallery
            {' '}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="New Gallery" icon={<PictureOutlined />} />
          <FormGallery
            submiting={submiting}
            onFinish={this.onFinish.bind(this)}
          />
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});
export default connect(mapStates)(GalleryCreatePage);
