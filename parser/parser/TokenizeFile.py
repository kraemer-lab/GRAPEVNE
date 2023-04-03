import io
import tokenize
from typing import List
from typing import Tuple


class TokenizeFile:
    def __init__(self, content: str):
        self.content: str = ""
        self.tokens: List[Tuple] = []
        self.indent_levels: List[int] = []
        self.blocks: List[int] = []

        self.content = content
        file = io.BytesIO(bytes(content, "utf-8"))
        self.tokens = list(tokenize.tokenize(file.readline))
        self.CalcIndentLevels()
        self.CalcBlocks()

    def PrintTokens(self, log_fn=print, filter_token=None):
        """Pretty print tokens, with optional filter (token number or string)"""
        for ix, token in enumerate(self.tokens):
            toknum, tokval, start, end, line = token
            match = False
            if not filter_token:
                match = True
            if isinstance(filter_token, int) and toknum == filter_token:
                match = True
            if isinstance(filter_token, str) and tokval == filter_token:
                match = True
            if match:
                log_fn(ix, token)

    def FindTokenSequence(self, search_seq) -> List[int]:
        """Find token sequence in longer sequence and return indices"""
        if not len(search_seq) or not len(self.tokens):
            return []
        searchpos = 0
        foundlist = []
        for ix, token in enumerate(self.tokens):
            toknum, tokval, _, _, _ = token
            searchpos = (
                searchpos + 1 if (toknum, tokval) == search_seq[searchpos] else 0
            )
            # Search term found
            if searchpos == len(search_seq):
                foundlist.append(ix - searchpos + 1)
                searchpos = 0
        return foundlist

    def GetLineNumberFromTokenIndex(self, pos) -> int:
        _, _, start, _, _ = self.tokens[pos]
        row, _ = start
        return row

    def GetIndentLevelFromLinenumber(self, linenumber):
        return self.indent_levels[linenumber]

    def GetIndentLevelFromTokenIndex(self, pos):
        indent = 0
        for token in self.tokens[: pos - 1]:
            toknum, _, _, _, _ = token
            if toknum == 5:  # 5 = indent
                indent += 1
            if toknum == 6:  # 6 = dedent
                indent -= 1
        return indent

    def GetFirstTokenIndexOfLine(self, linenumber):
        for ix, token in enumerate(self.tokens):
            _, _, start, _, _ = token
            row, col = start
            if row == linenumber:
                return ix
        return None

    def GetContentBetweenTokenIndices(self, pos_from, pos_to):
        tokens = []
        startrow = self.tokens[pos_from][2][0] - 1
        endrow = self.tokens[pos_from][3][0] - 1
        for token in self.tokens[pos_from : pos_to + 1]:
            toknum, tokval, start, end, line = token
            tokens.append(
                tokenize.TokenInfo(
                    toknum,
                    tokval,
                    (start[0] - startrow, start[1]),
                    (end[0] - endrow, end[1]),
                    line,
                )
            )
        return tokenize.untokenize(tokens)

    def GetContentBetweenLines(self, line_from, line_to):
        content = ""
        for line in range(line_from, line_to + 1):
            token = self.tokens[self.GetFirstTokenIndexOfLine(line)]
            toknum, tokval, start, end, line = token
            content += line
        return content

    def GetContentOfIndentBlock(self, linenumber, indentlevel):
        block_list = self.GetBlockList(indentlevel)
        blockno = block_list[linenumber]
        line_from = block_list.index(blockno)
        line_to = len(block_list) - block_list[::-1].index(blockno) - 1
        return self.GetContentBetweenLines(line_from, line_to)

    def GetBlock(self, search_seq, ignore_tokens):
        pos = self.FindTokenSequence(search_seq)
        if not pos:
            return None
        linenumber = self.GetLineNumberFromTokenIndex(pos[0]) + 1
        indentlevel = self.GetIndentLevelFromLinenumber(linenumber)
        return self.GetContentOfIndentBlock(linenumber, indentlevel)

    def CalcIndentLevels(self):
        """Return indentation levels for each line in the file"""
        lastlinenumber = self.tokens[-1][2][0]
        indent_list = [None] * (lastlinenumber + 1)
        indent = 0
        for token in self.tokens:
            toknum, _, start, _, _ = token
            row, _ = start
            if toknum == 5:  # 5 = indent
                indent += 1
            if toknum == 6:  # 6 = dedent
                indent -= 1
            # Update indent for line
            indent_list[row] = indent
        self.indent_levels = indent_list

    def GetIndentLevels(self):
        return self.indent_levels

    def CalcBlocks(self):
        self.blocks = self.GetMembershipFromList(self.indent_levels)

    def GetBlockList(self, level=1):
        """Return block membership by number, separated at the specified level"""
        if level:
            blocks = [
                block if block <= level else level for block in self.indent_levels
            ]
        else:
            blocks = self.blocks
        return self.GetMembershipFromList(blocks)

    def GetMembershipFromList(self, blocks):
        """Return membership indices indicating which block each line belongs to"""
        index = 0
        lastblock = 0
        block_membership = [None] * len(blocks)
        for ix, block in enumerate(blocks):
            if block != lastblock:
                index += 1
                lastblock = block
            block_membership[ix] = index
        return block_membership
