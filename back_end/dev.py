#!/usr/bin/python
import re

def removeComments(string):
    string = re.sub(re.compile("/\*.*?\*/",re.DOTALL ) ,"" ,string) # remove all occurance streamed comments (/*COMMENT */) from string
    string = re.sub(re.compile("//.*?\n" ) ,"" ,string) # remove all occurance singleline comments (//COMMENT\n ) from string
    return string
    
with open("glass_cat_dev.js", "w") as fout:
    with open("glass_cat.js", "r") as fin:
        for line in fin:
            a = line.replace('editor.getValue()', 'document.getElementById("code_"+thevalueoftheexeclick_2).value')
            a = a.replace('sem = sem.concat.apply(sem, this.semantic);', 'sem = sem.concat.apply(sem, this.semantic);\n\ta = JSON.stringify(sem);a = a.split("</p>").join("\\n");\n\ta = a.split("<p>").join("");\n\tcur_sem=a;')            
            fout.write(a)

with open("glass_cat_dev-min.js", "w") as fout:
    with open("glass_cat-min.js", "r") as fin:
        for line in fin:
            a = line.replace('editor.getValue()', 'document.getElementById("code_"+thevalueoftheexeclick_2).value')
            a = a.replace('sem = sem.concat.apply(sem, this.semantic);', 'sem = sem.concat.apply(sem, this.semantic);\n\tcur_sem=sem;')            
            fout.write(a)            