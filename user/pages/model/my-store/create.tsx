import { PureComponent } from 'react';
import Head from 'next/head';
import { message, Layout } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { productService } from '@services/product.service';
import Router from 'next/router';
import FormProduct from '@components/product/form-product';
import { IUIConfig, IPerformer } from 'src/interfaces';
import { connect } from 'react-redux';
import { getResponseError } from '@lib/utils';
import { injectIntl, IntlShape } from 'react-intl';

interface IFiles {
  fieldname: string;
  file: File;
}

interface IProps {
  ui: IUIConfig;
  user: IPerformer;
  intl: IntlShape;
}

class CreateProduct extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    uploading: false,
    uploadPercentage: 0
  };

  _files: {
    image: File;
    digitalFile: File;
  } = {
    image: null,
    digitalFile: null
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
    if (!this._files.image) {
      message.error(
        intl.formatMessage({
          id: 'pleaseUploadProductImage',
          defaultMessage: 'Please upload product image!'
        })
      );
      return;
    }
    if (data.type === 'digital' && !this._files.digitalFile) {
      message.error(
        intl.formatMessage({
          id: 'pleaseSelectDigitalFile',
          defaultMessage: 'Please select digital file!'
        })
      );
      return;
    }
    if (data.type === 'physical') {
      this._files.digitalFile = null;
    }

    const files = Object.keys(this._files).reduce((tmpFiles, key) => {
      if (this._files[key]) {
        tmpFiles.push({
          fieldname: key,
          file: this._files[key] || null
        });
      }
      return tmpFiles;
    }, [] as IFiles[]) as [IFiles];

    await this.setState({
      uploading: true
    });
    try {
      await productService.createProduct(
        files,
        data,
        this.onUploading.bind(this)
      );
      message.success(
        intl.formatMessage({
          id: 'newProductWasSuccessfullyCreated',
          defaultMessage: 'New product was successfully created'
        })
      );
      Router.push('/model/my-store');
    } catch (error) {
      message.error(
        getResponseError(error)
          || intl.formatMessage({
            id: 'somethingWentWrong',
            defaultMessage: 'Something went wrong, please try again!'
          })
      );
      this.setState({
        uploading: false
      });
    }
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    const { ui, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'newProduct',
              defaultMessage: 'New Product'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'newProduct',
              defaultMessage: 'New Product'
            })}
            icon={<ShopOutlined />}
          />
          <FormProduct
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
export default injectIntl(connect(mapStates)(CreateProduct));
