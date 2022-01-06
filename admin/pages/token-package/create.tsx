import Head from 'next/head';
import { PureComponent } from 'react';
import Page from '@components/common/layout/page';
import { message } from 'antd';
import { BreadcrumbComponent } from '@components/common';
import Router from 'next/router';
import FormTokenPackage from '@components/token-package/form';
import { tokenService } from '@services/index';

class CreateToken extends PureComponent {
    state = {
      submiting: false
    };

    async submit(data: any) {
      try {
        this.setState({ submiting: true });
        await tokenService.create(data);
        message.success('Created successfully');
        Router.push('/token-package');
      } catch (e) {
        // TODO - check and show error here
        const err = (await Promise.resolve(e)) || {};
        message.error(err.message || 'Something went wrong, please try again!');
        this.setState({ submiting: false });
      }
    }

    render() {
      const { submiting } = this.state;
      return (
        <>
          <Head>
            <title>New Token Package</title>
          </Head>
          <BreadcrumbComponent
            breadcrumbs={[{ title: 'Token Packages', href: '/token' }, { title: 'New token package' }]}
          />
          <Page>
            <FormTokenPackage onFinish={this.submit.bind(this)} packageToken={null} submiting={submiting} />
          </Page>
        </>
      );
    }
}

export default CreateToken;
