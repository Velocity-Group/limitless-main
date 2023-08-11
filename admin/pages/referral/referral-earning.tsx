import { BreadcrumbComponent, SearchFilter } from '@components/common';
import Page from '@components/common/layout/page';
import TableListReferralEarning from '@components/referral/table-list-referral-earning';
import { referralService } from '@services/index';
import {
  Col, message, Row, Statistic
} from 'antd';
import Head from 'next/head';
import { useEffect, useState } from 'react';

interface IReferralStatResponse {
  totalRegisters: number;
  totalNetPrice: number;
  totalSales: number;
}

function ReferralEarning() {
  const [stats, setStats] = useState<IReferralStatResponse>();
  const [filter, setFilter] = useState({} as any);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([] as any);
  const [limit] = useState(10);
  const [sort, setSort] = useState('desc');
  const [sortBy, setSortBy] = useState('createdAt');
  const [pagination, setPagination] = useState({} as any);

  const searchStats = async () => {
    try {
      const resp = await referralService.stats({
        ...filter
      });
      setStats(resp.data);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred, please try again!');
    }
  };

  const searchTableStats = async (page = 1) => {
    try {
      setLoading(true);
      const resp = await referralService.searchTableStats({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      setList(resp.data.data);
      setPagination({ ...pagination, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchStats();
    searchTableStats();
  }, [filter]);

  const handleTableChange = async (pag, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pag.current;
    setPagination(pager);
    setSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setSort(sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc');
    searchTableStats(pager.current);
  };

  const handleFilter = async (values) => {
    setFilter({ ...filter, ...values });
  };

  return (
    <>
      <Head>
        <title>Referral Earnings</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Referral Earnings' }]} />
      <Page>
        <Row gutter={16} style={{ marginBottom: '10px' }}>
          <Col span={8}>
            <Statistic title="Total Net Price" prefix="$" value={stats?.totalNetPrice || 0} precision={2} />
          </Col>
          <Col span={8}>
            <Statistic title="Total Registers" value={stats?.totalRegisters || 0} precision={0} />
          </Col>
          <Col span={8}>
            <Statistic title="Total Sales" value={stats?.totalSales || 0} precision={0} />
          </Col>
        </Row>
        <SearchFilter
          onSubmit={handleFilter}
          dateRange
        />
        <div style={{ marginBottom: '20px' }} />
        <div className="table-responsive">
          <TableListReferralEarning
            rowKey="_id"
            dataSource={list}
            loading={loading}
            onChange={handleTableChange}
          />
        </div>
      </Page>
    </>
  );
}

export default ReferralEarning;
