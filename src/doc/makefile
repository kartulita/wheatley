MD=$(patsubst %.md,%,$(wildcard *.md))

.PHONY: all $(MD)

all: $(MD)

$(MD):
	./demo.sh "$@"
