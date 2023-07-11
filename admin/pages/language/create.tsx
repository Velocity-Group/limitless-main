import Head from 'next/head';
import { PureComponent } from 'react';
import Page from '@components/common/layout/page';
import {
  Button, Form, Input, message, Select
} from 'antd';
import { BreadcrumbComponent } from '@components/common';
import Router from 'next/router';
import { languageService } from '@services/language.service';
import { getResponseError } from '@lib/utils';

class MenuCreate extends PureComponent {
  state = {
    submitting: false,
    locales: []
  };

  componentDidMount() {
    this.locales();
  }

  async submit(data: any) {
    try {
      this.setState({ submitting: true });
      await languageService.create(data);
      message.success('Created successfully');
      Router.push('/language');
    } catch (e) {
      // TODO - check and show error here
      const err = (await Promise.resolve(e)) || {};
      message.error(
        getResponseError(err) || 'Something went wrong, please try again!'
      );
      this.setState({ submitting: false });
    }
  }

  async locales() {
    try {
      const resp = await languageService.locales();
      this.setState({ locales: resp.data });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  render() {
    const { submitting, locales } = this.state;
    const renderLocaleOption = locales.map((locale) => (
      <Select.Option
        key={locale.langCultureName}
        value={locale.langCultureName}
      >
        {locale.langCultureName}
        -
        {locale.displayName}
      </Select.Option>
    ));
    return (
      <>
        <Head>
          <title>Language</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Languages', href: '/language' },
            { title: 'Create new language' }
          ]}
        />
        <Page>
          <Form
            onFinish={this.submit.bind(this)}
            validateMessages={{ required: 'This field is required!' }}
            initialValues={{ locale: 'en-US' }}
          >
            <Form.Item label="Key" name="key" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Text" name="value" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Locale"
              name="locale"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                filterOption={(value, option) => option.value.toLowerCase().indexOf(value.toLowerCase()) > -1}
              >
                {renderLocaleOption}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button
                htmlType="submit"
                loading={submitting}
                disabled={submitting}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Page>
      </>
    );
  }
}

export default MenuCreate;