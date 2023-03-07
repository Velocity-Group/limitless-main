import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Layout, BackTop } from 'antd';
import { connect } from 'react-redux';
import { Router } from 'next/router';
import { loadUIValue } from '@redux/ui/actions';
import {
  Elements
} from '@stripe/react-stripe-js';
import './primary-layout.less';
import { ISettings } from '@interfaces/setting';
import { loadStripe } from '@stripe/stripe-js';
import { ConfirmSubscriptionPerformerForm } from 'src/components/performer/confirm-subscription';

const Header = dynamic(() => import('@components/common/layout/header'));
const Footer = dynamic(() => import('@components/common/layout/footer'));
const Loader = dynamic(() => import('@components/common/base/loader'));

interface DefaultProps {
  loadUIValue: Function;
  children: any;
  settings: ISettings;
}

function PrimaryLayout({
  children, loadUIValue: handleLoadUI, settings
}: DefaultProps) {
  const [routerChange, setRouterChange] = useState(false);

  useEffect(() => {
    handleLoadUI();
    Router.events.on('routeChangeStart', () => setRouterChange(true));
    Router.events.on('routeChangeComplete', async () => setRouterChange(false));
    return () => {
      Router.events.off('routeChangeStart', () => setRouterChange(true));
      Router.events.off('routeChangeComplete', async () => setRouterChange(false));
    };
  }, []);

  return (
    <Elements stripe={loadStripe(settings.stripePublishableKey)}>
      <Layout>
        <div
          className="container"
          id="primaryLayout"
        >
          <Header />
          <Layout.Content
            className="content"
          >
            {routerChange && <Loader />}
            {children}
          </Layout.Content>
          <BackTop className="backTop" />
          <Footer />
        </div>
        <ConfirmSubscriptionPerformerForm />
      </Layout>
    </Elements>
  );
}

const mapStateToProps = (state: any) => ({
  settings: { ...state.settings }
});
const mapDispatchToProps = { loadUIValue };

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryLayout);
