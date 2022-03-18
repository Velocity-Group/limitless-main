import React, {
  useContext, useEffect, useRef, useState
} from 'react';
import { Player, useAgora } from 'src/agora';
import { createLocalTracks } from 'src/agora/utils';
import { SocketContext } from 'src/socket';
import { streamService } from '@services/stream.service';
import { UID, ILocalTrack } from 'agora-rtc-sdk-ng';
import { Router } from 'next/router';

type Props = {
  uid: UID;
  forwardedRef: any;
  onStatusChange: Function;
  conversationId: string;
};

type LocalTracks = {
  videoTrack: ILocalTrack;
  audioTrack: ILocalTrack;
}

export default function Publisher({
  uid, forwardedRef, onStatusChange, conversationId
}: Props) {
  const [tracks, setTracks] = useState([]);
  const { client, appConfiguration } = useAgora();
  const { agoraAppId } = appConfiguration;
  const socket = useContext(SocketContext);
  const localTracks = useRef<LocalTracks>({ videoTrack: null, audioTrack: null });
  const publish = async () => {
    if (!client || !conversationId) return;

    // const uid = generateUid(performerId);
    const resp = await streamService.fetchAgoraAppToken({
      channelName: conversationId
    });

    await client.join(agoraAppId, conversationId, resp.data, uid);

    const [microphoneTrack, cameraTrack] = await createLocalTracks(
      {},
      { encoderConfig: { bitrateMax: 1000 } }
    );

    await client.publish([microphoneTrack, cameraTrack]);
    setTracks([microphoneTrack, cameraTrack]);
    onStatusChange(true);
    localTracks.current = { videoTrack: cameraTrack, audioTrack: microphoneTrack };
    socket && conversationId && socket.emit('public-stream/live', { conversationId });
  };

  const leave = async () => {
    Object.keys(localTracks.current).forEach((trackName) => {
      if (localTracks.current[trackName]) {
        localTracks.current[trackName].stop();
        localTracks.current[trackName].close();
      }
    });
    localTracks.current = { videoTrack: null, audioTrack: null };
    setTracks([]);
    onStatusChange(false);
    if (client && client.uid) {
      await client.leave();
    }
  };

  const onbeforeunload = () => {
    leave();
  };

  useEffect(() => {
    if (!client) return;

    client.on('connection-state-change', (state) => {
      // eslint-disable-next-line no-console
      console.log(state);
    });
  }, [client]);

  useEffect(() => {
    Router.events.on('routeChangeStart', onbeforeunload);
    window.addEventListener('beforeunload', onbeforeunload);

    // eslint-disable-next-line consistent-return
    return () => {
      window.removeEventListener('beforeunload', onbeforeunload);
      Router.events.off('routeChangeStart', onbeforeunload);
    };
  }, []);

  React.useImperativeHandle(forwardedRef, () => ({
    publish,
    leave
  }));

  return <Player tracks={tracks} />;
}
