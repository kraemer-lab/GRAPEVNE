import tokenize
import io
from typing import List, Dict, Tuple


def FindTokenSequence(tokens, search_seq) -> List[int]:
    '''Find token sequence in longer sequence and return indices'''
    if not len(search_seq) or not len(tokens):
        return []
    searchpos = 0
    foundlist = []
    for ix, token in enumerate(tokens):
        if token == search_seq[searchpos]:
            searchpos += 1  # Increment search term
        else:
            searchpos = 0  # Reset search term
        # Search term found
        if searchpos == len(search_seq):
            foundlist.append(ix - searchpos + 1)
            searchpos = 0
    return foundlist


def GetSection(r, search_seq, ignore_tokens):
    pos = FindTokenSequence(r, search_seq)
    section = []
    if len(pos) > 1:
        # Too many input sections found (malformed Snakefile?)
        pass
    if len(pos) == 1:
        # Start of input section found, now find end of section
        pass
    return section


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
        ignore_tokens: List[Tuple[int, str]] = []
        search_seq = [(1, "input"), (54, ":")]
        input_sections = GetSection(r, search_seq, ignore_tokens)
        # Find and parse output block
        search_seq = [(1, "output"), (54, ":")]
        output_sections = GetSection(r, search_seq, ignore_tokens)
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
