import {
  ILocalVideoTrack,
  IRemoteVideoTrack,
  ILocalAudioTrack,
  IRemoteAudioTrack
} from 'agora-rtc-sdk-ng';
import React, { useRef, useEffect } from 'react';
import './index.less';

interface Props {
  tracks: Array<
    | ILocalVideoTrack
    | IRemoteVideoTrack
    | ILocalAudioTrack
    | IRemoteAudioTrack
    | undefined
  >;
}

export const Player: React.FC<Props> = ({ tracks }: Props) => {
  const player = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (player.current) {
      if (tracks.length) {
        const mediaStreamTracks = tracks.map((track) => track.getMediaStreamTrack());
        const mediaStream = new MediaStream(mediaStreamTracks);
        player.current.srcObject = mediaStream;
      } else {
        player.current.srcObject = null;
        player.current.poster = '/static/offline.jpg';
      }
    }
  }, [player, tracks]);

  return (
    <div className="publisher-player">
      <video
        ref={player}
        controls
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};

Player.defaultProps = {};
Player.displayName = 'AgoraPlayer';
