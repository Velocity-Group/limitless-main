import { PureComponent } from 'react';
import Head from 'next/head';
import { message, Spin, Layout } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { productService } from '@services/product.service';
import { IProduct, IUIConfig } from 'src/interfaces';
import FormProduct from '@components/product/form-product';
import Router from 'next/router';
import { connect } from 'react-redux';
import { getResponseError } from '@lib/utils';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  id: string;
  ui: IUIConfig;
  intl: IntlShape;
}

interface IFiles {
  fieldname: string;
  file: File;
}

class ProductUpdate extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    submiting: false,
    fetching: true,
    product: {} as IProduct,
    uploadPercentage: 0
  };

  _files: {
    image: File;
    digitalFile: File;
  } = {
    image: null,
    digitalFile: null
  };

  async componentDidMount() {
    const { id, intl } = this.props;
    try {
      const resp = await productService.findById(id);
      this.setState({ product: resp.data });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(
        getResponseError(err)
          || intl.formatMessage({
            id: 'productNotFound',
            defaultMessage: 'Product not found!'
          })
      );
      Router.back();
    } finally {
      this.setState({ fetching: false });
    }
  }

  onUploading(resp: any) {
    if (this._files.image || this._files.digitalFile) {
      this.setState({ uploadPercentage: resp.percentage });
    }
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    const { id, intl } = this.props;
    try {
      const files = Object.keys(this._files).reduce((tmpFiles, key) => {
        if (this._files[key]) {
          tmpFiles.push({
            fieldname: key,
            file: this._files[key] || null
          });
        }
        return tmpFiles;
      }, [] as IFiles[]) as [IFiles];

      this.setState({ submiting: true });

      const submitData = {
        ...data
      };
      await productService.update(
        id,
        files,
        submitData,
        this.onUploading.bind(this)
      );
      message.success(
        intl.formatMessage({
          id: 'changesSaved',
          defaultMessage: 'Changes saved'
        })
      );
      this.setState({ submiting: false }, () => Router.push('/model/my-store'));
    } catch (e) {
      // TODO - check and show error here
      message.error(
        getResponseError(e)
          || intl.formatMessage({
            id: 'somethingWentWrong',
            defaultMessage: 'Something went wrong, please try again!'
          })
      );
      this.setState({ submiting: false });
    }
  }

  render() {
    const {
      product, submiting, fetching, uploadPercentage
    } = this.state;
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
              id: 'editProduct',
              defaultMessage: 'Edit Product'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'editProduct',
              defaultMessage: 'Edit Product'
            })}
            icon={<ShopOutlined />}
          />
          {!fetching && product && (
            <FormProduct
              product={product}
              submit={this.submit.bind(this)}
              uploading={submiting}
              beforeUpload={this.beforeUpload.bind(this)}
              uploadPercentage={uploadPercentage}
            />
          )}
          {fetching && (
            <div className="text-center">
              <Spin />
            </div>
          )}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStates)(ProductUpdate));
