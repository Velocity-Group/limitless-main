import { PureComponent } from 'react';
import dynamic from 'next/dynamic';
import { Layout, BackTop } from 'antd';
import { connect } from 'react-redux';
import { Router } from 'next/router';
import { IUIConfig } from 'src/interfaces/ui-config';
import { loadUIValue } from '@redux/ui/actions';
import './primary-layout.less';
import Head from 'next/head';

const Header = dynamic(() => import('@components/common/layout/header'));
const Footer = dynamic(() => import('@components/common/layout/footer'));
const Loader = dynamic(() => import('@components/common/base/loader'));

interface DefaultProps {
  loadUIValue: Function;
  children: any;
  ui: IUIConfig
}

class PrimaryLayout extends PureComponent<DefaultProps> {
  state = {
    routerChange: false
  };

  componentDidMount() {
    const { loadUIValue: handleLoadUI } = this.props;
    process.browser && handleLoadUI();
    process.browser && this.handleStateChange();
  }

  handleStateChange() {
    Router.events.on('routeChangeStart', async () => this.setState({ routerChange: true }));
    Router.events.on('routeChangeComplete', async () => this.setState({ routerChange: false }));
  }

  render() {
    const {
      children, ui
    } = this.props;
    const { routerChange } = this.state;
    return (
      <Layout>
        <Head>
          <script src="/static/lib/webrtc_adaptor.js" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/7.4.0/adapter.min.js" />
          <script src="https://vjs.zencdn.net/7.10.2/video.min.js" />
          <script src="https://cdn.jsdelivr.net/npm/@videojs/http-streaming@2.6.2/dist/videojs-http-streaming.min.js" />
        </Head>
        <div
          className={ui?.theme === 'dark' ? 'container dark' : 'container'}
          id="primaryLayout"
        >
          <Header />
          <Layout.Content
            className="content"
            style={{ position: 'relative' }}
          >
            {routerChange && <Loader />}
            {children}
          </Layout.Content>
          <BackTop className="backTop" />
          <Footer />
        </div>
      </Layout>
    );
  }
}

const mapStateToProps = (state: any) => ({
  ui: { ...state.ui }
});
const mapDispatchToProps = { loadUIValue };

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryLayout);
