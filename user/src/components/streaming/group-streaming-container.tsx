/* eslint-disable dot-notation */
/* eslint-disable camelcase */
import React, { PureComponent } from 'react';
import withAntmedia from 'src/antmedia';
import { Button, message } from 'antd';
import Router from 'next/router';
import { StreamSettings } from 'src/interfaces';
import { SocketContext } from 'src/socket';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { streamService } from 'src/services';
import { getResponseError } from '@lib/utils';
import { WebRTCAdaptorConfigs } from 'src/antmedia/interfaces/WebRTCAdaptorConfigs';
import videojs from 'video.js';
import './group-streaming-container.less';

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEAVED = 'private-stream/streamLeaved';
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';

interface IProps {
  sessionId: string;
  controller?: boolean;
  onChange?: Function;
  publish_started: boolean;
  initialized?: boolean;
  initWebRTCAdaptor: Function;
  leaveSession: Function;
  processing?: boolean;
  onClick?: Function;
  btnText?: string;
  settings?: StreamSettings;
  webRTCAdaptor: any;
  configs: Partial<WebRTCAdaptorConfigs>;
}

interface IState {
  streamId: string;
  streamList: string[];
  sessionId: string;
  conversationId: string;
  loading: boolean;
}

class GroupStreamingContainer extends PureComponent<IProps, IState> {
  private socket;

  private players: Record<string, videojs.Player>;

  private getLiveStreamOrVodURLInterval: Record<string, any>;

  constructor(props: IProps) {
    super(props);
    this.state = {
      sessionId: '', // roomName
      streamId: '',
      streamList: [],
      conversationId: '',
      loading: false
    };
  }

  componentDidMount() {
    const { initWebRTCAdaptor } = this.props;
    this.socket = this.context;
    this.socket.on(JOINED_THE_ROOM, (data) => {
      const { streamId, streamList, conversationId: _id } = data;
      const { conversationId } = this.state;
      if (_id !== conversationId) return;

      this.setState({ streamId, streamList });
      initWebRTCAdaptor(this.onHandlePrivateStream.bind(this));
      if (streamList.length) {
        streamList.forEach((id: string) => {
          const player = document.createElement('video');
          const container = document.getElementById('group-video-container');
          player.setAttribute('id', id);
          player.setAttribute('class', 'video-js');
          player.setAttribute('autoplay', 'autoplay');
          container.append(player);
          this.players[`player${id}`] = videojs(
            id,
            {
              // height: 145,
              width: container.offsetWidth / 4,
              liveui: true,
              controls: false
            },
            () => this.onReadyCallback(id)
          );
        });
      }
    });

    this.socket.on(STREAM_LEAVED, (data: { streamId: string }) => {
      const { streamList } = this.state;
      this.setState({
        streamList: streamList.filter((id) => id !== data.streamId)
      });
      if (this.players[`player${data.streamId}`]) {
        this.players[`player${data.streamId}`].dispose();
        delete this.players[`player${data.streamId}`];
      }
    });

    this.socket.on(STREAM_JOINED, (data: { streamId: string }) => {
      const { streamList, streamId } = this.state;
      this.setState({ streamList: [...streamList, data.streamId] });
      if (streamId !== data.streamId) {
        const player = document.createElement('video');
        const container = document.getElementById('group-video-container');
        player.setAttribute('id', data.streamId);
        player.setAttribute('class', 'video-js');
        player.setAttribute('autoplay', 'autoplay');
        container.append(player);
        this.players[`player${data.streamId}`] = videojs(
          data.streamId,
          {
            // height: 145,
            width: container.offsetWidth / 4,
            muted: data.streamId === streamId,
            liveui: true
          },
          () => this.onReadyCallback(data.streamId)
        );
      }
    });
    Router.events.on('routeChangeStart', this.onbeforeunload.bind(this));
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
  }

  componentDidUpdate(prevProps: IProps) {
    const { processing } = this.props;
    if (prevProps.processing !== processing) {
      this.handleLoading(processing);
    }
  }

  handleLoading(v: boolean) {
    this.setState({ loading: v });
  }

  async onHandlePrivateStream(info: WEBRTC_ADAPTOR_INFORMATIONS) {
    const { webRTCAdaptor, settings } = this.props;
    const { sessionId, conversationId, streamId } = this.state;
    if (info === 'initialized') {
      const token = await streamService.getPublishToken({ streamId, settings });
      webRTCAdaptor.publish(streamId, token);
    } else if (info === 'publish_started') {
      this.socket.emit('private-stream/join', {
        conversationId,
        streamId,
        sessionId
      });
      this.setState({ loading: false });
    } else if (info === 'publish_finished') {
      this.socket.emit('private-stream/leave', {
        conversationId,
        streamId,
        sessionId
      });
      this.setState({ loading: false });
    }
  }

