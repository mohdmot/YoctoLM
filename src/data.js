export async function loadTrainingData (filename='training_data.json') {
    // 1. الرابط الأساسي لمستودع GitHub الخاص بك (احرص على إنهاء الرابط بـ /)
    const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/USERNAME/REPO_NAME/main/src/';
    const remoteUrl = `${GITHUB_BASE_URL}${filename}`;

    const isNode = typeof globalThis.process !== 'undefined' && globalThis.process.versions && globalThis.process.versions.node;

    try {
        if (isNode) {
            console.log(`[Node.js] Attempting to read '${filename}' from local disk...`);
            const { readFile } = await import('fs/promises');
            const data = await readFile(filename, 'utf-8');
            console.log(`[SUCCESS] Loaded '${filename}' locally via fs.`);
            return JSON.parse(data);
        } else {
            console.log(`[Browser] Attempting to fetch '${filename}' locally...`);
            const response = await fetch(filename);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            console.log(`[SUCCESS] Loaded '${filename}' locally via fetch.`);
            return await response.json();
        }
    } catch (localError) {
        console.warn(`[WARN] Local read failed: ${localError.message}. Switching to GitHub fallback...`);

        try {
            console.log(`[Remote] Fetching from: ${remoteUrl}`);
            
            const response = await fetch(remoteUrl);
            if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
            
            console.log(`[SUCCESS] Loaded '${filename}' remotely from GitHub.`);
            return await response.json();
        } catch (remoteError) {
            console.error(`[CRITICAL] Error: Could not load '${filename}' from local environment OR GitHub.`);
            throw remoteError;
        }
    }
}