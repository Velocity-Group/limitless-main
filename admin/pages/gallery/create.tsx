import Head from 'next/head';
import { PureComponent, Fragment } from 'react';
import Page from '@components/common/layout/page';
import { message } from 'antd';
import { galleryService } from '@services/gallery.service';
import { FormGallery } from '@components/gallery/form-gallery';
import { BreadcrumbComponent } from '@components/common';
import Router from 'next/router';

class GalleryCreate extends PureComponent {
  state = {
    submitting: false
  };

  async submit(data: any) {
    try {
      this.setState({ submitting: true });

      const submitData = {
        ...data
      };
      await galleryService.create(submitData);
      message.success('Created successfully');
      // TODO - redirect
      await this.setState(
        {
          submitting: false
        },
        () => window.setTimeout(() => {
          Router.push(
            {
              pathname: '/gallery'
            },
            '/gallery'
          );
        }, 500)
      );
    } catch (e) {
      // TODO - check and show error here
      message.error('Something went wrong, please try again!');
      this.setState({ submitting: false });
    }
  }

  render() {
    const { submitting } = this.state;
    return (
      <>
        <Head>
          <title>Create new gallery</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[{ title: 'Galleries', href: '/gallery' }, { title: 'Create new gallery' }]}
        />
        <Page>
          <FormGallery onFinish={this.submit.bind(this)} submitting={submitting} />
        </Page>
      </>
    );
  }
}

export default GalleryCreate;
