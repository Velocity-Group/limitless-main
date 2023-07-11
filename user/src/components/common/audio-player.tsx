import { useEffect } from 'react';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  source: string;
}

export const AudioPlayer = ({ source }: IProps) => {
  let playerRef: any;
  const intl: IntlShape = useIntl();

  useEffect(() => () => {
    if (playerRef) {
      playerRef.dispose();
    }
  }, []);

  return (
    <div className="audio-player">
      <audio controls ref={playerRef}>
        <source src={source} type="audio/mpeg" />
        {intl.formatMessage({ id: 'yourBrowserDoesNotSupportTheAudioElement', defaultMessage: 'Your browser does not support the audio element' })}
      </audio>
    </div>
  );
};
