#!/bin/bash

# ./html-tags.sh [-q] <output.html> <file1.js> <file2.js> ...
# Generates HTML <script> tags for the given file list

set -euo pipefail

declare QUIET=0
if (( $# > 0 )) && [ "$1" == "-q" ]; then
	QUIET=1
	shift
fi

declare OUT="$1"
shift

declare -a SOURCES=( "$@" )

if (( !${#SOURCES} )); then
	echo "No input files specified" >&2
	exit 1
fi

if [[ "$OUT" =~ \.js$ ]]; then
	echo "Specified output file has '.js' extension, you probably don't want me to overwrite that file"
	exit 2
fi

function log {
	if (( !QUIET )); then
		echo "$@" >&2
	fi
}

log "$OUT:"

for SCRIPT in "$@"; do
	echo "<script src=\"$SCRIPT\"></script>"
	log " - $SCRIPT"
done > "$OUT"

log ""
