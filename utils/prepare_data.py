import json

final_json = []
datasets_files = ['ai_generated.txt','dialogues_train.txt', 'dialogues_test.txt', 'dialogues_validation.txt']
data_n = 1500000000 # All

for file in datasets_files:
    added_q = 0
    for line in open(file, encoding='utf-8').readlines():
        line = line.split('__eou__')
        if '' in line: line.remove('')
        if ' ' in line: line.remove(' ')
        
        while len(line) >= 2:
            if line[0].strip() != '' and line[1].strip() != '':
                final_json.append({'q': line[0].strip(), 'a': line[1].strip()})
                added_q += 1
            line.remove(line[0])
        
        if added_q >= (data_n/len(datasets_files)):
            break

with open('training_data.json', 'w') as f:
    json.dump(final_json, f)
