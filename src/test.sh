#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

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
	local SRC="$1" FILE="$(basename "$SRC")" DIR="$(basename "$(dirname "$SRC")")"
	echo -n "${DIR}_$FILE"
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

declare FILENAME

# Dependencies
mkdir -p "$DIR/dep"
for EXT in "${EXTERNALS[@]}"; do
	FILENAME="dep/$(basename "$EXT")"
	if ! [ -e "$DIR/$FILENAME" ]; then
		wget "$EXT" -O "$DIR/$FILENAME" --progress=dot
	fi
	if [[ "$FILENAME" =~ \.css$ ]]; then
		HTMLHEAD+=( '<link rel="stylesheet" href="'"$FILENAME"'">' )
	fi
	if [[ "$FILENAME" =~ \.js$ ]]; then
		HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
	fi
done

# Sources
mkdir -p "$DIR/src"
for SRC in "${FILES[@]}"; do
	FILENAME="src/$(makeFileName "$SRC")"
	cp "$SRC" "$DIR/$FILENAME"
	HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
done
HTMLBODY+=( "<script>mocha.setup('bdd');</script>" )

# Tests
mkdir -p "$DIR/test"
for TEST in "${TESTS[@]}"; do
	FILENAME="test/$(makeFileName "$(echo "$SRC" | sed -E 's/\//_/g')")"
	cp "$TEST" "$DIR/$FILENAME"
	HTMLBODY+=( '<script src="'"$FILENAME"'"></script>' )
done
HTMLBODY+=( '<script>mocha.run();</script>' )

# Generate HTML page
IFS=$'\n' cat > "$DIR/index.html" <<EOF
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

# Launch server
cd "$DIR"
python2 -m SimpleHTTPServer 1337
