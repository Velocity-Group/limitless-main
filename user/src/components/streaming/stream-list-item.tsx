import { IStream } from '@interfaces/stream';
import { IUser } from '@interfaces/user';
import { getResponseError } from '@lib/utils';
import { message, Modal } from 'antd';
import { useState } from 'react';
import { Player } from 'src/agora';
import useSubscriber from 'src/agora/useSubscriber';
import Router from 'next/router';
import { useDispatch } from 'react-redux';
import { showSubscribePerformerModal } from '@redux/subscription/actions';

type Props = {
  stream: IStream;
  user: IUser;
}

export default function StreamListItem({ stream, user }: Props) {
  const { join, tracks, client } = useSubscriber({
    localUId: user._id,
    remoteUId: stream.performerId,
    conversationId: stream.conversationId
  });
  const [showModal, setModalShow] = useState(false);
  const dispatch = useDispatch();
  const watchNow = async () => {
    try {
      if (!user._id) {
        message.error('Please log in or register!', 5);
        Router.push('/');
        return;
      }
      if (user.isPerformer) return;
      if (!stream?.isSubscribed) {
        message.error('Please subscribe to join live chat!', 5);
        dispatch(showSubscribePerformerModal(stream.performerId));
        return;
      }
      if (!stream.isFree) {
        Router.push(
          {
            pathname: '/streaming/details',
            query: {
              performer: JSON.stringify(stream?.performerInfo),
              username:
                stream?.performerInfo?.username || stream?.performerInfo?._id
            }
          },
          `/streaming/${
            stream?.performerInfo?.username || stream?.performerInfo?._id
          }`
        );
        return;
      }
      join();
      setModalShow(true);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  };

  const stopWatch = async () => {
    if (client && client.uid) {
      await client.leave();
    }
    if (client?.remoteUsers) {
      client.remoteUsers.forEach((remoteUser) => {
        remoteUser.audioTrack.stop();
      });
    }
    setModalShow(false);
  };

  return (
    <div
      aria-hidden
      onClick={watchNow}
      key={stream?._id}
      className="story-per-card"
      title={stream?.performerInfo?.name || stream?.performerInfo?.username || 'N/A'}
    >
      <div className="blink-border" />
      <img className="per-avatar" alt="avatar" src={stream?.performerInfo?.avatar || '/static/no-avatar.png'} />
      <div className="live-tag">LIVE</div>
      <Modal visible={showModal} onCancel={stopWatch} width={640}>
        <Player tracks={tracks} />
      </Modal>
    </div>
  );
}
