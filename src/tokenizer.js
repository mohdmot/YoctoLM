export class Tokenizer {
    constructor() {
        this.counter = 4;
        this.tokens2Id = {'<|end|>':1};
        this.id2Token = {1:'<|end|>'};

        this.totalTokens = 0;
        this.tokenFrequency = {};

        this.mode = 'train'; // 'train' or 'generate'
    }

    tokenize (token) {
        if (!(token in this.tokens2Id)) {
            this.tokens2Id[token] = this.counter;
            this.id2Token[this.counter] = token;
            this.counter++
        }
        if (this.mode === 'train') {
            if (!this.tokenFrequency[token]) {
                this.tokenFrequency[token] = 0;
            }
            this.tokenFrequency[token]++;
            this.totalTokens++;
        }
        return this.tokens2Id[token];
    }

    detokenize (id) {
        if (id in this.id2Token) {
            return this.id2Token[id];
        }else{
            return ''
        }
    }
}