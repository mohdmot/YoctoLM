export function pickToken(possibilities, temperature = 1, bestWeightedTokens = {}) {
    temperature = Math.max(0.01, temperature);
    let weighted = [];

    //  possibilities --> {tokenId: count}
    for (let [tokenId, count] of Object.entries(possibilities)) {
        let bonus  = (bestWeightedTokens[tokenId]*10) || 1;
        let weight = Math.pow( count*bonus, 1 / temperature );
        weighted.push({
            token: Number(tokenId),
            weight: weight * bonus
        });
    }

    let totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (let item of weighted) {
        random -= item.weight;
        if (random <= 0) return item.token;
    }
    return weighted[weighted.length - 1].token;
}



export function top_percent(object, percent = 0.5) {
    let scores = Object.keys(object).map(Number);
    let maxScore = Math.max(...scores);
    let allowedScore = maxScore * percent;
    let new_object = {};
    for (let [score, values] of Object.entries(object)) {
        score = Number(score);
        if (score >= allowedScore) {
            new_object[score] = values;
        }
    }
    return new_object;
}



const STOPWORDS = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'how', 'why', 'when',
    'where', 'who', 'which', 'do', 'does', 'did', 'can', 'could',
    'would', 'should', 'about', 'and', 'or', 'in', 'on', 'at', 'to'
]);

export function advancedSimilarity(tokenizer, a, b) {
    if (a.length === 0 || b.length === 0) return 0;
    if (JSON.stringify(a) === JSON.stringify(b)) return 1;

    const RARITY_SCALAR = 3;
    const STOPWORD_PENALTY = 0.4;

    const getTokenWeight = (token) => {
        const freq = (tokenizer.tokenFrequency[token] || 1) + 1;
        let weight = (tokenizer.totalTokens / freq) * RARITY_SCALAR;

        // 👈 فحص الكلمة إذا كانت من الـ Stopwords لتقليل وزنها
        const word = tokenizer.detokenize([token]).toLowerCase().trim();
        if (STOPWORDS.has(word)) {
            weight *= STOPWORD_PENALTY; 
        }

        return weight;
    };


    const tokensA = a;
    const tokensB = b;

    const buildGrams = (tokens) => {
        const grams = new Map();

        // ✅ Unigrams للتوكن المفرد أو كـ component إضافي
        for (let i = 0; i < tokens.length; i++) {
            const key = `U:${tokens[i]}`;
            const weight = getTokenWeight(tokens[i]) * 0.5; // وزن أقل من bigrams
            grams.set(key, (grams.get(key) || 0) + weight);
        }

        // Bigrams
        for (let i = 0; i < tokens.length - 1; i++) {
            const key = `B:${tokens[i]}-${tokens[i+1]}`;
            const weight = (getTokenWeight(tokens[i]) + getTokenWeight(tokens[i+1])) / 2;
            grams.set(key, (grams.get(key) || 0) + weight);
        }

        return grams;
    };

    const gramsA = buildGrams(tokensA);
    const gramsB = buildGrams(tokensB);

    let intersectionWeight = 0;
    let unionWeight = 0;

    const allKeys = new Set([...gramsA.keys(), ...gramsB.keys()]);
    for (const key of allKeys) {
        const wA = gramsA.get(key) || 0;
        const wB = gramsB.get(key) || 0;
        intersectionWeight += Math.min(wA, wB);
        unionWeight += Math.max(wA, wB);
    }

    if (unionWeight === 0) return 0;
    return intersectionWeight / unionWeight;
}