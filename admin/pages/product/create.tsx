import Head from 'next/head';
import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import Page from '@components/common/layout/page';
import { productService } from '@services/product.service';
import Router from 'next/router';
import { BreadcrumbComponent } from '@components/common';
import { FormProduct } from '@components/product/form-product';

interface IFiles {
  fieldname: string;
  file: File;
}

interface IResponse {
  data: { _id: string };
}
class CreateProduct extends PureComponent {
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
    if (data.type === 'digital' && !this._files.digitalFile) {
      message.error('Please select digital file!');
      return;
    } if (data.type === 'physical') {
      this._files.digitalFile = null;
    }
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
      const resp = (await productService.createProduct(
        files,
        data,
        this.onUploading.bind(this)
      )) as IResponse;
      message.success('Product has been created');
      Router.push(`/product/update?id=${resp.data._id}`);
    } catch (error) {
      message.error('An error occurred, please try again!');
      this.setState({
        uploading: false
      });
    }
  }

  render() {
    const { uploading, uploadPercentage } = this.state;
    return (
      <Layout>
        <Head>
          <title>New product</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Product', href: '/product' },
            { title: 'New product' }
          ]}
        />
        <Page>
          <FormProduct
            submit={this.submit.bind(this)}
            beforeUpload={this.beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={uploadPercentage}
          />
        </Page>
      </Layout>
    );
  }
}

export default CreateProduct;
