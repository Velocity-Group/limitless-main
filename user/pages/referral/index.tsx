import {
  Divider,
  Layout, message, Popover, Tabs
} from 'antd';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { GiftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import './index.less';
import { referralService } from '@services/referral.service';
import { IReferralStats } from '@interfaces/referral';
import { earningService } from '@services/earning.service';
import PageHeading from '@components/common/page-heading';
import ReferralLink from '@components/referral/referral-link';
import ReferralStat from '@components/referral/referral-stat';
import TableListReferralUser from '@components/referral/referral-user-table';
import TableListReferralEarning from '@components/referral/referral-earning-table';
import { IntlShape, useIntl } from 'react-intl';

function ReferralPage() {
  const ui = useSelector((state: any) => state.ui);
  const settings = useSelector((state: any) => state.settings);
  // Referral link
  const [referralLoading, setReferralLoading] = useState(false);
  const [linkReferral, setLinkReferral] = useState('');
  const [referralCode, setReferralCode] = useState('');
  // Referral stat
  const [stats, setStats] = useState<IReferralStats>();
  // Referral earning
  const [earningLoading, setEarningLoading] = useState(false);
  const [listEarnings, setListEarnings] = useState([]);
  const [filterEarning] = useState({} as any);
  const [paginationEarning, setPaginationEarning] = useState({} as any);
  const [earningSortBy, setEarningSortBy] = useState('createdAt');
  const [earningSort, setEarningSort] = useState('desc');
  // Referral user
  const [usersLoading, setUsersLoading] = useState(false);
  const [listUsers, setListUsers] = useState([]);
  const [filterUser] = useState({} as any);
  const [paginationUser, setPaginationUser] = useState({} as any);
  const [usersSortBy, setUsersSortBy] = useState('createdAt');
  const [usersSort, setUsersSort] = useState('desc');

  const [limit] = useState(10);
  const intl: IntlShape = useIntl();

  const getReferralCode = async () => {
    try {
      setReferralLoading(true);
      const resp = await referralService.getReferralCode();
      setLinkReferral(`${window.location.origin}/auth/register?rel=${resp.data}`);
      setReferralCode(resp.data);
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      setReferralLoading(false);
    }
  };

  const getUserStat = async () => {
    try {
      const resp = await earningService.referralStats();
      setStats(resp.data);
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    }
  };

  const referralEarningSearch = async (page = 1) => {
    try {
      setEarningLoading(true);
      const resp = await earningService.referralSearch({
        ...filterEarning,
        limit,
        offset: (page - 1) * limit,
        sort: earningSort,
        sortBy: earningSortBy
      });
      setListEarnings(resp.data.data);
      setPaginationEarning({ ...paginationEarning, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err);
    } finally {
      setEarningLoading(false);
    }
  };

  const referralUserSearch = async (page = 1) => {
    try {
      setUsersLoading(true);
      const resp = await referralService.search({
        ...filterUser,
        limit,
        offset: (page - 1) * limit,
        sort: usersSort,
        sortBy: usersSortBy
      });
      setListUsers(resp.data.data);
      setPaginationUser({ ...paginationUser, total: resp.data.total, pageSize: limit });
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    getReferralCode();
    getUserStat();
    referralUserSearch();
  }, []);

  const handleTableEarningChange = (pagination, filter, sorter) => {
    const pager = { ...paginationEarning };
    pager.current = pagination.current;
    setPaginationEarning(pager);
    setEarningSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setEarningSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    referralEarningSearch(pager.current);
  };

  const handleTableUserChange = (pagination, filter, sorter) => {
    const pager = { ...paginationUser };
    pager.current = pagination.current;
    setPaginationUser(pager);
    setUsersSortBy(sorter.field || 'createdAt');
    // eslint-disable-next-line no-nested-ternary
    setUsersSort(sorter.order ? sorter.order === 'descend' ? 'desc' : 'asc' : 'desc');
    referralUserSearch(pager.current);
  };

  const handlePageChange = async (key: 'earning' | 'users') => {
    if (key === 'earning') {
      referralEarningSearch();
    }
    if (key === 'users') {
      referralUserSearch();
    }
  };

  const content = (
    <div>
      <p>
        {intl.formatMessage({ id: 'referAModelGet', defaultMessage: 'Refer a model - get' })}
        {' '}
        {settings?.performerReferralCommission * 100 || 0}
        %
        {intl.formatMessage({ id: 'onTheModelRevenueFor1Year', defaultMessage: 'on the model revenue for 1 year' })}
      </p>
      <p>
        {intl.formatMessage({ id: 'referAFanGet', defaultMessage: 'Refer a fan - get' })}
        {' '}
        {settings?.userReferralCommission * 100 || 0}
        %
        {intl.formatMessage({ id: 'onTheFanSpends', defaultMessage: 'on the fan spends' })}
      </p>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          |
          {' '}
          {intl.formatMessage({ id: 'referral', defaultMessage: 'Referral' })}
        </title>
      </Head>
      <div className="main-container">
        <PageHeading title={intl.formatMessage({ id: 'referral', defaultMessage: 'Referral' })} icon={<GiftOutlined />} />
        <div className="page-referral">
          <div className="title">
            <h1>{intl.formatMessage({ id: 'referAFriend', defaultMessage: 'Refer A Friend' })}</h1>
            <div className="info">
              <p>{intl.formatMessage({ id: 'forEachFriendYouReferYoullGetCommission', defaultMessage: 'For each friend you refer you\'ll get commission' })}</p>
              <Popover content={content}>
                <InfoCircleOutlined />
              </Popover>
            </div>
          </div>
          <ReferralLink linkReferral={linkReferral} referralCode={referralCode} loading={referralLoading} />
          <Divider />
          <ReferralStat stats={stats} />
          <Tabs defaultActiveKey="1" onChange={handlePageChange}>
            <Tabs.TabPane tab={intl.formatMessage({ id: 'referredPersonList', defaultMessage: 'Referred Person List' })} key="users">
              {paginationUser.total ? (
                <TableListReferralUser
                  rowKey="_id"
                  dataSource={listUsers}
                  loading={usersLoading}
                  onChange={handleTableUserChange}
                  pagination={paginationUser}
                />
              ) : <p className="no-found">{intl.formatMessage({ id: 'noReferralsWereFound', defaultMessage: 'No referrals were found' })}</p>}
            </Tabs.TabPane>
            <Tabs.TabPane tab={intl.formatMessage({ id: 'commissionList', defaultMessage: 'Commission List' })} key="earning">
              {paginationEarning.total ? (
                <TableListReferralEarning
                  rowKey="_id"
                  dataSource={listEarnings}
                  loading={earningLoading}
                  onChange={handleTableEarningChange}
                  pagination={paginationEarning}
                />
              ) : <p className="no-found">{intl.formatMessage({ id: 'noRevenueWasFound', defaultMessage: 'No revenue was found' })}</p>}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

export default ReferralPage;
