import { PureComponent } from 'react';
import { Layout, Alert } from 'antd';

import { connect } from 'react-redux';
import Head from 'next/head';

interface IProps {
  ui: any;
  system: any;
}

class Error404Page extends PureComponent<IProps> {
  static noredirect: boolean = true;

  render() {
    const { ui, system } = this.props;
    const error = system.error || {
      statusCode: 404,
      message: 'Your requested link does not exist!'
    };
    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Error
          </title>
        </Head>
        <Layout>
          <div className="main-container">
            <Alert
              style={{ marginTop: '20px' }}
              message={`${error.statusCode} Error`}
              description={error.message}
              type="error"
              showIcon
            />
          </div>
        </Layout>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui,
  system: state.system
});

export default connect(mapStates)(Error404Page);
