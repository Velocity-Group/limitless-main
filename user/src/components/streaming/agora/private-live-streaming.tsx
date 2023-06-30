import React, {
  useContext, useEffect, useRef, useState
} from 'react';
import { Player, useAgora } from 'src/agora';
import { createLocalTracks } from 'src/agora/utils';
import { SocketContext } from 'src/socket';
import { streamService } from '@services/stream.service';
import { UID, ILocalTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Router } from 'next/router';

type Props = {
  localUID: UID;
  remoteUID: UID;
  forwardedRef: any;
  conversationId: string;
  sessionId: string;
  // eslint-disable-next-line react/require-default-props
  eventName?: string;
};

type LocalTracks = {
  videoTrack: ILocalTrack;
  audioTrack: ILocalTrack;
}

export default function PrivateLiveStreaming({
  localUID, forwardedRef, conversationId, sessionId, eventName, remoteUID
}: Props) {
  const [tracks, setTracks] = useState([]);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const { client, appConfiguration } = useAgora();
  const { agoraAppId } = appConfiguration;
  const socket = useContext(SocketContext);
  const localTracks = useRef<LocalTracks>({ videoTrack: null, audioTrack: null });
  const clientRef = useRef<any>();
  const publish = async () => {
    if (!client || !conversationId || !sessionId) return null;

    const resp = await streamService.fetchAgoraAppToken({
      channelName: sessionId
    });

    await client.join(agoraAppId, sessionId, resp.data, localUID);

    const [microphoneTrack, cameraTrack] = await createLocalTracks(
      {},
      { encoderConfig: { bitrateMax: 1000 } }
    );

    await client.publish([microphoneTrack, cameraTrack]);
    setTracks([microphoneTrack, cameraTrack]);
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
    setRemoteTracks([]);
    if (clientRef.current && clientRef.current.uid) {
      await clientRef.current.leave();
    }
  };

  const subscribe = async (
    remoteUsers: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ) => {
    if (!client) return;

    await client.subscribe(remoteUsers, mediaType);

    const remoteUser = client.remoteUsers.find(({ uid }) => uid === remoteUID);
    if (remoteUser) {
      if (mediaType === 'audio') remoteUser.audioTrack.play();
      if (mediaType === 'video') setRemoteTracks([remoteUser.videoTrack]);
    }
  };

  const unsubscribe = (user: IAgoraRTCRemoteUser) => {
    const remoteUser = user.uid === remoteUID;
    if (remoteUser) {
      setRemoteTracks([]);
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
    client.on('user-published', subscribe);
    client.on('user-unpublished', unsubscribe);
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

  return (
    <div className="private-live-streaming">
      <div className="publisher">
        <Player tracks={tracks} />
      </div>
      <hr />
      <div className="subscriber">
        <Player tracks={remoteTracks} />
      </div>
    </div>
  );
}
