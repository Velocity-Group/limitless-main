import { PureComponent } from 'react';
import Head from 'next/head';
import { message } from 'antd';
import Page from '@components/common/layout/page';
import { ShopOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { productService } from '@services/product.service';
import Router from 'next/router';
import { FormProduct } from '@components/product/form-product';
import { IUIConfig } from 'src/interfaces';
import { connect } from 'react-redux';
import { getResponseError } from '@lib/utils';

interface IFiles {
  fieldname: string;
  file: File;
}

interface IResponse {
  data: { _id: string };
}
interface IProps {
  ui: IUIConfig;
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

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    if (!this._files.image) {
      return message.error('Please upload product image!');
    }
    if (data.type === 'digital' && !this._files.digitalFile) {
      return message.error('Please select digital file!');
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
      (await productService.createProduct(
        files,
        data,
        this.onUploading.bind(this)
      )) as IResponse;
      message.success('Product has been created');
      // TODO - process for response data?
      await this.setState(
        {
          uploading: false
        },
        () => Router.push('/model/my-store')
      );
    } catch (error) {
      message.error(
        getResponseError(error) || 'Something went wrong, please try again!'
      );
      await this.setState({
        uploading: false
      });
    }
    return undefined;
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    const { ui } = this.props;
    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | New product
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <PageHeading title="New Product" icon={<ShopOutlined />} />
            <FormProduct
              submit={this.submit.bind(this)}
              beforeUpload={this.beforeUpload.bind(this)}
              uploading={uploading}
              uploadPercentage={uploadPercentage}
            />
          </Page>
        </div>
      </>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(CreateProduct);
