import 'regenerator-runtime/runtime'
import Head from "next/head"
import { Inter } from "next/font/google"
import styles from "@/styles/Home.module.css"
import ClipLoader from "react-spinners/ClipLoader";
import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'

const Dictaphone = dynamic(() => import('@/components/Dictaphone'), { ssr: false })
const Recorder = dynamic(() => import('@/components/Recorder'), {ssr: false})

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  const [text, setText] = useState("")
  const [bslText, setBslText] = useState("")
  const [havePose, setHavePose] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState([])
  const [loading, setLoading] = useState(false)
  // const [stopPressed, setStopPressed] = useState(false)
  const [reset, setReset] = useState(false)
  const [audio, setAudio] = useState(null)

  const getData = async () => {
    let spokenText;
    try {
      // send audio file
      let audioFileObj = new FormData();
      audioFileObj.append("audio", audio);
      const pathToAudio = "http://127.0.0.1:5000/audio"
      const audioText = await fetch(pathToAudio, {
        method: 'POST',
        body: audioFileObj
      })
      if (!audioText.ok) {
        throw Error(`${audioText.status} status response from server. ${audioText.statusText}`)
      }
      const data = await audioText.json()
      console.log(data)
      spokenText = data["text"]
      setText(spokenText)
    } catch(e) {
      setError(errors => [...errors, `Cannot get transcribed text. Error: [${e.message}]`])
      return null
    }
    let bslTextTemp
    try {
      // Convert text to BSL grammar text via openai chatgpt
      const words = spokenText.split(" ")
      if (words.length == 1) {
        bslTextTemp = spokenText
        setBslText(spokenText)
      } else {
        const pathToBsl = `http://127.0.0.1:5000/bsl?text=${encodeURIComponent(spokenText)}`
        const bslTextRes = await fetch(pathToBsl)
        if (!bslTextRes.ok) {
          throw Error(`${bslTextRes.status} status response from server`)
        }
        const bsl = await bslTextRes.json()
        bslTextTemp = bsl["data"].toLowerCase()
        setBslText(bslTextTemp)
      }
    } catch (e) {
      setError(errors => [...errors, `Cannot get BSL text. Error: ${e.message}`])
      return null
    }
    
    let poseFileObj = new FormData();
    try {
      // Convert BSL text to pose
      const pathToPose = `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=${encodeURIComponent(bslTextTemp)}&spoken=en&signed=bfi`
      const res = await fetch(pathToPose)
      if (!res.ok) {
        throw Error(`${res.status} status response from server`)
      }
      const buffer = await res.arrayBuffer()
      setHavePose(true)
      const blobObj = new Blob([buffer]);
      poseFileObj.append("myfile", blobObj);
    } catch (e) {
      setError(errors => [...errors, `Cannot get pose file for text. Error: ${e.message}`])
      return null
    }

    try {
      // Convert Pose to video
      const pathToVideo = "http://127.0.0.1:5000/video"
      const video = await fetch(pathToVideo, {
        method: 'POST',
        body: poseFileObj
      })
      if (!video.ok) {
        throw Error(`${video.status} status response from server. ${video.statusText}`)
      }
      const blob = await video.blob()
      return blob
    } catch(e) {
      setError(errors => [...errors, `Cannot get video. Error: [${e.message}]`])
      return null
    }
  }

  useEffect(() => {
    // For use with Dictaphone which uses Web Speech API
    // if (stopPressed && text.length > 0) {
    //   setStopPressed(false)
    //   setLoading(true)
    //   getData().then(blob => {
    //     setData(blob)
    //     setLoading(false)
    //   })
    // } else if (stopPressed) {
    //   setStopPressed(false)
    // }

    // For use with Recorder, which uses Azure Speech API
    if (audio != null) {
      // setStopPressed(false)
      setLoading(true)
      getData().then(blob => {
        setData(blob)
        setLoading(false)
      })
    }
  }, [
    // stopPressed, 
    audio
  ])

  useEffect(() => {
    if (reset) {
      setReset(false)
      // setStopPressed(false)
      setLoading(false)
      setAudio(null)
      setText("")
      setData(null)
      setBslText("")
      setHavePose(false)
      setError([])
    }
  }, [reset])
  
  return (
    <>
      <Head>
        <title>Speech to BSL</title>
        <meta name="description" content="Generate BSL videos from spoken speech" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
          <h1>Speech To BSL</h1>
          <Recorder setAudio={setAudio} setReset={setReset} />
          {audio != null ? <audio src={URL.createObjectURL(audio)} controls></audio> : null}
          <ClipLoader
            color={"#ffffff"}
            loading={loading}
            size={150}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          {/* <Dictaphone setText={setText} setStopPressed={setStopPressed} setReset={setReset}/> */}
          {text.length > 0 ? <><br /><p>Spoken text: <strong>{text}</strong></p></> : null}
          {bslText.length > 0 ? <><br /><p>BSL Text: <strong>{bslText}</strong></p></> : null}
          {havePose ? <><br /><p>Pose file for BSL gestures retrieved</p></> : null}
          {error.length > 0 ? (error.map(e => <div key={e}><br/><p>{e}</p></div>)) : null}
          {data !== null ? (<><br /><p>Pose file converted to video:</p><video width="500px" height="500px" autoPlay controls><source src={URL.createObjectURL(data)} type="video/mp4"></source></video></>) : null }
      </main>
    </>
  )
}
