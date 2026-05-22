import { YoctoLM } from './yoctolm.js';
import { loadTrainingData } from './data.js';

let trainingData = await loadTrainingData('training_data.json');

let yocto = new YoctoLM();
//yocto.temperature = 0.1;

let start_training = new Date();
yocto.train(trainingData);
let end_training = new Date();
console.log(`[INFO] Training completed in ${(end_training - start_training) / 1000} seconds.`);

const prompt = "hi"; 

let start_generation = new Date();
let output = yocto.generate(prompt,1000)
let end_generation = new Date();
console.log(`[INFO] Generation completed in ${(end_generation - start_generation) / 1000} seconds.`)

console.log(output);
