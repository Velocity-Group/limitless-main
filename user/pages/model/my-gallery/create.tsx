import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import FormGallery from '@components/gallery/form-gallery';
import PageHeading from '@components/common/page-heading';
import { IGalleryCreate, IUIConfig } from 'src/interfaces';
import { galleryService } from 'src/services';
import { getResponseError } from '@lib/utils';
import Router from 'next/router';
import { connect } from 'react-redux';

interface IProps {
  ui: IUIConfig;
}

interface IStates {
  submiting: boolean;
}

class GalleryCreatePage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  constructor(props: IProps) {
    super(props);
    this.state = {
      submiting: false
    };
  }

  async onFinish(data: IGalleryCreate) {
    try {
      await this.setState({ submiting: true });
      const resp = await galleryService.create(data);
      message.success('Created success!');
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
          <Page>
            <PageHeading title="New Gallery" icon={<PictureOutlined />} />
            <FormGallery
              submiting={submiting}
              onFinish={this.onFinish.bind(this)}
            />
          </Page>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui }
});
export default connect(mapStates)(GalleryCreatePage);
