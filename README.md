scryptjs
========

scrypt algorithm implemented in javascript

# Initialize working environment
All following instructions are under the root of working directory.
```
git clone https://github.com/starain/scryptjs
git clone https://github.com/starain/closure-library
mkdir jscompiler
cd jscompiler
curl https://dl.google.com/closure-compiler/compiler-latest.zip -O # -k --ssl-added-and-removed-here-;-)
unzip compiler-latest.zip
alias jscompile="python closure-library/closure/bin/build/closurebuilder.py --root scryptjs/src --root closure-library -o compiled -c jscompiler/compiler.jar"
alias gendeps="python closure-library/closure/bin/build/depswriter.py --root_with_prefix='scryptjs/src ../../../scryptjs/src' --root_with_prefix='closure-library ../../../closure-library' > scryptjs/src/deps.js"
```

# Run tests
In the root of working directory.
```
gendeps
python -m SimpleHTTPServer 8080
```
Point your browser to http://localhost:8080/scryptjs/src/tests/crypt/scrypt_test.html

# Compile library
In the root of working directory.
```
jscompile --namespace=crypt.Scrypt
```
