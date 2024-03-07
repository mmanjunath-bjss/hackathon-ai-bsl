import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

const Recorder = ({ setAudio, setReset }) => {
  const recorderControls = useAudioRecorder()

  function handleReset() {
    setReset(true);
  }

  return (
    <div style={{display: "flex", justifyContent: "space-evenly"}} >
      <AudioRecorder 
        onRecordingComplete={async (blob) => {
          const ffmpeg = new FFmpeg();
          ffmpeg.on('log', ({ message }) => {
            console.log(message)
          })
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
          })

          const inputName = 'input.webm';
          const outputName = 'output.wav';

          await ffmpeg.writeFile(inputName, await fetchFile(blob));

          await ffmpeg.exec(['-i', inputName, '-vn', outputName]);

          const outputData = await ffmpeg.readFile(outputName);
          const outputBlob = new Blob([outputData.buffer], { type: 'audio/wav' });

          setAudio(outputBlob)
        }}
        recorderControls={recorderControls}
        showVisualizer={true}
      />
      <button onClick={() => handleReset()} className='microphone'>Reset</button>
    </div>
  )
}
export default Recorder