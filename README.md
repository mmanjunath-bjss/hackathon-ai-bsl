# Speech To BSL Hackathon

## How the application works

1. Click start microphone and speak
2. Speech converted to text as spoken via React library `react-speech-recognition`<https://www.npmjs.com/package/react-speech-recognition>, which uses web speech api <https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition>
3. Text sent to backend using api GET `/bsl`
4. Text converted to BSL grammar by OpenAI (either ChatGPT or Azure OpenAI) <https://learn.microsoft.com/en-us/azure/ai-services/openai/quickstart> or <https://platform.openai.com/docs/quickstart>
5. BSL text sent to frontend
6. BSL text converted to a pose file via an API <https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=${encodeURIComponent(bslTextTemp)}&spoken=en&signed=bfi> from <https://github.com/sign/translate>
7. Pose file sent to backend using api GET `/video` in bytes
8. Pose file processed via python library `post-format` <https://pose-format.readthedocs.io/en/latest/>
9. Pose file converted to skeleton video via python library `opencv` <https://docs.opencv.org/4.x/>
10. Video sent to frontend
11. Video displayed on page

## Requirements

- Node 18.19.0
- Python 3.11
- OpenAI API key, either Azure or Chatgpt, and set API key environment variable in terminal e.g. on macos run `export OPENAI_API_KEY=<your_key_here>`

## To run

- Start frontend project in one terminal

```bash
cd speech-to-bsl
npm install
npm run dev
```

- Start backend server in another terminal

```bash
cd server
pip install -r requirements.txt
flask run
```

For further details, read the readme files in each folder.

## Attribution

- sign translate project: <https://github.com/sign/translate>
- sign language processing projects: <https://github.com/sign-language-processing>
- OpenAI chatGPT: <https://platform.openai.com/overview>
- Web Speech API: <https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition>
