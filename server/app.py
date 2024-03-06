import os
import cv2
from pose_format import Pose
from pose_format.pose_visualizer import PoseVisualizer
from pose_format.utils.generic import correct_wrists, reduce_holistic
from tqdm import tqdm
from flask import Flask, request, send_file, make_response
from openai import AzureOpenAI

os.environ["OPENAI_API_KEY"] = "e3de288f417747cdb23c9c39bc440a13"
os.environ["BJSS_ENDPOINT"] = "https://in-bjss-openai.openai.azure.com/"
client = AzureOpenAI(
    azure_endpoint=os.getenv("BJSS_ENDPOINT"), 
    api_key=os.getenv("OPENAI_API_KEY"),  
    api_version="2024-02-15-preview"
)

app = Flask(__name__)

@app.route("/")
def server():
    return "<p>server up</p>"

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
  