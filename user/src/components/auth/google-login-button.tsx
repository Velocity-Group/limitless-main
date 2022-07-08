import React, { useEffect, useState } from 'react';
import { GoogleOutlined } from '@ant-design/icons';
import useGoogleLogin from '@lib/hook/use-google-login';
import { Typography } from 'antd';
import './google-login-button.less';

const { Text } = Typography;

interface IProps {
  clientId: string;
  onSuccess: Function;
  onFailure: Function;
}
const GoogleLoginButton = ({ clientId, onSuccess, onFailure }: IProps) => {
  const { signIn, loaded, renderButtonSignIn } = useGoogleLogin({
    clientId,
    onSuccess,
    onFailure,
    onScriptLoadFailure: onFailure
  });

  const [clickedOnGoogleLoginButton, setClicked] = useState(false);

  const loginWithGoogle = () => {
    setClicked(true);
    signIn();
  };

  useEffect(() => {
    if (clickedOnGoogleLoginButton) {
      renderButtonSignIn();
    }
  }, [clickedOnGoogleLoginButton]);

  return (
    <>
      <button type="button" disabled={!clientId || !loaded} onClick={() => loginWithGoogle()} className="google-button">
        <GoogleOutlined />
        {' '}
        LOG IN / SIGN UP WITH GOOGLE
      </button>
      {clickedOnGoogleLoginButton && (
        <div className="btn-google-login-box">
          <Text type="secondary">
            If no prompt appears just click the button bellow to start the authentication flow:
          </Text>
          <div id="btnLoginWithGoogle" className="btn-google-login" />
        </div>
      )}
    </>
  );
};

export default GoogleLoginButton;
