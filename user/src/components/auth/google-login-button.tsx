import React, { useEffect } from 'react';
import { GoogleOutlined } from '@ant-design/icons';
declare const google: any;

interface IProps {
  clientId: string;
  onGoogleLogin: Function;
}
const GoogleLoginButton = ({ clientId, onGoogleLogin }: IProps) => {
  const initGoogleLibrary = () => {
    if (clientId)
      google.accounts.id.initialize({
        client_id: clientId,
        callback: data => {
          onGoogleLogin(data);
        }
      });
  };

  const openGoogleLoginPrompt = () => {
    google.accounts.id.prompt();
  };

  useEffect(() => {
    initGoogleLibrary();
  }, []);

  return (
    <button type="button" disabled={!clientId} onClick={() => openGoogleLoginPrompt()} className="google-button">
      <GoogleOutlined /> LOG IN / SIGN UP WITH GOOGLE
    </button>
  );
};

export default GoogleLoginButton;
