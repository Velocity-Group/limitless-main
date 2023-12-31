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
  // eslint-disable-next-line react/require-default-props
  onStatusChange?: Function;
  conversationId: string;
  sessionId: string;
  // eslint-disable-next-line react/require-default-props
  eventName?: string;
};

type LocalTracks = {
  videoTrack: ILocalTrack;
  audioTrack: ILocalTrack;
}

export default function Publisher({
  uid, forwardedRef, onStatusChange, conversationId, sessionId, eventName
}: Props) {
  const [tracks, setTracks] = useState([]);
  const { client, appConfiguration } = useAgora();
  const { agoraAppId } = appConfiguration;
  const socket = useContext(SocketContext);
  const localTracks = useRef<LocalTracks>({ videoTrack: null, audioTrack: null });
  const clientRef = useRef<any>();
  const publish = async () => {
    if (!client || !conversationId || !sessionId) return null;

    // const uid = generateUid(performerId);
    const resp = await streamService.fetchAgoraAppToken({
      channelName: sessionId
    });

    await client.join(agoraAppId, sessionId, resp.data, uid);

    const [microphoneTrack, cameraTrack] = await createLocalTracks(
      {},
      { encoderConfig: { bitrateMax: 1000 } }
    );

    await client.publish([microphoneTrack, cameraTrack]);
    setTracks([microphoneTrack, cameraTrack]);
    onStatusChange && onStatusChange(true);
    localTracks.current = { videoTrack: cameraTrack, audioTrack: microphoneTrack };
    socket && conversationId && socket.emit(eventName || 'public-stream/live', { conversationId });
    return client;
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
    onStatusChange && onStatusChange(false);
    if (clientRef.current && clientRef.current.uid) {
      await clientRef.current.leave();
    }
  };

  const onbeforeunload = () => {
    leave();
  };

  useEffect(() => {
    clientRef.current = client;
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
