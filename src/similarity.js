export function pickToken(possibilities, temperature = 1) {
    temperature = Math.max(0.01, temperature);
    let weighted = [];

    //  possibilities --> {tokenId: count}
    for (let [tokenId, count] of Object.entries(possibilities)) {
        let weight = Math.pow(count, 1 / temperature);
        weighted.push({
            token: Number(tokenId),
            weight: weight
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



export function advancedSimilarity(tokenizer, a, b) {
    if (a.length === 0 || b.length === 0) return 0;

    if (JSON.stringify(a) === JSON.stringify(b)) return 1;

    const getTokenWeight = (token) => {
        const freq = (tokenizer.tokenFrequency[token] || 0) + 1;
        return Math.log((tokenizer.totalTokens + 1) / freq);
    };
    
    const bigramsA = new Map();
    const bigramsB = new Map();

    // Sentece A
    for (let i = 0; i < a.length - 1; i++) {
        const key = `${a[i]}-${a[i+1]}`;
        const weight = (getTokenWeight(a[i]) + getTokenWeight(a[i+1])) / 2;
        bigramsA.set(key, (bigramsA.get(key) || 0) + weight);
    }

    // Sentence B
    for (let i = 0; i < b.length - 1; i++) {
        const key = `${b[i]}-${b[i+1]}`;
        const weight = (getTokenWeight(b[i]) + getTokenWeight(b[i+1])) / 2;
        bigramsB.set(key, (bigramsB.get(key) || 0) + weight);
    }

    let intersectionWeight = 0;
    let unionWeight = 0;

    // Collect all unique bigram keys from both sentences
    const allKeys = new Set([...bigramsA.keys(), ...bigramsB.keys()]);

    for (const key of allKeys) {
        const weightA = bigramsA.get(key) || 0;
        const weightB = bigramsB.get(key) || 0;

        intersectionWeight += Math.min(weightA, weightB);
        unionWeight += Math.max(weightA, weightB);
    }

    if (unionWeight === 0) return 0;

    // Final result should be between 0 and 1, where 1 means identical sentences
    return intersectionWeight / unionWeight;
}
