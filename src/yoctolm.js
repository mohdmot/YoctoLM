import { Tokenizer } from './tokenizer.js';
import { pickToken, top_percent, advancedSimilarity } from './similarity.js';


export class YoctoLM {
    constructor() {
        this.contextWindow = 4;
        this.minContextWindow = 2;
        this.temperature = 0.1;
        this.tokenizer = new Tokenizer();
        
        this.ngrams = {}; 
        
        this.knowledgeBase = []; 
    }

    cleanText(text) {
        text = text.toLowerCase().replace(/([.,!?;:'"-])/g, ' $1 ');
        return text.split(/\s+/).filter(w => w.length > 0);
    }

    prepareOutput(tokens) {
        tokens[0] = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1);
        for (let i = 1; i < tokens.length; i++) {
            if ('.,!?'.includes(tokens[i-1])) {
                tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
            }
        }
        let text = tokens.join(' ');
        text = text.replace(/\s+([.,!?;:])/g, '$1');
        text = text.replace(/\s+(’)\s+/g, '$1');
        text = text.replace(/"\s+([^"]+)\s+"/g, '"$1"');
        text = text.replace(/'\s+([^']+)\s+'/g, "'$1'");
        text = text.replace(/'\s+([^']+)\s+'/g, "'$1'");
        text = text.replace(/\s+-\s+/g, '-');
        return text;
    }

    train(qaPairs) {
        this.tokenizer.mode = 'train';
        qaPairs.forEach(pair => {
            let qTokens = this.cleanText(pair.q).map(w => this.tokenizer.tokenize(w));
            let aTokens = this.cleanText(pair.a).map(w => this.tokenizer.tokenize(w));

            // 1. Save the tokenized Q&A pair in the knowledge base for intent matching during generation
            this.knowledgeBase.push({ q: qTokens, a: aTokens });

            // 2. Train the n-gram model on the answer tokens
            // clean <|end|> tokens from the answer to avoid pollution of the n-grams
            let endToken = this.tokenizer.tokenize('<|end|>');
            let sequence = [...aTokens, endToken];

            for (let i = 0; i <= sequence.length - this.contextWindow; i++) {

                let contextKey = sequence.slice(i, i + this.contextWindow).join(',');
                let nextToken = sequence[i + this.contextWindow];

                if (!nextToken) continue;

                if (!this.ngrams[contextKey]) {
                    this.ngrams[contextKey] = {};
                }
                
                if (!this.ngrams[contextKey][nextToken]) {
                    this.ngrams[contextKey][nextToken] = 0;
                }
                this.ngrams[contextKey][nextToken]++;
            }
        });

        console.log(`[INFO] Trained on ${qaPairs.length} Q&A pairs and ${this.tokenizer.tokens2Id.length} tokens.`);
    }

    generate(prompt, maxLength = 50) {
        this.tokenizer.mode = 'generate';
        let promptTokens = this.cleanText(prompt).map(w => this.tokenizer.tokenize(w));
        
        let bestMatch = null;
        let highestScore = -1;

        this.knowledgeBase.forEach(kb => {
            let score = advancedSimilarity(this.tokenizer, promptTokens, kb.q);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = kb;
            }
        });

        console.log(`[DEBUG] Best match score: ${highestScore}`);
        console.log(`[DEBUG] Best match question: ${bestMatch ? bestMatch.q.map(t => this.tokenizer.detokenize([t])).join(' ') : 'None'}`);
        console.log(`[DEBUG] Best match answer: ${bestMatch ? bestMatch.a.map(t => this.tokenizer.detokenize([t])).join(' ') : 'None'}`);

        if (highestScore < 0.15) {bestMatch = null;}

        let outputTokens;
        if (!bestMatch) {
            outputTokens = "what you mean by that".split(' ').map(w => this.tokenizer.tokenize(w));
        }else{
            outputTokens = bestMatch.a.slice(0, this.contextWindow + 2);
        }
        for (let i = 0; i < maxLength; i++) {
            let currentContext = outputTokens.slice(-this.contextWindow).join(',');

            // possibilities = {nextTokenId: count, nextTokenId2: count2, ...}
            let possibilities = {}
            
            if (this.ngrams[currentContext]) {
                // Way 1: Take the exact context (if it exists)
                possibilities = this.ngrams[currentContext];
                
                // Way 2:
                /*let best_similarity = {}
                for (let [key,value] of Object.entries(this.ngrams)) {
                    key = key.split(',');
                    let score = advancedSimilarity(this.tokenizer, currentContext.split(','), key);
                    if (Object.values(best_similarity).every(v => (score >= v))) {
                        best_similarity[key.join(',')] = score;
                    }
                }*/
            }else{
                let newContextWindow = Math.max(this.minContextWindow, this.contextWindow - 1);
                for (let j = newContextWindow; j >= this.minContextWindow; j--) {
                    let shorterContext = outputTokens.slice(-j);
                    for (let [key,value] of Object.entries(this.ngrams)) {
                        if (key.endsWith(shorterContext.join(','))) {
                            possibilities = value;
                            break;
                        }
                    }
                }
            }

            if (!possibilities || Object.keys(possibilities).length === 0) break;

            let nextTokenId = Number(pickToken(possibilities, this.temperature));

            let nextWord = this.tokenizer.detokenize(nextTokenId);
            if (nextWord === '<|end|>') break;

            outputTokens.push(nextTokenId);
        }

        return this.prepareOutput( outputTokens.map(id => this.tokenizer.detokenize(id)) );
    }
}