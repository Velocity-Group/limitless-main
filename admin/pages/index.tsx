import Head from 'next/head';
import {
  Row, Col, Statistic, Card, Layout
} from 'antd';
import { useEffect, useState } from 'react';
import { utilsService } from '@services/utils.service';
import {
  AreaChartOutlined, PieChartOutlined, BarChartOutlined,
  LineChartOutlined, DotChartOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { IUser } from 'src/interfaces';
import { ROLE_ADMIN } from 'src/constants';

function Dashboard() {
  const [stats, setStats] = useState({
    totalActivePerformers: 0,
    totalInactivePerformers: 0,
    totalPendingPerformers: 0,
    totalActiveUsers: 0,
    totalInactiveUsers: 0,
    totalPendingUsers: 0,
    totalDeliveredOrders: 0,
    totalGrossPrice: 0,
    totalNetPrice: 0,
    totalPriceCommission: 0,
    totalOrders: 0,
    totalPosts: 0,
    totalPhotoPosts: 0,
    totalVideoPosts: 0,
    totalGalleries: 0,
    totalPhotos: 0,
    totalVideos: 0,
    totalProducts: 0,
    totalRefundedOrders: 0,
    totalShippingdOrders: 0,
    totalSubscribers: 0,
    totalActiveSubscribers: 0,
    totalInactiveSubscribers: 0
  });
  const user: IUser = useSelector((state: any) => state.user.current);

  const getStats = async () => {
    const resp = await (await utilsService.statistics()).data;
    setStats(resp);
  };

  useEffect(() => {
    getStats();
  }, []);

  const adminDashboardItems = [
    {
      pathname: '/users?status=active',
      title: 'ACTIVE USERS',
      value: stats?.totalActiveUsers,
      color: '#ffc107',
      prefix: <LineChartOutlined />
    },
    {
      pathname: '/users?status=inactive',
      title: 'INACTIVE USERS',
      value: stats?.totalInactiveUsers,
      color: '#ffc107',
      prefix: <LineChartOutlined />
    },
    {
      pathname: '/users?verifiedEmail=false',
      title: 'NOT VERIFIED EMAIL USERS',
      value: stats?.totalPendingUsers,
      color: '#ffc107',
      prefix: <LineChartOutlined />
    },
    {
      pathname: '/model?status=active',
      title: 'ACTIVE MODELS',
      value: stats?.totalActivePerformers,
      color: '#009688',
      prefix: <BarChartOutlined />
    },
    {
      pathname: '/model?status=inactive',
      title: 'INACTIVE MODELS',
      value: stats?.totalInactivePerformers,
      color: '#009688',
      prefix: <BarChartOutlined />
    },
    {
      pathname: '/model?verifiedDocument=false',
      title: 'NOT VERIFIED ID MODELS',
      value: stats?.totalPendingPerformers,
      color: '#009688',
      prefix: <BarChartOutlined />
    },
    {
      pathname: '/feed',
      title: 'TOTAL POSTS',
      value: stats?.totalPosts,
      color: '#5399d0',
      prefix: <PieChartOutlined />
    },
    {
      pathname: '/gallery',
      title: 'TOTAL GALLERIES',
      value: stats?.totalGalleries,
      color: '#5399d0',
      prefix: <PieChartOutlined />
    },
    {
      pathname: '/photos',
      title: 'TOTAL PHOTOS',
      value: stats?.totalPhotos,
      color: '#5399d0',
      prefix: <PieChartOutlined />
    },
    {
      pathname: '/video',
      title: 'TOTAL VIDEOS',
      value: stats?.totalVideos,
      color: '#5399d0',
      prefix: <PieChartOutlined />
    },
    {
      pathname: '/product',
      title: 'TOTAL PRODUCTS',
      value: stats?.totalProducts,
      color: '#5399d0',
      prefix: <PieChartOutlined />
    },
    {
      pathname: '/subscription',
      title: 'TOTAL SUBSCRIBERS',
      value: stats?.totalSubscribers,
      color: '#941fd0',
      prefix: <DotChartOutlined />
    },
    {
      pathname: '/earnings',
      title: 'TOTAL EARNINGS',
      value: stats?.totalGrossPrice.toFixed(2),
      color: '#fb2b2b',
      prefix: '$'
    },
    {
      pathname: '/earnings',
      title: 'PLATFORM EARNINGS',
      value: stats?.totalPriceCommission.toFixed(2),
      color: '#fb2b2b',
      prefix: '$'
    },
    {
      pathname: '/earnings',
      title: 'MODEL\'S EARNINGS',
      value: stats?.totalNetPrice.toFixed(2),
      color: '#fb2b2b',
      prefix: '$'
    },
    {
      pathname: '/order?deliveryStatus=shipping',
      title: 'SHIPPED ORDERS',
      value: stats?.totalShippingdOrders,
      color: '#c8d841',
      prefix: <AreaChartOutlined />
    },
    {
      pathname: '/order?deliveryStatus=delivered',
      title: 'DELIVERED ORDERS',
      value: stats?.totalDeliveredOrders,
      color: '#c8d841',
      prefix: <AreaChartOutlined />
    },
    {
      pathname: '/order?deliveryStatus=refunded',
      title: 'REFUNDED ORDERS',
      value: stats?.totalRefundedOrders,
      color: '#c8d841',
      prefix: <AreaChartOutlined />
    }
  ];

  const subAdminDashboardItems = user
  && adminDashboardItems.filter((item) => user.pathsAllow?.some((path) => item.pathname.includes(path)));

  return (
    <Layout>
      <Head>
        <title>Dashboard</title>
      </Head>
      <Row className="dashboard-stats">
        {user?.roles && user.roles.includes(ROLE_ADMIN)
          ? adminDashboardItems.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
            <Col md={8} xs={12} key={index}>
              <Link href={item.pathname}>
                <a>
                  <Card>
                    <Statistic
                      title={item.title}
                      value={item.value}
                      valueStyle={{ color: item.color }}
                      prefix={item.prefix}
                    />
                  </Card>
                </a>
              </Link>
            </Col>
          ))
          : subAdminDashboardItems.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
            <Col md={8} xs={12} key={index}>
              <Link href={item.pathname}>
                <a>
                  <Card>
                    <Statistic
                      title={item.title}
                      value={item.value}
                      valueStyle={{ color: item.color }}
                      prefix={item.prefix}
                    />
                  </Card>
                </a>
              </Link>
            </Col>
          ))}
      </Row>
    </Layout>
  );
}

export default Dashboard;
