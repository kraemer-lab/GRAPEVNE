import io
import tokenize
from typing import List, Dict, Tuple
from parser.TokenizeFile import TokenizeFile


def Snakefile_SplitByRules(content: str) -> dict:
    '''Tokenize Snakefile, split into 'rules', return as dict list of rules'''
    # Tokenize input, splitting chunks by 'rule' statement
    result: List = [[]]
    chunk = 0
    file = io.BytesIO(bytes(content, 'utf-8'))
    tokens = tokenize.tokenize(file.readline)
    for toknum, tokval, _, _, _ in tokens:
        if toknum == tokenize.NAME and tokval == "rule":
            chunk += 1
            result.append([])
        result[chunk].append((toknum, tokval))

    # Build JSON representation (consisting of a list of rules text)
    rules: Dict = {'block': []}
    for r in result:
        # stringify code block
        content = tokenize.untokenize(r)
        if isinstance(content, bytes):  # if byte string, decode
            content = content.decode('utf-8')
        # derive rule name
        if r[0][1] == 'rule':
            blocktype = 'rule'
            strlist = [tokval for _, tokval in r]
            index_to = strlist.index(':')
            name = ''.join(strlist[1:index_to])
        else:
            blocktype = 'config'
            name = "Configuration"
        # Find and parse input block
        ignore_tokens: List[Tuple] = []
        search_seq = [(1, "input"), (54, ":")]
        tf = TokenizeFile(content)
        tf.GetBlock(search_seq, ignore_tokens)
        input_sections: List[Tuple] = []
        # Find and parse output block
        search_seq = [(1, "output"), (54, ":")]
        output_sections: List[Tuple] = []
        # construct dictionary for block and add to list
        block = {
            'name': name,
            'type': blocktype,
            'content': content,
            'input': input_sections,
            'output': output_sections,
        }
        rules['block'].append(block)

    return rules


def Snakefile_Build(data: dict) -> str:
    '''Build Snakefile out of structured [dict] data'''
    contents = ''
    for block in data['block']:
        contents += block['content'] + '\n'
    return contents
