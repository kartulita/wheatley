#!/bin/bash

cd "$(dirname "$0")"

declare DEMO="${1%.*}"

set -euo pipefail

declare QUIET=$(( ${QUIET:-0} ))
export QUIET

function log {
	if ! (( QUIET )); then
		echo "$@" >&2
	fi
}

if [ -z "$DEMO" ]; then
	echo "No demo specified"
	exit 1
fi

declare SOURCE="$DEMO.md"
declare TARGET="./doc-demos/$DEMO/"

if ! [ -f "$SOURCE" ]; then
	echo "Demo not found: $DEMO"
	exit 2
fi

mkdir -p "$TARGET"

log -e "\e[32;1mBuilding demo \"$DEMO\"\e[37;0m"

log -e "\e[1mExtracting sources from documentation\e[0m"
./md2demo.pl "$TARGET" < "$SOURCE" | sed -E 's/^/ + /g'
log ""

# Workaround 
declare -a DEPS=( '' )

if [ -f "../$DEMO/module.js" ]; then
	DEPS+=( "$DEMO" )
fi

DEPS+=( $(perl -ne 'while (<>) { next unless /^Dependencies:\s+(.*)$/; s/^Dependencies:\s+//g; s/[,\s]\s*/\n/g; chomp; print "$_"; }' < "$SOURCE" | sort | uniq) )

declare COPYV=v
if (( QUIET )); then
	COPYV=
fi

log -e "\e[1mImporting dependencies\e[0m"
declare DEP
for DEP in "${DEPS[@]}"; do
	if [ -z "$DEP" ]; then
		continue
	fi
	log -n " + $DEP... "
	if ! [ -f "../$DEP/module.js" ]; then
		echo "Dependency not found!"
		exit 3
	fi
	log ""
	cp -R${COPYV}t "$TARGET" "../$DEP" | sed -E 's/^/     /g'
	log ""
done

# Clean up if we didn't generate anything
rmdir --ignore-fail-on-non-empty "$TARGET"

log -e "\e[1mDone!\e[0m"
log ""
