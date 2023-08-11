import { BreadcrumbComponent, SearchFilter } from '@components/common';
import Page from '@components/common/layout/page';
import TableListReferral from '@components/referral/table-list-referral';
import { referralService } from '@services/referral.service';
import { message } from 'antd';
import Head from 'next/head';
import { useEffect, useState } from 'react';

function Referrals() {
  const [loading, setLoading] = useState(false);
  const [referrals, setReferrals] = useState([] as any);
  const [pagination, setPagination] = useState({} as any);
  const [limit] = useState(10);
  const [filter, setFilter] = useState({} as any);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sort, setSort] = useState('desc');

  const search = async (page = 1) => {
    try {
      setLoading(true);
      const resp = await referralService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      setReferrals(resp.data.data);
      setPagination({ ...pagination, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'An error occurred!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, [filter]);

  const handleTableChange = (pag, filters, sorter) => {
    const pager = { ...pag };
    pager.current = pag.current;
    setPagination(pager);
    setSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    search(pager.current);
  };

  const handleFilter = async (values) => {
    setFilter({ ...filter, ...values });
  };

  return (
    <>
      <Head>
        <title>Referrals</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Referrals' }]} />
      <Page>
        <SearchFilter onSubmit={handleFilter} dateRange />
        <div className="table-responsive">
          <TableListReferral
            rowKey="_id"
            loading={loading}
            dataSource={referrals}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </div>
      </Page>
    </>
  );
}

export default Referrals;
