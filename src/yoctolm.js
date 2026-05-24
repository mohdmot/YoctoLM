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
        
        text = text.replace(/"\s+([^"]+)\s+"/g, '"$1"');
        text = text.replace(/'\s+([^']+)\s+'/g, "'$1'");
        text = text.replace(/'\s+([^']+)\s+'/g, "'$1'");
        text = text.replace(/\s+-\s+/g, '-');
        text = text.replace(/\s+(’)\s+/g, '$1');
        text = text.replace(/\s+(')\s+/g, '$1');
        text = text.replace(/yoctolm/gi, 'YoctoLM');
        text = text.replace(' <|end|>', '');
        return text;
    }

    train(qaPairs) {
        this.tokenizer.mode = 'train';
        qaPairs.forEach(pair => {
            let qTokens = this.cleanText(pair.q).map(w => this.tokenizer.tokenize(w));
            let aTokens = this.cleanText(pair.a).map(w => this.tokenizer.tokenize(w));

            let endToken = this.tokenizer.tokenize('<|end|>');
            let sequence = [...aTokens, endToken];

            // 1. Save the tokenized Q&A pair in the knowledge base for intent matching during generation
            this.knowledgeBase.push({ q: qTokens, a: sequence });

            // 2. Train the n-gram model on the answer tokens (including the end token)
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

        let best_similarity = {}
        this.knowledgeBase.forEach( kb => {
            let score = advancedSimilarity(this.tokenizer, promptTokens, kb.q);
            best_similarity[score] = kb;
        });

        let best3 = Object.keys(best_similarity).sort((a,b) => b - a).slice(0,3);
        
        console.log(`\n[DEBUG] Top 3 similarity scores: ${best3.join(', ')}`);
        for (let score of best3) {
            let kb = best_similarity[score];
            console.log(`[DEBUG] Similarity score: ${score}`);
            console.log(`[DEBUG] Matched question: ${kb.q.map(t => this.tokenizer.detokenize([t])).join(' ')} : ${kb.a.map(t => this.tokenizer.detokenize([t])).join(' ')}`);
        }

        let bestWeightedTokens = {} // {tokenId: weightedScore, ...}
        for (let score of best3) {
            let kb = best_similarity[score];
            kb.a.forEach(token => {
                if (!bestWeightedTokens[token]) {
                    bestWeightedTokens[token] = 0;
                }
                bestWeightedTokens[token] += Number(score);
            });
        }
        let bestMatch = best_similarity[best3[0]];
        let highestScore = Number(best3[0]);

        if (highestScore < 0.135) {bestMatch = null;}

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
                possibilities = this.ngrams[currentContext];
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

            function possibilitiesToString(poss,tokenizer) {
                let result = {};
                Object.entries(poss).forEach(([key, value]) => {
                    result[ tokenizer.detokenize(key) ] = value;
                });
                return result;
            }
            console.log(`[DEBUG] possibilities: ${JSON.stringify(possibilitiesToString(possibilities, this.tokenizer))}...`);

            if (!possibilities || Object.keys(possibilities).length === 0) break;

            let nextTokenId = Number(pickToken(possibilities, this.temperature, bestWeightedTokens));

            let nextWord = this.tokenizer.detokenize(nextTokenId);
            if (nextWord === '<|end|>') break;

            outputTokens.push(nextTokenId);
        }

        return this.prepareOutput( outputTokens.map(id => this.tokenizer.detokenize(id)) );
    }
}