import { IStream } from '@interfaces/stream';
import { IUser } from '@interfaces/user';
import { getResponseError } from '@lib/utils';
import { message, Modal } from 'antd';
import { useState } from 'react';
import { Player } from 'src/agora';
import useSubscriber from 'src/agora/useSubscriber';

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
  const watchNow = async () => {
    try {
      // TODO check supscription
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
      <Modal visible={showModal} onCancel={stopWatch}>
        <Player tracks={tracks} />
      </Modal>
    </div>
  );
}
