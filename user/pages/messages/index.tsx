import { Layout } from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { IUIConfig } from 'src/interfaces/';
import Messenger from '@components/messages/Messenger';
import { resetMessageState } from '@redux/message/actions';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  query: Record<string, string>;
  resetMessageState: Function;
  intl: IntlShape;
}

class Messages extends PureComponent<IProps> {
  static authenticate = true;

  static getInitialProps({ ctx }) {
    return {
      query: ctx.query
    };
  }

  componentWillUnmount() {
    const { resetMessageState: resetStateHandler } = this.props;
    resetStateHandler();
  }

  render() {
    const { ui, query = {}, intl } = this.props;
    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({ id: 'messages', defaultMessage: 'Messages' })}
          </title>
        </Head>
        <Layout>
          <div className="main-container">
            <Messenger toSource={query.toSource} toId={query.toId} />
          </div>
        </Layout>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui }
});

const mapDispatch = { resetMessageState };
export default injectIntl(connect(mapStates, mapDispatch)(Messages));
