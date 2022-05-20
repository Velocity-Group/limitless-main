import React, { useEffect } from 'react';
import { GoogleOutlined } from '@ant-design/icons';
import useGoogleLogin from '@lib/hook/use-google-login';

interface IProps {
  clientId: string;
  onSuccess: Function;
  onFailure: Function;
}
const GoogleLoginButton = ({ clientId, onSuccess, onFailure }: IProps) => {
  const { signIn, loaded } = useGoogleLogin({
    clientId,
    onSuccess,
    onFailure,
    onScriptLoadFailure: onFailure
  });

  return (
    <button type="button" disabled={!clientId || !loaded} onClick={() => signIn()} className="google-button">
      <GoogleOutlined /> LOG IN / SIGN UP WITH GOOGLE
    </button>
  );
};

export default GoogleLoginButton;
