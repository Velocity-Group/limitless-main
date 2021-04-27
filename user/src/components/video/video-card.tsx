import { PureComponent } from 'react';
import {
  EyeOutlined,
  LikeOutlined,
  HourglassOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { videoDuration } from '@lib/index';
import { IVideo } from '../../interfaces';
import './video.less';

interface IProps {
  video: IVideo;
}

export class VideoCard extends PureComponent<IProps> {
  render() {
    const { video } = this.props;
    return (
      <div className="vid-card">
        {video?.isSaleVideo && video?.price > 0 && (
          <span className="vid-price">
            <div className="label-price">
              $
              {(video?.price || 0).toFixed(2)}
            </div>
          </span>
        )}
        <div className="vid-thumb">
          <Link
            href={{ pathname: '/video', query: { id: video?._id } }}
            as={`/video/${video?._id}`}
          >
            <a>
              <img
                alt={video.title}
                src={video?.thumbnail || video?.video?.thumbnails[0] || '/placeholder-image.jpg'}
              />
            </a>
          </Link>
          <Link
            href={{ pathname: '/video', query: { id: video?._id } }}
            as={`/video/${video?._id}`}
          >
            <div className="vid-stats">
              <span>
                <EyeOutlined />
                {' '}
                {video?.stats?.views || 0}
              </span>
              <span>
                <LikeOutlined />
                {' '}
                {video?.stats?.likes || 0}
              </span>
              <span>
                <HourglassOutlined />
                {' '}
                {videoDuration(video?.video?.duration || 0)}
              </span>
            </div>
          </Link>
        </div>
        <div className="vid-info">
          <Link
            href={{ pathname: '/video', query: { id: video?._id } }}
            as={`/video/${video?._id}`}
          >
            <span>{video?.title}</span>
          </Link>
        </div>
      </div>
    );
  }
}
