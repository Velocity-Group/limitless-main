import Page from '@components/common/layout/page';
import { getResponseError } from '@lib/utils';
import { languageService } from '@services/index';
import {
  Button, Form, message, Select, Upload
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { PureComponent } from 'react';
import { ILocale } from 'src/interfaces';
import './index.less';
import { BreadcrumbComponent } from '@components/common';
import Router from 'next/router';

interface P { }
interface S {
  locales: ILocale[];
  loading: boolean;
  submitting?: boolean;
  pagination: {
    pageSize: number;
    total: number;
  };
  offset: number;
  sort: { sortBy: string; sorter: string };
  filter: Record<string, any>;
  uploadPercentage: number
  locale: any;
  csvFile: File;
  listCSV: []
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export default class ImportCSV extends PureComponent<P, S> {
  // eslint-disable-next-line react/sort-comp
  constructor(props: P) {
    super(props);
    this.state = {
      offset: 0,
      locales: [],
      loading: false,
      // submitting: false,
      pagination: { pageSize: 10, total: 0 },
      filter: { key: '', locale: '', value: '' },
      sort: { sortBy: 'createdAt', sorter: 'asc' },
      locale: null,
      // eslint-disable-next-line react/no-unused-state
      uploadPercentage: 0,
      csvFile: null as any,
      // eslint-disable-next-line react/no-unused-state
      listCSV: []
    };
  }

  componentDidMount() {
    this.locales();
    this.search();
  }

  componentDidUpdate(_, prevState: S) {
    const { sort, filter, offset } = this.state;
    if (
      sort !== prevState.sort
      || filter !== prevState.filter
      || offset !== prevState.offset
    ) {
      this.search();
    }
  }

  // eslint-disable-next-line react/sort-comp
  setFilter(key: string, value: any) {
    if (key === 'locale') {
      this.setState({ locale: value });
    }
    const { filter } = this.state;
    this.setState({ filter: { ...filter, [key]: value } });
  }

  // eslint-disable-next-line react/sort-comp
  async search() {
    try {
      this.setState({ loading: true });
      const {
        filter, offset, pagination, sort
      } = this.state;
      const resp = await languageService.search({
        offset,
        limit: pagination.pageSize,
        ...filter,
        ...sort
      });
      this.setState({
        pagination: { ...pagination, total: resp.data.total }
      });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ loading: false });
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

  // eslint-disable-next-line react/sort-comp
  onUploading(resp: any) {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(csvFile: File) {
    // TODO - check file type...
    this.setState({ csvFile });
    return false;
  }

  async ImportCsvFileClick() {
    const { locale, csvFile } = this.state;
    if (!locale) return message.error('Please select locale you want to import!');
    if (csvFile === null) return message.error('Please select CSV file you want to import!');
    try {
      this.setState({ loading: true });
      await languageService.importCsvFile(locale, csvFile, null, this.onUploading.bind(this));
      message.success('Import file successfully!');
      Router.back();
    } catch (error) {
      this.setState({ loading: true });
      const e = await error;
      message.error(e);
    } finally {
      this.setState({ loading: false });
    }
  }

  // eslint-disable-next-line react/sort-comp
  handleRemoveFile() {
    this.setState({ csvFile: null });
  }

  render() {
    const {
      loading, locales, filter
    } = this.state;

    return (
      <>
        <Head>
          <title>Import CSV</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Languages', href: '/language' },
            { title: 'Import CSV' }
          ]}
        />
        <Page>
          <Form
            {...layout}
          >
            <Form.Item
              label="Select locale"
            >
              <Select
                value={filter.locale}
                showSearch
                filterOption={(value, option) => option.value.toLowerCase().indexOf(value.toLowerCase()) > -1}
                style={{ width: '40%' }}
                onChange={(value) => this.setFilter('locale', value)}
              >
                <Select.Option value="" key="default" disabled>
                  ALL LOCALE
                </Select.Option>
                {locales.map((locale) => (
                  <Select.Option key={locale.langCultureName} value={locale.langCultureName}>
                    {locale.langCultureName}
                    -
                    {locale.displayName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Select CSV file"
              style={{ width: '40%' }}
            >
              <Upload
                accept=".csv"
                beforeUpload={this.beforeUpload.bind(this)}
                onRemove={this.handleRemoveFile.bind(this)}
              >
                <Button icon={<UploadOutlined />}>Import CSV</Button>
              </Upload>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                disabled={loading}
                onClick={this.ImportCsvFileClick.bind(this)}
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
