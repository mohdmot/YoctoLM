import json

final_json = []
datasets_files = ['dialogues_train.txt', 'dialogues_test.txt', 'dialogues_validation.txt', 'ai_generated.txt']
data_n = 150000000000 # All

for file in datasets_files:
    added_q = 0
    for line in open(file, encoding='utf-8').readlines():
        line = line.split('__eou__')
        if '' in line: line.remove('')
        if ' ' in line: line.remove(' ')
        
        while len(line) >= 2:
            if line[0].strip() != '' and line[1].strip() != '':
                line[0] = line[0].strip()
                line[1] = line[1].strip()
                if line[1][-1] not in ['.', '?', '!', '"', "'"]:
                    line[1] += '.'
                final_json.append({'q': line[0], 'a': line[1]})
                added_q += 1
            line.remove(line[0])
        
        if added_q >= (data_n/len(datasets_files)):
            break

with open('training_data.json', 'w') as f:
    json.dump(final_json, f)
