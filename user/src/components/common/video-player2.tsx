import {
  useEffect, useRef, useState
} from 'react';
import videojs from 'video.js';
import { message } from 'antd';
import { videoService, feedService, messageService } from 'src/services';
import { LoadingOutlined, CaretRightOutlined } from '@ant-design/icons';
import { useMedia } from 'react-use-media';
import './video-player.less';

interface ITranscodePlayer {
  type: 'video' | 'message' | 'feed';
  videoOptions?: any;
  data: any;
  fileId: string;
}

export function TranscodeVideoPlayer({
  type,
  videoOptions = {},
  data,
  fileId
}: ITranscodePlayer) {
  const playerRef = useRef(null);
  const timeout = useRef(null);
  const player = useRef(null);
  const [thumb, setThumb] = useState('/static/no-image.jpg');
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const isMobile = useMedia({ maxWidth: 500 });

  const loadVideo = async () => {
    try {
      let resp = null;
      if (type === 'feed') {
        resp = await feedService.getTranscodeVideoUrl(data._id, fileId);
      }
      if (type === 'video') {
        resp = await videoService.getTranscodeVideoUrl(data._id, fileId);
      }
      if (type === 'message') {
        resp = await messageService.getTranscodeVideoUrl(data._id, fileId);
      }
      switch (resp.data.status) {
        case 'error':
          // TODO - set error or something here
          message.error('Video file is error!', 5);
          break;
        case 'success':
          setLoading(false);
          setVideoUrl(resp.data.url);
          player.current && player.current.play();
          break;
        case 'processing':
          timeout.current = setTimeout(loadVideo, 5000);
          break;
        default: break;
      }
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occurred, please try again later');
    }
  };

  const onClick = async () => {
    setLoading(true);
    loadVideo();
  };

  const getThumbnail = (obj) => {
    if (obj.thumbnail?.url) return obj.thumbnail.url;
    if (obj.thumbnails?.length) return obj.thumbnails[0];
    if (obj.files?.length) {
      return getThumbnail(obj.files[0]);
    }
    if (obj.video) {
      return getThumbnail(obj.video);
    }
    return null;
  };

  useEffect(() => {
    if (!playerRef.current || !videoUrl) return;
    player.current = videojs(playerRef.current, {
      ...videoOptions,
      fluid: true,
      sources: [
        {
          src: videoUrl,
          type: 'video/mp4'
        },
        {
          src: '/static/sample-video.mp4',
          type: 'video/mp4'
        }
      ]
    });
  }, [playerRef.current, videoUrl]);

  useEffect(() => {
    if (!data) return;

    const thumbnail = getThumbnail(data);
    if (thumbnail) setThumb(thumbnail);

    // eslint-disable-next-line consistent-return
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [data]);

  if (!videoUrl) {
    return (
      <div className="videojs-player" style={{ position: 'relative' }}>
        {!loading ? (
          <button onClick={onClick} className="play-button" type="button" title="Play Video" aria-disabled="false">
            <CaretRightOutlined />
          </button>
        ) : (
          <LoadingOutlined
            spin
            style={{
              fontSize: 60,
              color: '#fff',
              top: 'calc(50% - 30px)',
              left: 'calc(50% - 30px)',
              position: 'absolute'
            }}
          />
        )}
        <img src={thumb} alt="video" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div className="videojs-player">
      <div data-vjs-player style={!isMobile ? { paddingTop: 'max(56.25%)' } : null}>
        <video
          ref={playerRef}
          className="video-js"
        />
      </div>
    </div>
  );
}

TranscodeVideoPlayer.defaultProps = {
  videoOptions: {
    autoplay: true,
    controls: true,
    playsinline: true,
    fluid: true
  }
};
