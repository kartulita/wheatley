#!/bin/bash

set -euo pipefail

# Move into source directory
cd "$(dirname "$0")/../src/"

declare PORT=1337

#declare DIR="$(mktemp -d)"
declare DIR="/tmp/frontend-tests"

# Source files
declare -a FILES=( */*.js )

# Tests to include
declare -a TESTS=( */tests/*.js )

# External dependencies (to download)
declare -a EXTERNALS=(
	'https://github.com/visionmedia/mocha/raw/master/mocha.css'
	'https://github.com/visionmedia/mocha/raw/master/mocha.js'

	'http://chaijs.com/chai.js'

	'http://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.0.2/js/toastr.min.js'
	'http://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.0.2/css/toastr.min.css'

	'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js'

	'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.js'
	'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-resource.js'
	'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-route.js'
	'+http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-mocks.js'

)

# For sources: module/file-name.js => module_file-name.js
function makeFileName {
	local FILENAME="$1"
	echo -n "$(basename "$(dirname "$FILENAME")")_$(basename "$FILENAME")"
}

function section {
	echo ""
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
	'<div id="debug"></div>'
	'<div id="mocha"><p><a href=".">Unit tests for Wheatley</a></p></div>'
	'<div id="messages"></div>'
	'<div id="fixtures"></div>'
)

function dependencies {
	local FILENAME NOINCLUDE
	section 'Dependencies'
	mkdir -p "$DIR/dep"
	for EXT in "${EXTERNALS[@]}"; do
		INCLUDE=1
		if [[ "$EXT" =~ ^\+ ]]; then
			EXT="${EXT:1:${#EXT}}"
			INCLUDE=0
		fi
		FILENAME="dep/$(basename "$EXT")"
		item "$FILENAME"
		if ! [ -e "$DIR/$FILENAME" ]; then
			extra "Downloading..."
			wget "$EXT" -O "$DIR/$FILENAME" --quiet
		fi
		if (( INCLUDE )); then
			if [[ "$FILENAME" =~ \.css$ ]]; then
				HTMLHEAD+=( '<link rel="stylesheet" href="'"$FILENAME"'">' )
			elif [[ "$FILENAME" =~ \.js$ ]]; then
				HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
			fi
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
	HTMLBODY+=( '<script>mocha.setup("tdd");</script>' )
	HTMLBODY+=( '<script>window.expect = chai.expect; window.assert = chai.assert; chai.should(); </script>' )
	HTMLBODY+=( '<script src="dep/angular-mocks.js"></script>' )
	tests
	HTMLBODY+=( '<script>mocha.run();</script>' )
	html
	startServer
	trap stopServer EXIT
	# wait
	read LINE
}

function loop {
	while clear; do
		echo -e "\e[1;37mTest loop.  Press ENTER to re-build tests, Ctrl+C to quit."
		( main )
	done
	exit 0
}

if (( $# == 0 )); then
	main
elif [ "$1" == "--loop" ]; then
	loop
else
	echo "Unknown parameter: $@"
	exit 1
fi
