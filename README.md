scryptjs
========

scrypt algorithm implemented in pure javascript. Optimized by using 32 bit operation.

Tested on my Macbook Pro shown 2 - 3 times performance improvement after applies all the optimizations.

Deeply influenced by [go scrypt implementation](https://code.google.com/p/go/source/browse/scrypt/scrypt.go?repo=crypto).

# Initialize working environment
All following instructions are under the root of working directory.
```
git clone https://github.com/starain/scryptjs
git clone https://github.com/starain/closure-library
mkdir jscompiler
cd jscompiler
curl https://dl.google.com/closure-compiler/compiler-latest.zip -O # -k --ssl-added-and-removed-here-;-)
unzip compiler-latest.zip

alias jscompile="python closure-library/closure/bin/build/closurebuilder.py --root scryptjs/src --root closure-library -o compiled -c jscompiler/compiler.jar -f '--jscomp_warning=accessControls' -f '--jscomp_warning=ambiguousFunctionDecl' -f '--jscomp_warning=checkEventfulObjectDisposal' -f '--jscomp_warning=checkRegExp' -f '--jscomp_warning=checkStructDictInheritance' -f '--jscomp_warning=checkTypes' -f '--jscomp_warning=checkVars' -f '--jscomp_warning=conformanceViolations' -f '--jscomp_warning=const' -f '--jscomp_warning=constantProperty' -f '--jscomp_warning=deprecated' -f '--jscomp_warning=duplicateMessage' -f '--jscomp_warning=es3' -f '--jscomp_warning=es5Strict' -f '--jscomp_warning=externsValidation' -f '--jscomp_warning=fileoverviewTags' -f '--jscomp_warning=globalThis' -f '--jscomp_warning=inferredConstCheck' -f '--jscomp_warning=internetExplorerChecks' -f '--jscomp_warning=invalidCasts' -f '--jscomp_warning=misplacedTypeAnnotation' -f '--jscomp_warning=missingGetCssName' -f '--jscomp_warning=missingProperties' -f '--jscomp_warning=missingProvide' -f '--jscomp_warning=missingRequire' -f '--jscomp_warning=missingReturn' -f '--jscomp_warning=newCheckTypes' -f '--jscomp_warning=nonStandardJsDocs' -f '--jscomp_warning=suspiciousCode' -f '--jscomp_warning=strictModuleDepCheck' -f '--jscomp_warning=typeInvalidation' -f '--jscomp_warning=undefinedNames' -f '--jscomp_warning=undefinedVars' -f '--jscomp_warning=unknownDefines' -f '--jscomp_warning=uselessCode' -f '--jscomp_warning=useOfGoogBase' -f '--jscomp_warning=visibility'"

alias gendeps="python closure-library/closure/bin/build/depswriter.py --root_with_prefix='scryptjs/src ../../../scryptjs/src' --root_with_prefix='closure-library ../../../closure-library' > scryptjs/src/deps.js"
```

# Run tests
In the root of working directory.
```
gendeps
python -m SimpleHTTPServer 8080
```
Point your browser to [http://localhost:8080/scryptjs/src/tests/crypt/scrypt_test.html](http://localhost:8080/scryptjs/src/tests/crypt/scrypt_test.html)

# Compile library
In the root of working directory.
```
jscompile --namespace=starain.crypt.Scrypt
```
