import { Result, Button } from 'antd';
import {
  HomeOutlined, ContactsOutlined
} from '@ant-design/icons';
import Router from 'next/router';
import { IntlShape, useIntl } from 'react-intl';

function Page404() {
  const intl: IntlShape = useIntl();
  return (
    <Result
      status="error"
      title="404"
      subTitle={intl.formatMessage({ id: 'cannotFindThisPage', defaultMessage: 'Sorry, we can\'t find this page' })}
      extra={[
        <Button className="secondary" key="console" style={{ textTransform: 'uppercase' }} onClick={() => Router.push('/home')}>
          <HomeOutlined />
          {intl.formatMessage({ id: 'backHome', defaultMessage: 'Back Home' })}
        </Button>,
        <Button key="buy" className="primary" style={{ textTransform: 'uppercase' }} onClick={() => Router.push('/contact')}>
          <ContactsOutlined />
          CONTACT US
          {intl.formatMessage({ id: 'contactUs', defaultMessage: 'Contact Us' })}
        </Button>
      ]}
    />
  );
}

export default Page404;
