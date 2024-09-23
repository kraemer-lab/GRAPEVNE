# Challenge

This challenge is designed to allow you to engage with GRAPEVNE using your
prefered programming or scripting language. For example, if you are comfortable
programming in R, then try to complete the challenge in R.

Build the following workflow using GRAPEVNE modules.

## Outline

Create a set of modules, and then combine that set in a hierarchy / composition
to achieve the following: download a given file and calculate the following
statistic for each letter of the alphabet:
"number of words beginning with each letter of the alphabet, minus the number
of words ending with that letter". For example,
if there were 20 words in a given file that began with the letter 'a', and 25
that ended with the letter 'a', then the output file should contain a list with
each letter of the alphabet, accompanied by the calculated metric, so the first
line would read "-5" in this case. The file should contain one line for every
letter of the alphabet.

As extended exercises:

1. limit the analysis to only consider words of a
   specified length (i.e. words between, say, 4-8 letters long)
2. plot the results as a bar graph with a separate bar for each letter of the
   alphabet.

In order to make best use of GRAPEVNE modules and hierarchies, it is recommended
to take the following approach:

### Module 1: Download a words list

Create a module (that runs in a conda environment) to download a list of words.

Here is a list of English words: [https://github.com/dwyl/english-words/blob/master/words_alpha.txt](https://github.com/dwyl/english-words/blob/master/words_alpha.txt) (credit to: [https://github.com/dwyl/english-words](https://github.com/dwyl/english-words)).

### Module 2: Count the number of words beginning with each letter of the alphabet

Create a module that takes as input a text file, and produces as output a file
listing each letter of the alphabet along with the number of words in the input
file that began with that letter.

### Module 3: Reverse a words

Create a module that reverses the text on each line of an input file, and
produces as output a file containing the reversed words.

### Module 4: Subtract two numeric files from one another

Create a module that takes as input _two_ files containing lists of numbers,
and produces as output a single file containing the difference (i.e. `a-b`)
in row-wise fashion (i.e. if file 1 contained lines `1 2 3 4 5` and file two
contained lines `3 1 5 2 3` then the output would be `-2 1 -2 2 2`).

### Extended Module 1: Filter by word length

Create a module that takes a text file as input and produces another text file
as output, where the output contains only those words that are within a
specified word length. The parameters should be adjustable but could be, for
example, larger than or equal to 4 letters and shorter than or equal to 8
letters.

### Extended Module 2: Bar graph

Create a module that produces a bar graph given an input file consisting of a
list of numbers.
