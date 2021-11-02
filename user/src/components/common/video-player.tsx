import { PureComponent } from 'react';
import videojs from 'video.js';
import 'node_modules/video.js/dist/video-js.css';

export class VideoPlayer extends PureComponent<any> {
  videoNode: HTMLVideoElement;

  player: any;

  componentDidMount() {
    this.player = videojs(this.videoNode, { ...this.props });
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  render() {
    const { height } = this.props;
    return (
      <div className="videojs-player">
        <div data-vjs-player style={height && { maxHeight: height }}>
          <video ref={(node) => { this.videoNode = node; }} className="video-js" />
        </div>
      </div>
    );
  }
}
