import { PureComponent } from 'react';
import { Layout, message, Spin } from 'antd';
import Head from 'next/head';
import FormGallery from '@components/gallery/form-gallery';
import {
  IGallery, IGalleryCreate, IPhotos, IUIConfig
} from 'src/interfaces';
import Page from '@components/common/layout/page';
import { galleryService } from 'src/services';
import Router from 'next/router';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import { photoService } from '@services/index';

interface IProps {
  id: string;
  ui: IUIConfig;
}

interface IStates {
  submiting: boolean;
  gallery: IGallery;
  loading: boolean;
  photos: IPhotos[];
}

class GalleryUpdatePage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      submiting: false,
      gallery: null,
      loading: true,
      photos: []
    };
  }

  componentDidMount() {
    this.getData();
  }

  async onFinish(data: IGalleryCreate) {
    try {
      const { id } = this.props;
      await this.setState({ submiting: true });
      if (!data.isSale) {
        // eslint-disable-next-line no-param-reassign
        data.price = 0;
      }
      await galleryService.update(id, data);
      message.success('Changes saved.');
    } catch (e) {
      message.error(getResponseError(e));
    } finally {
      this.setState({ submiting: false });
      Router.push('/model/my-gallery');
    }
  }

  async getData() {
    try {
      const { id } = this.props;
      await this.setState({ loading: true });
      const [gallery, photos] = await Promise.all([
        galleryService.findById(id),
        photoService.searchPhotosInGallery({ galleryId: id })
      ]);
      await this.setState({ gallery: gallery.data, photos: photos.data.data });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      Router.back();
    } finally {
      this.setState({ loading: false });
    }
  }

  async removePhoto(id: string) {
    if (window.confirm('Are you sure to delete this photo!')) {
      try {
        await this.setState({ submiting: true });
        const { photos } = this.state;
        await photoService.delete(id);
        message.success('Delete successfully');
        this.setState({ photos: photos.filter((p) => p._id !== id) });
      } catch (error) {
        message.error(getResponseError(await error));
      } finally {
        this.setState({ submiting: false });
      }
    }
  }

  render() {
    const { ui } = this.props;
    const {
      gallery, submiting, loading, photos
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui && ui.siteName}
            {' '}
            | Update Gallery
            {' '}
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading">
              <span>Update Gallery</span>
            </div>
            {loading && (
              <div style={{
                margin: 20, display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}
              >
                <Spin />
              </div>
            )}
            {!loading && gallery && (
            <FormGallery
              gallery={gallery}
              onFinish={this.onFinish.bind(this)}
              submiting={submiting}
              removePhoto={this.removePhoto.bind(this)}
              photosList={photos}
            />
            )}
          </Page>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(GalleryUpdatePage);
