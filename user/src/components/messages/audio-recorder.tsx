import { Button } from 'antd';
import {
  AudioOutlined, PauseCircleFilled, PlayCircleFilled
} from '@ant-design/icons';
import { useAudioRecorder } from '@sarafhbk/react-audio-recorder';
import { useEffect } from 'react';
import './audio-recorder.less';
import { StopRecordSvg } from 'src/icons';

interface IProps {
  onFinish: Function;
  isActive: boolean;
  onClose: Function;
}

export const AudioRecorder = ({ onFinish, isActive, onClose }: IProps) => {
  const {
    audioResult,
    timer,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    status
  } = useAudioRecorder();

  const handleStartStop = () => {
    if (['recording', 'paused'].includes(status)) {
      stopRecording();
      onClose();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    onFinish(audioResult);
  }, [audioResult]);

  useEffect(() => {
    if (timer === 900) {
      stopRecording();
      onClose();
    }
  }, [timer]);
  return (
    <div className={isActive ? 'audio-recorder active' : 'audio-recorder'}>
      <div className="recorder">
        {status !== 'idle' && (
        <div className="timer">
          00:0
          {timer}
        </div>
        )}
        <div className="microphone">
          <div className={status === 'recording' ? 'waves active' : 'waves'} />
          <Button className="start-btn" onClick={() => handleStartStop()}>
            {['recording', 'paused'].includes(status) ? <StopRecordSvg /> : <AudioOutlined />}
          </Button>
        </div>
        <p className="mic-txt">Press to start recording</p>
        {status !== 'idle' && (
        <div className="btn-grps">
          {status === 'recording' && (
          <Button onClick={pauseRecording}>
            <PauseCircleFilled />
            {' '}
            Pause
          </Button>
          )}
          {status === 'paused' && (
          <Button onClick={resumeRecording}>
            <PlayCircleFilled />
            {' '}
            Resume
          </Button>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
