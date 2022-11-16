import { PureComponent } from 'react';
import videojs from 'video.js';
import { isMobile } from 'react-device-detect';
import 'node_modules/video.js/dist/video-js.css';

export class VideoPlayer extends PureComponent<any> {
  videoNode: HTMLVideoElement;

  player: any;

  componentDidMount() {
    this.player = videojs(this.videoNode, {
      ...this.props,
      fluid: true,
      controlBar: {
        pictureInPictureToggle: false
      }
    } as any);
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  render() {
    return (
      <div className="videojs-player">
        <div data-vjs-player style={!isMobile ? { paddingTop: 'max(81vh)' } : null}>
          <video ref={(node) => { this.videoNode = node; }} className="video-js" />
        </div>
      </div>
    );
  }
}
