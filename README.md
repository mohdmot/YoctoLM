<p align="center"><img src="/img/logo.png" width="70%"></p>

#

**YoctoLM** is an ultra-lightweight, high-performance, and resource-efficient Small Language Model (SLM) environment designed to run seamlessly across both **Node.js** and **Modern Web Browsers**. 

By utilizing an elegant N-gram probabilistic framework backed by an intelligent, frequency-weighted semantic similarity fallback algorithm, YoctoLM provides fast intent-matching and text generation without the heavy memory overhead of massive modern LLMs.

## ✨ Features

*   **Isomorphic & Universal:** One codebase that automatically detects its environment—running native `fs/promises` in Node.js or `fetch()` in the browser.
*   **Weighted N-Gram Architecture:** Implements variable context windows to map linguistic dependencies efficiently.
*   **Intent-Matching Engine:** Features an advanced token-similarity algorithm weighted by inverse term frequency (IDF) to dynamically prioritize high-value words over common structural words (e.g., *what*, *is*, *the*).
*   **Dynamic Fallback Loading:** Safely attempts to fetch training datasets locally first; if the local environment is restricted (e.g., browser CORS), it smoothly falls back to a remote GitHub repository.
*   **Configurable Generation:** Complete control over randomness with parameterized `temperature` logic during token selection.
*   **Customizability:** You can train it on your own data.


## 📁 Project Architecture

To maintain clean code separation, scalability, and ease of deployment, the project is structured into four specialized modules:

*   `tokenizer.js`: Manages word-to-ID mappings, dictionaries, and global token frequency counting during training.
*   `similarity.js`: Houses mathematical operations including the weighted Jaccard/Bigram overlapping calculations and probability selection algorithms.
*   `yoctolm.js`: The central brain orchestrating the custom sequence trainer, context windows, and token generation loops.
*   `main.js`: The central entry point responsible for environment handling, dataset ingestion, performance benchmarking, and testing prompt outputs.
*   `index.html`: A formatted web page is a chat for direct interaction with the form within the browser.

## 🚀 Getting Started

#### Download Source
- Click `Code` > `Download ZIP`.
- or using `git` :
```bash
git clone https://github.com/mohdmot/YoctoLM.git
```
- Unzip it.

### 1. Using Chat Webpage :
- Run local server in `src` folder:
```
# Using npx
npx serve . -l 8080

# Or using Python
python -m http.server 8080
```
- Go to http://localhost:8080

Now enjoy the chat experience!

### 2. Using Node.js
Just run it `/src/test.js` :
```bash
node test.js
```

![](/img/screenshot.gif)

## 📄 Data
In the `utils` folder you will find everything you need. We used the [dailydialog dataset](https://huggingface.co/datasets/roskoN/dailydialog) for training and added an AI-generated dataset to train the model on it. In total 90,000 question, So .. How to add a new data ?

### 1. Generate
You can use any available AI (I recommend DeepSeek) you have to generate questions and answers in this format.
```
Hello __eou__ Hi there
How are you ? __eou__ I'm Fine.
```
Or format an entire conversation in one line
```
Matthew ? Hi ! __eou__ Steve ! Haven't seen you in ages ! How long's it been ? __eou__ It's got to be almost a year now . __eou__ How have you been ? __eou__ I'm pretty good . I've been looking for a place to live recently . My lease runs out next month and I don't want to renew it . __eou__ Yeah , I remember the neighborhood . Have you found a place yet ? __eou__ Not yet . But I am still looking through the classifieds . Wish me luck . __eou__ Well , maybe I can help . Remember my neighbor ? __eou__ Mrs . Thou ? __eou__ Yes , her daughter's having a baby , so she's moving in with her to help out . I think if you are interested , you can come over and have a look . __eou__ Great . It's a lovely neighborhood . And it would be nice to be neighbors again . It would be just like the old days ! __eou__ I'll ask Mrs . Thou when she's available to show the apartment and let you know . Has your number changed ? __eou__
```
Remember that each line is independent of the other.

### 2. Prepare
Now we need to convert it into a JSON file containing all the questions and answers in a unified format:
```
[
  {"q": "hi there", "a": "hello! how are you today?"},
  {"q": "how are you", "a": "i am doing great, thanks for asking."},
  {"q": "what is your name", "a": "i am a tiny language model."},
  {"q": "what time is it", "a": "i do not have a watch, sorry."},
  {"q": "are you a human", "a": "no, i am an ai assistant."}
]
```
Add your generated data to a text file in the `utils` folder, then add it to the datasets list in `prepare_data.py` :
```
datasets_files = ['ai_generated.txt','dialogues_train.txt', 'dialogues_test.txt', 'dialogues_validation.txt']
data_n = 1500000000 # All avaliable question 
```
Now you have `training_data.json`, move it to the required location.

## 📝 License

This project is open-source and available under the MIT License.