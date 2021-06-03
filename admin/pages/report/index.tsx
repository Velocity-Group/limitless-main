import React, { PureComponent } from 'react';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import ReportTableList from '@components/report/report-table-list';
import { reportService } from '@services/report.service';
import { message } from 'antd';
import './index.less';

export default class index extends PureComponent {
  state = {
    loading: false,
    submiting: false,
    limit: 10,
    offset: 0,
    reportList: [],
    totalReport: 0
  }

  componentDidMount() {
    this.getData();
  }

  async handleTabChange() {
  }

  async handleReport() {
  }

  // async getData() {
  //   const {
  //     limit, offset
  //   } = this.state;
  //   try {
  //     await this.setState({ loading: true });
  //     const resp = await reportService.search({
  //       limit,
  //       offset: offset * limit
  //     });
  //     await this.setState({
  //       reportList: resp.data.data,
  //       totalReport: resp.data.total
  //     });
  //   } catch (error) {
  //     message.error(error?.message || 'An error occured. Please try again.');
  //   } finally {
  //     this.setState({ loading: false });
  //   }
  // }

  async getData() {
    const {
      limit, offset
    } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await reportService.search({
        limit,
        offset: offset * limit
      });
      await this.setState({
        reportList: resp.data.data,
        totalReport: resp.data.total
      });
    } catch (error) {
      message.error(error?.message || 'An error occured. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const {
      limit, loading, submiting, reportList, totalReport
    } = this.state;
    return (
      <>
        <Head>
          <title>Report List </title>
        </Head>
        <Page>
          <div className="report-table-list">
            <ReportTableList
              items={reportList}
              searching={loading}
              total={totalReport}
              onChange={this.handleTabChange.bind(this)}
              pageSize={limit}
              submiting={submiting}
              handleReport={this.handleReport.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}
