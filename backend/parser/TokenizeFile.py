import io
import tokenize
from typing import List, Tuple


class TokenizeFile():
    content: str = ""
    tokens: List[Tuple] = []

    def __init__(this, content: str):
        this.content = content
        file = io.BytesIO(bytes(content, 'utf-8'))
        this.tokens = list(tokenize.tokenize(file.readline))

    def FindTokenSequence(this, search_seq) -> List[int]:
        '''Find token sequence in longer sequence and return indices'''
        if not len(search_seq) or not len(this.tokens):
            return []
        searchpos = 0
        foundlist = []
        for ix, token in enumerate(this.tokens):
            toknum, tokval, _, _, _ = token
            searchpos = searchpos + 1 if (toknum, tokval) == search_seq[searchpos] else 0
            # Search term found
            if searchpos == len(search_seq):
                foundlist.append(ix - searchpos + 1)
                searchpos = 0
        return foundlist

    def GetLineNumberFromPos(this, pos) -> int:
        _, _, start, _, _ = this.tokens[pos]
        row, _ = start
        return row

    def GetIndentLevel(this, linenumber):
        pos = this.GetIndexOfLine(linenumber)
        indent = 0
        while True:
            toknum, _, _, _, _ = this.tokens[pos]
            if toknum == 5:  # 5 = indent
                indent += 1
            else:
                break
            pos += 1
        return indent

    def GetIndentLevelFromPos(this, pos):
        indent = 0
        for token in this.tokens[:pos - 1]:
            toknum, _, _, _, _ = token
            if toknum == 5:  # 5 = indent
                indent += 1
            if toknum == 6:  # 6 = dedent
                indent -= 1
        return indent

    def GetIndexOfLine(this, linenumber):
        for ix, token in enumerate(this.tokens):
            _, _, start, _, _ = token
            row, col = start
            if row == linenumber:
                return ix
        return None

    def GetContentBetweenTokens(this, pos_from, pos_to):
        return tokenize.untokenize(this.tokens[pos_from:pos_to+1])

    def GetContentBetweenLines(this, line_from, line_to):
        pos_from = this.GetIndexOfLine(line_from)
        pos_to = this.GetIndexOfLine(line_to + 1)
        return this.GetContentBetweenTokens(pos_from, pos_to - 1)

    def GetIndentBlock(this, linenumber, indentlevel):
        pos_start = this.GetIndexOfLine(linenumber)
        pos = pos_start + this.GetIndentLevel(linenumber)
        indent = 0
        while True:
            token = this.tokens[pos]
            toknum, _, _, _, _ = token
            print(toknum)
            if toknum == 5:  # 5 = indent
                indent += 1
            if toknum == 6:  # 6 = dedent
                indent -= 1
            if indent < 0:
                break
            pos += 1
        return this.GetContentBetweenTokens(pos_start, pos)

    def GetBlock(this, search_seq, ignore_tokens):
        pos = this.FindTokenSequence(search_seq)
        linenumber = this.GetLineNumber(pos[0])
        indentlevel = this.GetIndentLevel(linenumber)
        return this.GetIndentBlock(linenumber + 1, indentlevel + 1)
