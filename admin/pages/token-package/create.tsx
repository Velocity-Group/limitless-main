import Head from 'next/head';
import { PureComponent, Fragment } from 'react';
import Page from '@components/common/layout/page';
import { message } from 'antd';
import { BreadcrumbComponent } from '@components/common';
import Router from 'next/router';
import FormTokenPackage from '@components/token-package/form';
import { tokenService } from '@services/token.service';

class CreateToken extends PureComponent {
    state = {
      submitting: false
    };

    async submit(data: any) {
      try {
        this.setState({ submitting: true });
        await tokenService.create(data);
        message.success('Created successfully');
        // TODO - redirect
        await this.setState(
          {
            submitting: false
          },
          () => window.setTimeout(() => {
            Router.push(
              {
                pathname: '/token-package'
              },
              '/token-package'
            );
          }, 1000)
        );
      } catch (e) {
        // TODO - check and show error here
        const err = (await Promise.resolve(e)) || {};
        message.error(err.message || 'Something went wrong, please try again!');
        this.setState({ submitting: false });
      }
    }

    render() {
      const { submitting } = this.state;
      return (
        <>
          <Head>
            <title>Create new Token Package</title>
          </Head>
          <BreadcrumbComponent
            breadcrumbs={[{ title: 'Token Packages', href: '/token' }, { title: 'Create new Token package' }]}
          />
          <Page>
            <FormTokenPackage onFinish={this.submit.bind(this)} packageToken={null} submitting={submitting} />
          </Page>
        </>
      );
    }
}

export default CreateToken;
