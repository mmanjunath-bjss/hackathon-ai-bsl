import 'regenerator-runtime/runtime'
import Head from "next/head"
import { Inter } from "next/font/google"
import styles from "@/styles/Home.module.css"
import ClipLoader from "react-spinners/ClipLoader";
import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'

const Dictaphone = dynamic(() => import('@/components/Dictaphone'), { ssr: false })

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  const [text, setText] = useState("")
  const [bslText, setBslText] = useState("")
  const [havePose, setHavePose] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [stopPressed, setStopPressed] = useState(false)
  const [reset, setReset] = useState(false)

  const getData = async () => {
    try {
      // Convert text to BSL grammar text via openai chatgpt
      const words = text.split(" ")
      let bslTextTemp
      if (words.length == 1) {
        bslTextTemp = text
        setBslText(text)
      } else {
        const pathToBsl = `http://127.0.0.1:5000/bsl?text=${encodeURIComponent(text)}`
        const bslTextRes = await fetch(pathToBsl)
        const bsl = await bslTextRes.json()
        bslTextTemp = bsl["data"].toLowerCase()
        setBslText(bslTextTemp)
      }
    
      // Convert BSL text to pose
      const pathToPose = `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=${encodeURIComponent(bslTextTemp)}&spoken=en&signed=bfi`
      const res = await fetch(pathToPose)
      const buffer = await res.arrayBuffer()
      setHavePose(true)
      var blobObj = new Blob([buffer]);
      var obj = new FormData();
      obj.append("myfile", blobObj);
      console.log(buffer)

      // Convert Pose to video
      const pathToVideo = "http://127.0.0.1:5000/video"
      const video = await fetch(pathToVideo, {
        method: 'POST',
        body: obj
      })
      const blob = await video.blob()
      return blob
    } catch(e) {
      setError(`Something went wrong. Error: [${e.message}]`)
      return null
    }
  }

  useEffect(() => {
    if (stopPressed && text.length > 0) {
      setStopPressed(false)
      setLoading(true)
      getData().then(blob => {
        setData(blob)
        setLoading(false)
      })
    } else if (stopPressed) {
      setStopPressed(false)
    }
  }, [stopPressed])

  useEffect(() => {
    if (reset) {
      setReset(false)
      setStopPressed(false)
      setLoading(false)
      setData(null)
      setBslText("")
      setHavePose(false)
      setError("")
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
          <Dictaphone setText={setText} setStopPressed={setStopPressed} setReset={setReset}/>
          {text.length > 0 ? <><br /><p>Spoken text: <strong>{text}</strong></p></> : null}
          <ClipLoader
            color={"#ffffff"}
            loading={loading}
            size={150}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          {bslText.length > 0 ? <><br /><p>BSL Text: <strong>{bslText}</strong></p></> : null}
          {havePose ? <><br /><p>Pose file for BSL gestures retrieved</p></> : null}
          {error.length > 0 ? <><br/><p>{error}</p></> : null}
          {data !== null ? (<><br /><p>Pose file converted to video:</p><video width="500px" height="500px" autoPlay controls><source src={URL.createObjectURL(data)} type="video/mp4"></source></video></>) : null }
      </main>
    </>
  )
}
