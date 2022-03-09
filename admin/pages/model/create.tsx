import Head from 'next/head';
import { PureComponent, createRef } from 'react';
import { message, Layout } from 'antd';
import Page from '@components/common/layout/page';
import {
  ICountry, ILangguges, IBody, IPhoneCodes
} from 'src/interfaces';
import Router from 'next/router';
import { performerService } from '@services/index';
import { utilsService } from '@services/utils.service';
import { getResponseError } from '@lib/utils';
import { AccountForm } from '@components/performer/AccountForm';
import { BreadcrumbComponent } from '@components/common';

interface IProps {
  countries: ICountry[];
  languages: ILangguges[];
  phoneCodes: IPhoneCodes[];
  bodyInfo: IBody;
}

class PerformerCreate extends PureComponent<IProps> {
  static async getInitialProps() {
    const [countries, languages, phoneCodes, bodyInfo] = await Promise.all([
      utilsService.countriesList(),
      utilsService.languagesList(),
      utilsService.phoneCodesList(),
      utilsService.bodyInfo()
    ]);
    return {
      countries: countries?.data || [],
      languages: languages?.data || [],
      phoneCodes: phoneCodes?.data || [],
      bodyInfo: bodyInfo?.data
    };
  }

  state = {
    creating: false,
    avatarUrl: '',
    coverUrl: ''
  };

  customFields = {};

  formRef = createRef() as any;

  onUploaded(field: string, resp: any) {
    if (field === 'avatarId') {
      this.setState({ avatarUrl: resp.response.data.url });
    }
    if (field === 'coverId') {
      this.setState({ coverUrl: resp.response.data.url });
    }
    this.customFields[field] = resp.response.data._id;
  }

  async submit(data: any) {
    try {
      if (data.password !== data.rePassword) {
        message.error('Confirm password mismatch!');
        return;
      }

      await this.setState({ creating: true });
      const resp = await performerService.create({
        ...data,
        ...this.customFields
      });
      message.success('Created successfully');
      Router.push(
        {
          pathname: '/model',
          query: { id: resp.data._id }
        }
      );
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(getResponseError(err) || 'An error occurred, please try again!');
      this.setState({ creating: false });
    }
  }

  render() {
    const { creating, avatarUrl, coverUrl } = this.state;
    const {
      countries, languages, bodyInfo, phoneCodes
    } = this.props;
    return (
      <Layout>
        <Head>
          <title>New Model</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[{ title: 'Models', href: '/model' }, { title: 'New model' }]}
        />
        <Page>
          <AccountForm
            ref={this.formRef}
            onUploaded={this.onUploaded.bind(this)}
            onFinish={this.submit.bind(this)}
            submiting={creating}
            countries={countries}
            languages={languages}
            phoneCodes={phoneCodes}
            bodyInfo={bodyInfo}
            avatarUrl={avatarUrl}
            coverUrl={coverUrl}
          />
        </Page>
      </Layout>
    );
  }
}

export default PerformerCreate;
