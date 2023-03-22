import io
import tokenize
from typing import List, Tuple


class TokenizeFile():
    content: str = ""
    tokens: List[Tuple] = []
    indent_levels: List[int] = []
    blocks: List[int] = []

    def __init__(self, content: str):
        self.content = content
        file = io.BytesIO(bytes(content, 'utf-8'))
        self.tokens = list(tokenize.tokenize(file.readline))
        self.CalcIndentLevels()
        self.CalcBlocks()

    def FindTokenSequence(self, search_seq) -> List[int]:
        '''Find token sequence in longer sequence and return indices'''
        if not len(search_seq) or not len(self.tokens):
            return []
        searchpos = 0
        foundlist = []
        for ix, token in enumerate(self.tokens):
            toknum, tokval, _, _, _ = token
            searchpos = searchpos + 1 if (toknum, tokval) == search_seq[searchpos] else 0
            # Search term found
            if searchpos == len(search_seq):
                foundlist.append(ix - searchpos + 1)
                searchpos = 0
        return foundlist

    def GetLineNumberFromPos(self, pos) -> int:
        _, _, start, _, _ = self.tokens[pos]
        row, _ = start
        return row

    def GetIndentLevel(self, linenumber):
        pos = self.GetIndexOfLine(linenumber)
        indent = 0
        while True:
            toknum, _, _, _, _ = self.tokens[pos]
            if toknum == 5:  # 5 = indent
                indent += 1
            else:
                break
            pos += 1
        return indent

    def GetIndentLevelFromPos(self, pos):
        indent = 0
        for token in self.tokens[:pos - 1]:
            toknum, _, _, _, _ = token
            if toknum == 5:  # 5 = indent
                indent += 1
            if toknum == 6:  # 6 = dedent
                indent -= 1
        return indent

    def GetIndexOfLine(self, linenumber):
        for ix, token in enumerate(self.tokens):
            _, _, start, _, _ = token
            row, col = start
            if row == linenumber:
                return ix
        return None

    def GetContentBetweenTokens(self, pos_from, pos_to):
        return tokenize.untokenize(self.tokens[pos_from:pos_to + 1])

    def GetContentBetweenLines(self, line_from, line_to):
        pos_from = self.GetIndexOfLine(line_from)
        pos_to = self.GetIndexOfLine(line_to + 1)
        return self.GetContentBetweenTokens(pos_from, pos_to - 1)

    def GetIndentBlock(self, linenumber, indentlevel):
        pos_start = self.GetIndexOfLine(linenumber)
        pos = pos_start + self.GetIndentLevel(linenumber)
        indent = 0
        while True:
            token = self.tokens[pos]
            toknum, _, _, _, _ = token
            if toknum == 5:  # 5 = indent
                indent += 1
            if toknum == 6:  # 6 = dedent
                indent -= 1
            if indent < 0:
                break
            pos += 1
        return self.GetContentBetweenTokens(pos_start, pos)

    def GetBlock(self, search_seq, ignore_tokens):
        pos = self.FindTokenSequence(search_seq)
        linenumber = self.GetLineNumber(pos[0])
        indentlevel = self.GetIndentLevel(linenumber)
        return self.GetIndentBlock(linenumber + 1, indentlevel + 1)

    def CalcIndentLevels(self):
        '''Return indentation levels for each line in the file'''
        indent_list = [None] * (self.tokens[-1][2][0] + 1)
        indent = 0
        for token in self.tokens:
            toknum, _, start, _, _ = token
            row, _ = start
            if toknum == 5:  # 5 = indent
                indent += 1
                print(f"indent {indent=}")
            if toknum == 6:  # 6 = dedent
                indent -= 1
                print(f"dedent {indent=}")
            # Update indent for line
            indent_list[row] = indent
        self.indent_levels = indent_list

    def GetIndentLevels(self):
        return self.indent_levels

    def CalcBlocks(self):
        self.blocks = self.GetMembershipFromList(self.indent_levels)

    def GetBlockList(self, level=1):
        '''Return block membership by number, separated at the specified level'''
        if level:
            blocks = [block if block <= level else level for block in self.blocks]
        else:
            blocks = self.blocks
        return self.GetMembershipFromList(blocks)

    def GetMembershipFromList(self, blocks):
        '''Return membership indices indicating which block each line belongs to'''
        index = 0
        lastblock = 0
        block_membership = blocks  # populate vector
        for ix, block in enumerate(blocks):
            if block != lastblock:
                index += 1
                lastblock = block
            block_membership[ix] = index
        return block_membership
