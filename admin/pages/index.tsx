import Head from 'next/head';
import {
  Row, Col, Statistic, Card, Layout
} from 'antd';
import { PureComponent } from 'react';
import { utilsService } from '@services/utils.service';
import {
  AreaChartOutlined, PieChartOutlined, BarChartOutlined,
  LineChartOutlined, DotChartOutlined
} from '@ant-design/icons';
import Link from 'next/link';

export default class Dashboard extends PureComponent<any> {
  state = {
    stats: {
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
      totalGrossToken: 0,
      totalNetToken: 0,
      totalTokenCommission: 0,
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
    }
  }

  async componentDidMount() {
    const stats = await (await utilsService.statistics()).data;
    if (stats) {
      this.setState({ stats });
    }
  }

  render() {
    const { stats } = this.state;
    return (
      <Layout>
        <Head>
          <title>Dashboard</title>
        </Head>
        <Row className="dashboard-stats">
          <Col md={8} xs={12}>
            <Link href={{ pathname: '/users', query: { status: 'active' } }}>
              <a>
                <Card>
                  <Statistic
                    title="ACTIVE USERS"
                    value={stats.totalActiveUsers}
                    valueStyle={{ color: '#ffc107' }}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href={{ pathname: '/users', query: { status: 'inactive' } }}>
              <a>
                <Card>
                  <Statistic
                    title="INACTIVE USERS"
                    value={stats.totalInactiveUsers}
                    valueStyle={{ color: '#ffc107' }}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href={{ pathname: '/users', query: { status: 'pending-email-confirmation' } }}>
              <a>
                <Card>
                  <Statistic
                    title="NOT VERIFIED EMAIL USERS"
                    value={stats.totalPendingUsers}
                    valueStyle={{ color: '#ffc107' }}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href={{ pathname: '/model', query: { status: 'active' } }}>
              <a>
                <Card>
                  <Statistic
                    title="ACTIVE MODELS"
                    value={stats.totalActivePerformers}
                    valueStyle={{ color: '#009688' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </a>
            </Link>

          </Col>
          <Col md={8} xs={12}>
            <Link href={{ pathname: '/model', query: { status: 'inactive' } }}>
              <a>
                <Card>
                  <Statistic
                    title="INACTIVE MODELS"
                    value={stats.totalInactivePerformers}
                    valueStyle={{ color: '#009688' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href={{ pathname: '/model', query: { verifiedDocument: false } }}>
              <a>
                <Card>
                  <Statistic
                    title="NOT VERIFIED IDS MODELS"
                    value={stats.totalPendingPerformers}
                    valueStyle={{ color: '#009688' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/feed">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL POSTS"
                    value={stats.totalPosts}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<PieChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/gallery">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL GALLERIES"
                    value={stats.totalGalleries}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<PieChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/photos">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL PHOTOS"
                    value={stats.totalPhotos}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<PieChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/video">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL VIDEOS"
                    value={stats.totalVideos}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<PieChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/product">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL PRODUCTS"
                    value={stats.totalProducts}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<PieChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/subscription">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL SUBSCRIBERS"
                    value={stats.totalSubscribers}
                    valueStyle={{ color: '#941fd0' }}
                    prefix={<DotChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          {/* <Col md={8} xs={12}>
            <Link href="/subscription">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL ACTIVE SUBSCRIBERS"
                    value={stats.totalActiveSubscribers}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<DotChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/subscription">
              <a>
                <Card>
                  <Statistic
                    title="TOTAL INACTIVE SUBSCRIBERS"
                    value={stats.totalInactiveSubscribers}
                    valueStyle={{ color: '#5399d0' }}
                    prefix={<DotChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col> */}
          <Col md={8} xs={12}>
            <Link href="/earnings/cash">
              <a>
                <Card>
                  <Statistic
                    title="GROSS PROFIT $"
                    value={`${stats?.totalGrossPrice.toFixed(2)}`}
                    valueStyle={{ color: '#fb2b2b' }}
                    prefix="$"
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/earnings/cash">
              <a>
                <Card>
                  <Statistic
                    title="NET PROFIT $"
                    value={`${stats?.totalPriceCommission.toFixed(2)}`}
                    valueStyle={{ color: '#fb2b2b' }}
                    prefix="$"
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/earnings/cash">
              <a>
                <Card>
                  <Statistic
                    title="MODELS COMMISSION $"
                    value={`${stats?.totalNetPrice.toFixed(2)}`}
                    valueStyle={{ color: '#fb2b2b' }}
                    prefix="$"
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/earnings/token">
              <a>
                <Card>
                  <Statistic
                    title="GROSS PROFIT TOKEN"
                    value={`${stats?.totalGrossToken.toFixed(2)}`}
                    valueStyle={{ color: '#fb2b2b' }}
                    prefix={<img alt="coin" src="/coin-ico.png" width="20px" />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/earnings/token">
              <a>
                <Card>
                  <Statistic
                    title="NET PROFIT TOKEN"
                    value={`${stats?.totalTokenCommission.toFixed(2)}`}
                    valueStyle={{ color: '#fb2b2b' }}
                    prefix={<img alt="coin" src="/coin-ico.png" width="20px" />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/earnings/token">
              <a>
                <Card>
                  <Statistic
                    title="MODELS COMMISSION TOKEN"
                    value={`${stats?.totalNetToken.toFixed(2)}`}
                    valueStyle={{ color: '#fb2b2b' }}
                    prefix={<img alt="coin" src="/coin-ico.png" width="20px" />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/order?deliveryStatus=shipping">
              <a>
                <Card>
                  <Statistic
                    title="SHIPPED ORDERS"
                    value={stats.totalShippingdOrders}
                    valueStyle={{ color: '#c8d841' }}
                    prefix={<AreaChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/order?deliveryStatus=delivered">
              <a>
                <Card>
                  <Statistic
                    title="DELIVERED ORDERS"
                    value={stats.totalDeliveredOrders}
                    valueStyle={{ color: '#c8d841' }}
                    prefix={<AreaChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
          <Col md={8} xs={12}>
            <Link href="/order?deliveryStatus=refunded">
              <a>
                <Card>
                  <Statistic
                    title="REFUNDED ORDERS"
                    value={stats.totalRefundedOrders}
                    valueStyle={{ color: '#c8d841' }}
                    prefix={<AreaChartOutlined />}
                  />
                </Card>
              </a>
            </Link>
          </Col>
        </Row>
      </Layout>
    );
  }
}
