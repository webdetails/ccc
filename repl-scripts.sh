#!/bin/sh

# create one .out file per html
for file in examples/*.html; do perl ./repl-scripts.pl $file ccc-bundle-files.txt > $file.out; done;

# move .out files into .html files
for file in examples/*.out; do mv $file ${file/%.html.out/.html}; done;