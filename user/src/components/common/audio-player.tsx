import { useEffect } from 'react';

interface IProps {
  source: string
}

export const AudioPlayer = ({ source }: IProps) => {
  let playerRef: any;

  useEffect(() => () => {
    if (playerRef) {
      playerRef.dispose();
    }
  }, []);

  return (
    <div className="audio-player">
      <audio controls ref={playerRef}>
        <source src={source} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
