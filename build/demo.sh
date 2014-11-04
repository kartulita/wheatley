#!/bin/bash

set -euo pipefail

declare SRCDIR=$1 DOCDIR=$2 MODULE=$3 DEMODIR=$4

export QUIET=1

if $SRCDIR/$DOCDIR/demo.sh $MODULE && [ -d $DEMODIR ]; then
	mkdir -p $DOCDIR/demos
	cp -R $DEMODIR $DOCDIR/demos
fi