  onbeforeunload() {
    this.leaveStream();
  }

  async onReadyCallback(streamId: string) {
    try {
      const { settings, configs } = this.props;
      const appName = configs.appName || settings.AntMediaAppname;
      const src = await streamService.getLiveStreamOrVodURL({
        appName,
        settings,
        streamId
      });
      if (!src) {
        return;
      }

      this.players[`player${streamId}`].on('click', () => this.subscribeHLS(streamId));
      this.players[`player${streamId}`].addClass('vjs-waiting');
      this.players[`player${streamId}`].on('ended', () => this.ended(streamId));
      this.players[`player${streamId}`].on('error', () => this.ended(streamId));

      setTimeout(() => {
        if (!this.players[`player${streamId}`]) return;
        this.players[`player${streamId}`].src({
          type: 'application/x-mpegURL',
          src
        });
        this.players[`player${streamId}`].play();
      }, 10 * 1000);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  async subscribeHLS(streamId: string) {
    try {
      const { settings, configs } = this.props;
      const appName = configs.appName || settings.AntMediaAppname;
      this.getLiveStreamOrVodURLInterval[streamId] && clearInterval(this.getLiveStreamOrVodURLInterval[streamId]);
      const src = await streamService.getLiveStreamOrVodURL({
        appName,
        settings,
        streamId
      });
      if (!src) {
        return;
      }

      let video = document.querySelector('#main-group-video');
      if (!video) {
        video = document.createElement('video');
        video.setAttribute('id', 'main-group-video');
        video.setAttribute('class', 'video-js');
        video.setAttribute('autoplay', 'autoplay');
        video.setAttribute('mute', 'mute');
        document.querySelector('.stream-group').prepend(video);
      }

      if (!window['mainPlayer']) {
        window['mainPlayer'] = videojs('main-group-video', {
          muted: true,
          liveui: true,
          controls: true
        });
        window['mainPlayer'].on('ended', () => window['mainPlayer'].reset());
      }

      setTimeout(() => {
        if (!window['mainPlayer']) return;
        window['mainPlayer'].src({
          type: 'application/x-mpegURL',
          src
        });
        window['mainPlayer'].play();
      }, 1000);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  start(sessionId: string, conversationId: string) {
    this.setState({ sessionId, conversationId });
  }

  leaveStream() {
    const { publish_started } = this.props;
    const { sessionId, conversationId, streamId } = this.state;
    Object.keys(this.getLiveStreamOrVodURLInterval).forEach((id) => {
      clearInterval(this.getLiveStreamOrVodURLInterval[id]);
      delete this.getLiveStreamOrVodURLInterval[id];
    });
    this.socket.off(JOINED_THE_ROOM);
    this.socket.off(STREAM_JOINED);
    this.socket.off(STREAM_LEAVED);
    if (publish_started) {
      this.socket.emit('private-stream/leave', {
        conversationId,
        streamId,
        sessionId
      });
    }
  }

  async ended(streamId: string) {
    const { settings } = this.props;
    const src = await streamService.getLiveStreamOrVodURL({ streamId, settings, appName: settings.AntMediaAppname });
    if (src) {
      this.getLiveStreamOrVodURLInterval[streamId] = setInterval(() => {
        fetch(src, { method: 'GET' }).then(() => {
          this.players[`player${streamId}`].src({
            type: 'application/x-mpegURL',
            src
          });
          this.players[`player${streamId}`].play();
          this.getLiveStreamOrVodURLInterval[streamId] && clearInterval(this.getLiveStreamOrVodURLInterval[streamId]);
        });
      }, 5000);
    }
  }

  leave() {
    if (process.browser) {
      window.location.reload();
    }
  }

  stop() {
    const { leaveSession } = this.props;
    leaveSession();
  }

  render() {
    const {
      onClick, btnText, initialized
    } = this.props;
    const { loading } = this.state;

    return (
      <>
        {!initialized ? (
          <Button
            type="primary"
            onClick={() => onClick()}
            loading={loading}
            block
          >
            {btnText || 'Start Chat'}
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={this.leave.bind(this)}
            block
            disabled={loading}
          >
            Leave Chat
          </Button>
        )}
        <div style={{ position: 'relative' }} className="stream-group">
          <div id="group-video-container">
            <video
              id="localVideoId"
              // height="145px"
              width="25%"
              autoPlay
              playsInline
            />
          </div>
        </div>
      </>
    );
  }
}

GroupStreamingContainer.contextType = SocketContext;
export default withAntmedia(GroupStreamingContainer);
