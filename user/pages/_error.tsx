import { Result, Button } from 'antd';
import {
  HomeOutlined, ContactsOutlined
} from '@ant-design/icons';
import Router from 'next/router';
import { useIntl } from 'react-intl';

interface IProps {
  statusCode: number;
  message: string;
}

const Error = ({ statusCode, message }: IProps) => {
  const intl = useIntl();
  return (
    <Result
      status="error"
      title={statusCode}
      subTitle={message}
      extra={[
        <Button className="secondary" key="console" onClick={() => Router.push('/home')}>
          <HomeOutlined />
          {intl.formatMessage({ id: 'backHomeUpCase', defaultMessage: 'BACK HOME' })}
        </Button>,
        <Button key="buy" className="primary" onClick={() => Router.push('/contact')}>
          <ContactsOutlined />
          {intl.formatMessage({ id: 'contactUsUpCase', defaultMessage: 'CONTACT US' })}
        </Button>
      ]}
    />
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode || err?.statusCode || 404;
  return {
    statusCode: res?.statusCode || err?.statusCode || 404,
    message: res?.message || err?.message || `An error ${statusCode} occurred on server`
  };
};

export default Error;
