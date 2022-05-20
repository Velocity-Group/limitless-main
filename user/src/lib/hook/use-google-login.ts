import { useState, useEffect } from 'react';
import { loadScript } from 'static/lib/load-script';
import { removeScript } from 'static/lib/remove-script';

interface IProps {
  clientId: string;
  onSuccess: Function;
  onFailure: Function;
  onScriptLoadFailure?: Function;
  autoLoad?: boolean;
  jsSrc?: string;
}

const useGoogleLogin = ({
  onSuccess = Function,
  onFailure = Function,
  onScriptLoadFailure,
  clientId,
  autoLoad,
  jsSrc = 'https://accounts.google.com/gsi/client'
}: IProps) => {
  const [loaded, setLoaded] = useState(false);

  function handleSigninSuccess(res) {
    onSuccess(res);
  }

  function signIn(e = null) {
    if (e) {
      e.preventDefault();
    }
    if (loaded) {
      const google = (window as any).google;
      google.accounts.id.prompt();
    }
  }

  useEffect(() => {
    let unmounted = false;
    const onLoadFailure = onScriptLoadFailure || onFailure;
    loadScript(
      document,
      'script',
      'google-login',
      jsSrc,
      () => {
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: data => {
            handleSigninSuccess(data);
          }
        });
        if (!unmounted) {
          setLoaded(true);
        }
      },
      err => {
        onLoadFailure(err);
      }
    );

    return () => {
      unmounted = true;
      removeScript(document, 'google-login');
    };
  }, []);

  useEffect(() => {
    if (autoLoad) {
      signIn();
    }
  }, [loaded]);

  return { signIn, loaded };
};

export default useGoogleLogin;
