import { streamService } from '@services/stream.service';
import { IAgoraRTCRemoteUser, UID } from 'agora-rtc-sdk-ng';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import { Player, useAgora } from 'src/agora';
import { Router } from 'next/router';

export type SubscriberProps = {
  localUId: UID;
  remoteUId: UID;
  forwardedRef?: any;
  onStreamStatusChange: Function;
  conversationId: string;
};

export default function Subscriber({
  localUId, remoteUId, forwardedRef, onStreamStatusChange, conversationId
}: SubscriberProps) {
  const [tracks, setTracks] = useState([]);
  const { client, appConfiguration } = useAgora();
  const { agoraAppId } = appConfiguration;

  const join = async () => {
    if (!client || !conversationId) return;

    const resp = await streamService.fetchAgoraAppToken({
      channelName: conversationId
    });
    await client.join(agoraAppId, conversationId, resp.data, localUId);
  };

  const onbeforeunload = () => {
    client?.uid && client.leave();
  };

  const subscribe = async (
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ) => {
    if (!client) return;

    await client.subscribe(user, mediaType);
    // const __uid = generateUid(uid);
    const remoteUser = client.remoteUsers.find(({ uid }) => uid === remoteUId);
    if (remoteUser) {
      if (mediaType === 'audio') remoteUser.audioTrack.play();
      if (mediaType === 'video') setTracks([remoteUser.videoTrack]);
      onStreamStatusChange(true);
    }
  };

  const unsubscribe = (user: IAgoraRTCRemoteUser) => {
    const remoteUser = user.uid === remoteUId;
    if (remoteUser) {
      setTracks([]);
      onStreamStatusChange(false);
    }
  };

  useEffect(() => {
    if (!client) return;

    client.on('connection-state-change', (state) => {
      // eslint-disable-next-line no-console
      console.log(state);
    });

    client.on('user-published', subscribe);
    client.on('user-unpublished', unsubscribe);
    client.on('token-privilege-will-expire', async () => {
      const resp = await streamService.fetchAgoraAppToken({
        channelName: 'stream1'
      });
      await client.renewToken(resp.data);
    });
    client.on('token-privilege-did-expire', join);
  }, [client]);

  useEffect(() => {
    Router.events.on('routeChangeStart', onbeforeunload);
    window.addEventListener('beforeunload', onbeforeunload);
    return () => {
      window.removeEventListener('beforeunload', onbeforeunload);
      Router.events.off('routeChangeStart', onbeforeunload);
    };
  }, []);

  return (
    // <AgoraProvider config={{ mode: 'live', codec: 'h264', role: 'host' }}>
    <>
      <Player tracks={tracks} />
      <Button
        hidden
        style={{ display: 'none' }}
        onClick={join}
        ref={forwardedRef}
      />
    </>
    // </AgoraProvider>
  );
}
