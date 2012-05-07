#!/bin/sh

for file in src/*.html; do perl ./repl-scripts.pl $file pvcBundleFiles.txt > $file.out; done;
for file in src/*.out; do mv $file ${file/%.html.out/.html}; done;