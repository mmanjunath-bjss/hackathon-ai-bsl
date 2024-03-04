import React, {useEffect} from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

const Dictaphone = ({setText, setStopPressed, setReset}) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  useEffect(() => {
    setText(transcript)
  }, [transcript])

  useEffect(() => {
    if (listening == false) {
      setStopPressed(true)
    }
  }, [listening])

  function handleReset() {
    resetTranscript();
    setReset(true);
  }

  return (
    <div style={{display: "flex", justifyContent: "space-evenly"}}>
      <p className='microphone'>Microphone: {listening ? 'on' : 'off'}</p>
      <button onClick={SpeechRecognition.startListening} className='microphone'>Start Microphone</button>
      <button onClick={SpeechRecognition.stopListening} className='microphone'>Stop Microphone</button>
      <button onClick={() => handleReset()} className='microphone'>Reset</button>
    </div>
  )
}
export default Dictaphone