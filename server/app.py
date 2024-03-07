import os
import time
import cv2
import dotenv
import azure.cognitiveservices.speech as speechsdk
from pose_format import Pose
from pose_format.pose_visualizer import PoseVisualizer
from pose_format.utils.generic import correct_wrists, reduce_holistic
from tqdm import tqdm
from flask import Flask, request, send_file, make_response
from openai import AzureOpenAI
from moviepy.editor import *
dotenv.load_dotenv()

openai_key=os.environ.get("OPENAI_API_KEY")
os.environ["BJSS_ENDPOINT"] = "https://in-bjss-openai.openai.azure.com/"
client = AzureOpenAI(
    azure_endpoint=os.getenv("BJSS_ENDPOINT"), 
    api_key=openai_key,
    api_version="2024-02-15-preview"
)

app = Flask(__name__)

@app.route("/")
def server():
    return "<p>server up</p>"

@app.post("/audio")
def get_audio():
    file = request.files.get("audio")
    filename = "audio.wav"
    # Save file to use with azure speech service
    file.save(filename)
    file.close()
    speech_key = os.environ.get("AZURE_SPEECH_KEY")
    service_region = "westeurope"
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
    # Set the audio file path
    audio_file = filename
    # Set up the audio configuration
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    # Create a speech recognizer object
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
    # Create an empty list to store the transcription results
    transcriptions = []
    # Define an event handler for continuous recognition
    def continuous_recognition_handler(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            transcriptions.append(evt.result.text)
    # Start continuous recognition
    speech_recognizer.recognized.connect(continuous_recognition_handler)
    speech_recognizer.start_continuous_recognition()
    # # Wait for the recognition to complete
    # Set a timeout value (in seconds) based on your audio file length
    clip = AudioFileClip(filename)
    timeout_seconds = clip.duration
    timeout_expiration = time.time() + timeout_seconds
    while time.time() < timeout_expiration:
        time.sleep(1)  # Adjust the sleep duration as needed
    # Stop continuous recognition
    speech_recognizer.stop_continuous_recognition()
    # Combine transcriptions into a single string
    transcription = ' '.join(transcriptions)
    data = {"text": transcription}
    response = make_response(data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response
        

@app.route("/bsl")
def text_to_bsl_grammar():
    text = request.args.get('text')
    completion = client.chat.completions.create(
        model="chat-test", # model = "deployment_name".
        messages=[
            {
                "role": "system", "content": f"You're an expert translating spoken English into British Sign Language, also known as BSL." +
                "BSL word order follows these rules." +  
                "First the timeframe if any," +
                "then location if any," +
                "then the object if any," +
                "then the subject if any," +
                "then the verb if any" +
                "and finally the question if any."
            },
            {   
                "role": "user", "content": f"Convert this English sentence to BSL word order and only return the BSL sentence: {text}"
            },
        ]
    )
    data = {"data": completion.choices[0].message.content}
    response = make_response(data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route("/video", methods=['POST'])
def pose_to_video():
    uploaded_file = request.files.get('myfile')
    data = uploaded_file.read()
    pose = Pose.read(data)
    pose = reduce_holistic(pose)
    correct_wrists(pose)
    v = PoseVisualizer(pose)
    frames = v.draw()
    video = None
    for frame in tqdm(frames):
        if video is None:
            height, width, _ = frame.shape
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
            video = cv2.VideoWriter(filename="sign.mp4",
                                    apiPreference=cv2.CAP_FFMPEG,
                                    fourcc=fourcc,
                                    fps=pose.body.fps,
                                    frameSize=(height, width))

        video.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
    video.release()
    response = make_response(send_file("sign.mp4", mimetype='video/mp4'))
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response
  