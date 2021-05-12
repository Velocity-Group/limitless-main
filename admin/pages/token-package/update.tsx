import Head from 'next/head';
import { PureComponent, Fragment } from 'react';
import Page from '@components/common/layout/page';
import { message } from 'antd';
import Router from 'next/router';
import { tokenService } from '@services/token.service';
import { IToken } from 'src/interfaces/token-package';
import Loader from '@components/common/base/loader';
import { BreadcrumbComponent } from '@components/common';
import FormTokenPackage from '@components/token-package/form';

interface IProps {
  id: string;
}

class TokenUpdate extends PureComponent<IProps> {
  state = {
    submitting: false,
    fetching: true,
    token: {} as IToken
  };

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  async componentDidMount() {
    const { id } = this.props;
    try {
      const resp = await tokenService.findById(id);
      this.setState({ token: resp.data });
      console.log('TOKEN', resp.data);
    } catch (e) {
      message.error('Token package not found!');
    } finally {
      this.setState({ fetching: false });
    }
  }

  async submit(data: any) {
    const { id } = this.props;
    this.setState({ submitting: true });

    const submitData = {
      ...data
    };
    await tokenService.update(
      id,
      submitData
    );
    message.success('Updated successfully');
    // this.setState({ submitting: false });
    Router.back();
  }

  catch() {
    // TODO - check and show error here
    message.error('Something went wrong, please try again!');
    this.setState({ submitting: false });
  }

  render() {
    const { submitting, fetching, token } = this.state;
    return (
      <>
        <Head>
          <title>Update Token Package</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Token', href: '/token-package' },
            { title: token.name ? token.name : 'Detail token package' },
            { title: 'Update' }
          ]}
        />
        <Page>
          {fetching ? (
            <Loader />
          ) : (
            <FormTokenPackage
              packageToken={token}
              onFinish={this.submit.bind(this)}
              submitting={submitting}
            />
          )}
        </Page>
      </>
    );
  }
}

export default TokenUpdate;
