# Speech To BSL Hackathon

## How it works

1. Convert speech to text via browser Web Speech API
2. Convert spoken English text to BSL grammar text via OpenAI chatGPT
3. Convert BSL text to pose files via API from sign translate project (under hood is using a machine learning model training on sign language poses)
4. Convert pose sequences to a video to visualise the poses via code from sign language processing libraries like pose-format and opencv

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

- sign translate project: https://github.com/sign/translate
- sign language processing projects: https://github.com/sign-language-processing
- OpenAI chatGPT: https://platform.openai.com/overview
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition