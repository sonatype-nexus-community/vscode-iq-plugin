#!/bin/bash
set -e
export LOWER_CASE_FORMAT=`echo $FORMAT | tr '[:upper:]' '[:lower:]'`
mkdir ext-src/packages/$LOWER_CASE_FORMAT

export DEPENDENCIES_FILENAME="${FORMAT}Dependencies.ts"
export PACKAGE_FILENAME="${FORMAT}Package.ts"

tmpviewfile=$(mktemp /tmp/viewfile.json)
sed 's/Example/'"$FORMAT"'/g; s/example/'"$LOWER_CASE_FORMAT"'/g' ext-src/packages/templates/variables.json > $tmpviewfile

mustache $tmpviewfile ext-src/packages/templates/Dependencies.mustache > ext-src/packages/$LOWER_CASE_FORMAT/$DEPENDENCIES_FILENAME
mustache $tmpviewfile ext-src/packages/templates/Package.mustache > ext-src/packages/$LOWER_CASE_FORMAT/$PACKAGE_FILENAME

rm "$tmpviewfile"
