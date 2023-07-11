import Page from '@components/common/layout/page';
import LanguageSettingTable from '@components/language/table-list';
import { getResponseError } from '@lib/utils';
import { authService, languageService } from '@services/index';
import {
  Button, Col, Input, message, PageHeader, Row, Select
} from 'antd';
import { DownloadOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { PureComponent } from 'react';
import { ILanguage, ILocale } from 'src/interfaces';
import './index.less';
import Link from 'next/link';

const { Option } = Select;
interface P { }
interface S {
  data: ILanguage[];
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
}

function downloadCsv(url: string, filename: string) {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const blob = new Blob([xhr.response], { type: 'text/csv' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a') as HTMLAnchorElement;
      a.href = href;
      a.setAttribute('download', filename);
      a.click();
      URL.revokeObjectURL(href);
      resolve({ success: true });
    };

    xhr.onerror = (err) => {
      reject(err);
    };

    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', authService.getToken());
    xhr.responseType = 'blob';
    xhr.send();
  });
  return promise;
}

export default class LanguagePage extends PureComponent<P, S> {
  // eslint-disable-next-line react/sort-comp
  constructor(props: P) {
    super(props);
    this.state = {
      offset: 0,
      data: [],
      locales: [],
      loading: false,
      // submitting: false,
      pagination: { pageSize: 10, total: 0 },
      filter: { key: '', locale: '', value: '' },
      sort: { sortBy: 'createdAt', sorter: 'asc' },
      locale: null,
      // eslint-disable-next-line react/no-unused-state
      uploadPercentage: 0,
      csvFile: null as any
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

  onHandleTabChange(pagination, _, sorter) {
    const { sort, pagination: { pageSize } } = this.state;
    this.setState({
      offset: (pagination.current - 1) * pageSize,
      sort: {
        ...sort,
        sortBy: sorter.field,
        sorter: sorter.order === 'ascend' ? 'asc' : 'desc'
      }
    });
  }

  async onUpdate(data: ILanguage) {
    try {
      await languageService.update(data._id, data);
      message.success('Updated successfully');
      this.search();
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  async onDelete(id: string) {
    try {
      if (window.confirm('Are you sure you want to delete this row?')) {
        await languageService.delete(id);
        message.success('Deleted successfully');
        this.search();
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
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
  async generateLanguage() {
    const { locale } = this.state;
    if (!locale) return message.error('Please select locale you want to generate!');

    message.warning('Please wait for the update for a few minutes');
    try {
      await languageService.updateLocale({ locale });
      message.success('Updated successfully');
      this.search();
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
    return true;
  }

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
        data: resp.data.data,
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
  async handleExportCsvFile() {
    const { locale } = this.state;
    try {
      this.setState({ loading: true });
      const url = languageService.exportCsvFile(locale);
      (await downloadCsv(url, `export_${locale === null ? 'default' : locale}_language.csv`)) as any;
    } catch {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ loading: false });
    }
  }

  onUploading(resp: any) {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(csvFile: File) {
    // TODO - check file type...
    this.setState({ csvFile });
    return false;
  }

  async handleImportCsvFile() {
    const { locale, csvFile } = this.state;
    await languageService.importCsvFile(locale, csvFile, null, this.onUploading.bind(this));
  }

  render() {
    const {
      data, loading, pagination, locales, filter
    } = this.state;
    const renderLocaleOption = locales.map((locale) => (
      <Option key={locale.langCultureName} value={locale.langCultureName}>
        {locale.langCultureName}
        -
        {locale.displayName}
      </Option>
    ));

    return (
      <>
        <Head>
          <title>Language Setting</title>
        </Head>
        <Page>
          <PageHeader
            title="Language Setting"
            style={{ padding: 0, marginBottom: 10 }}
          />
          <Row className="ant-page-header" gutter={[10, 10]}>
            <Col sm={4} xs={24}>
              <Input
                placeholder="Key"
                value={filter.key}
                onChange={(event) => this.setFilter('key', event.currentTarget.value)}
              />
            </Col>
            <Col sm={6} xs={24}>
              <Select
                value={filter.locale}
                showSearch
                filterOption={(value, option) => option.value.toLowerCase().indexOf(value.toLowerCase()) > -1}
                onChange={(value) => this.setFilter('locale', value)}
                style={{ width: '100%' }}
              >
                <Option value="" key="all">
                  ALL LOCALE
                </Option>
                {renderLocaleOption}
              </Select>
            </Col>
            <Col sm={4} xs={24}>
              <Input
                placeholder="Text"
                value={filter.value}
                onChange={(event) => this.setFilter('value', event.currentTarget.value)}
              />
            </Col>
            <Col sm={4}>
              <Button onClick={this.search.bind(this)} type="primary">
                Search
              </Button>
            </Col>
            <Col sm={2}>
              <Button onClick={this.generateLanguage.bind(this)} type="primary">
                Generate
              </Button>
            </Col>
            <Col sm={2}>
              <Link href={{ pathname: 'language/import-csv' }}>
                <Button
                  disabled={loading}
                  icon={<UploadOutlined />}
                  type="primary"
                  htmlType="button"
                >
                  Import CSV
                </Button>
              </Link>
            </Col>
            <Col sm={2} className="col-exportCSV-btn">
              <Button
                onClick={this.handleExportCsvFile.bind(this)}
                disabled={loading}
                type="default"
                icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
              >
                Export CSV
              </Button>
            </Col>
          </Row>
          <LanguageSettingTable
            dataSource={data}
            rowKey="_id"
            onChange={this.onHandleTabChange.bind(this)}
            onDelete={this.onDelete.bind(this)}
            onUpdate={this.onUpdate.bind(this)}
            pagination={pagination}
            loading={loading}
          />
        </Page>
      </>
    );
  }
}
