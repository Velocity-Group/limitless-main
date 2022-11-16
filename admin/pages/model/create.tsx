import Head from 'next/head';
import { PureComponent } from 'react';
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
    creating: false
  };

  _avatar: File;

  _cover: File;

  onBeforeUpload = async (file, field = 'avatar') => {
    if (field === 'avatar') {
      this._avatar = file;
    }
    if (field === 'cover') {
      this._cover = file;
    }
  }

  async submit(data: any) {
    try {
      if (data.password !== data.rePassword) {
        message.error('Confirm password mismatch!');
        return;
      }

      this.setState({ creating: true });
      const resp = await performerService.create({
        ...data
      });
      if (this._avatar) {
        await performerService.uploadAvatar(this._avatar, resp.data._id);
      }
      if (this._cover) {
        await performerService.uploadCover(this._cover, resp.data._id);
      }
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
    const { creating } = this.state;
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
            onFinish={this.submit.bind(this)}
            submiting={creating}
            countries={countries}
            languages={languages}
            phoneCodes={phoneCodes}
            bodyInfo={bodyInfo}
            onBeforeUpload={this.onBeforeUpload}
          />
        </Page>
      </Layout>
    );
  }
}

export default PerformerCreate;
