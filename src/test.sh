#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

declare PORT=1337

#declare DIR="$(mktemp -d)"
declare DIR="/tmp/frontend-tests"

# Source files
declare -a FILES=( */*.js )

# Tests to include
declare -a TESTS=( */tests/*.js )

# External dependencies (to download)
declare -a EXTERNALS=(
	"https://github.com/visionmedia/mocha/raw/master/mocha.css"
	"https://github.com/visionmedia/mocha/raw/master/mocha.js"

	"http://chaijs.com/chai.js"

	"http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.js"
	"http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-resource.js"
	"http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-route.js"
)
#	"http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-mocks.js"

# For sources: module/file-name.js => module_file-name.js
function makeFileName {
	local FILENAME="$1"
	echo -n "$(basename "$(dirname "$FILENAME")")_$(basename "$FILENAME")"
}

function section {
	echo -e "\e[1;35m$@\e[0;37m"
}

function item {
	echo -e " - \e[0;36m$@\e[0;37m"
}

function extra {
	echo -e "   \e[0;33m$@\e[0;37m"
}

# HTML source
declare HTMLHEAD=(
	'<meta charset="utf-8">'
	'<title>Tests</title>'
)

# HTML source
declare HTMLBODY=(
	'<div id="mocha"><p><a href=".">Index</a></p></div>'
	'<div id="messages"></div>'
	'<div id="fixtures"></div>'
)

function dependencies {
	local FILENAME
	section 'Dependencies'
	mkdir -p "$DIR/dep"
	for EXT in "${EXTERNALS[@]}"; do
		FILENAME="dep/$(basename "$EXT")"
		item "$FILENAME"
		if ! [ -e "$DIR/$FILENAME" ]; then
			extra "Downloading..."
			wget "$EXT" -O "$DIR/$FILENAME" --progress=none
		fi
		if [[ "$FILENAME" =~ \.css$ ]]; then
			HTMLHEAD+=( '<link rel="stylesheet" href="'"$FILENAME"'">' )
		fi
		if [[ "$FILENAME" =~ \.js$ ]]; then
			HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
		fi
	done
}

function modules {
	local FILENAME
	section "Module headers"
	mkdir -p "$DIR/src"
	for SRC in "${FILES[@]}"; do
		if ! [[ "$SRC" =~ module\.js$ ]]; then
			continue
		fi
		FILENAME="src/$(makeFileName "$SRC")"
		item "$FILENAME"
		cp "$SRC" "$DIR/$FILENAME"
		HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
	done
	HTMLBODY+=( "<script>mocha.setup('bdd');</script>" )
}

function sources {
	local FILENAME
	section "Sources"
	mkdir -p "$DIR/src"
	for SRC in "${FILES[@]}"; do
		if [[ "$SRC" =~ module\.js$ ]]; then
			continue
		fi
		FILENAME="src/$(makeFileName "$SRC")"
		item "$FILENAME"
		cp "$SRC" "$DIR/$FILENAME"
		HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
	done
	HTMLBODY+=( "<script>mocha.setup('bdd');</script>" )
}

function tests {
	local FILENAME
	section "Tests"
	mkdir -p "$DIR/test"
	for TEST in "${TESTS[@]}"; do
		FILENAME="test/$(makeFileName "$(echo "$TEST" | sed -r 'y/\//_/')" | sed -r 's/\._//g')"
		item "$FILENAME"
		cp "$TEST" "$DIR/$FILENAME"
		HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
	done
	HTMLBODY+=( '<script>mocha.run();</script>' )
}

function html {
	local FILENAME
	section "Html interface"
	FILENAME="index.html"
	item "$DIR/$FILENAME"
	IFS=$'\n' cat > "$DIR/$FILENAME" <<EOF
	<!DOCTYPE html>
	<html>
	<head>
	${HTMLHEAD[@]}
	</head>
	<body>
	${HTMLBODY[@]}
	</body>
	</html>
EOF
}

declare PYPID=0

function startServer {
	section "Server"
	cd "$DIR"
	python2 -m SimpleHTTPServer $PORT >/dev/null 2>/dev/null & PYPID=$!
	item "Listening on port $PORT"
}

function stopServer {
	item "Stopping server"
	kill $PYPID
	item "Server stopped"
}

function main {
	dependencies
	modules
	sources
	tests
	html
	startServer
	trap stopServer EXIT
	wait
}

main
