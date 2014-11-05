SRCDIR=src
OUTDIR=out
TMPDIR=tmp
TAGDIR=html
DOCDIR=doc

TITLE=Wheatley

DOCS=$(patsubst $(SRCDIR)/%.md, %.html, $(wildcard $(SRCDIR)/$(DOCDIR)/*.md))

MODULES=$(patsubst $(SRCDIR)/%/module.js, $(OUTDIR)/%.js, $(shell find $(SRCDIR)/ -maxdepth 2 -type f -name 'module.js'))

SOURCES=$(shell find $(SRCDIR)/ -type f -name '*.js' -not -path '*/tests/*' -not -path '*/doc/*')

BUNDLE=$(OUTDIR)/bundle.js

export NODE_DEPS=ng-annotate uglify-js
export NODE_INSTALL=npm install -g

export NGANNOTATE=ng-annotate --add --single_quotes -

ifdef TEST
export UGLIFY=uglifyjs -b -
else
export UGLIFY=uglifyjs -c -m -
endif

TAGS=sources modules bundle

RMRF=rm -rf --
RMF=rm -f --
MKDIRP=mkdir -p --
RMDIR=rmdir --ignore-fail-on-non-empty --

SHELL=bash
.SHELLFLAGS=-euo pipefail -c

.PHONY: all bundle modules docs clean deps npm_deps tags syntax test test-loop \
	$(NODE_DEPS:%=npm_%)

all: bundle modules docs tags
	@true

bundle: $(BUNDLE)
	@true

modules: $(MODULES)
	@true

docs: $(DOCDIR)/index.html $(DOCS)
	@true

deps: | $(NODE_DEPS:%=npm_%)
	@true

syntax:
	@build/syntax.sh $(SOURCES)

syntax-loop:
	@build/syntax.sh --loop $(SOURCES) || true

test:
	@build/test.sh

test-loop:
	@build/test.sh --loop || true

clean:
	$(RMF) $(OUTDIR)/*.js $(TMPDIR)/* $(TAGS:%=$(TAGDIR)/%.html) $(DOCS)
	$(RMDIR) $(OUTDIR) $(TMPDIR) $(TAGDIR) $(DOCDIR) || true
	
$(OUTDIR):
	$(MKDIRP) $(OUTDIR)

$(TAGDIR):
	$(MKDIRP) $(TAGDIR)

$(TMPDIR):
	$(MKDIRP) $(TMPDIR)

$(DOCDIR):
	$(MKDIRP) $(DOCDIR)

tags: | $(TAGDIR)
	build/html-tags.pl >$(TAGDIR)/sources.html $(SOURCES:$(SRCDIR)/%=$(PREFIX)%)
	build/html-tags.pl >$(TAGDIR)/modules.html $(MODULES:$(OUTDIR)/%=$(PREFIX)%)
	build/html-tags.pl >$(TAGDIR)/bundle.html $(PREFIX)$(BUNDLE:$(OUTDIR)/%=%)

$(BUNDLE): $(MODULES) | npm_deps $(OUTDIR) $(TMPDIR)
	$(eval TEMP=$(TMPDIR)/$(subst /,_,$@))
	build/concatenate.pl $^ > $(TEMP).cat
	$(UGLIFY) < $(TEMP).cat > $(TEMP).ugly
	cp $(TEMP).ugly $@

$(OUTDIR)/%.js: $(SRCDIR)/%/*.js | npm_deps $(OUTDIR) $(TMPDIR)
	$(eval TEMP=$(TMPDIR)/$(subst /,_,$@))
	build/concatenate.pl $^ > $(TEMP).cat
	$(NGANNOTATE) < $(TEMP).cat > $(TEMP).annot
	$(UGLIFY) < $(TEMP).annot > $(TEMP).ugly
	cp $(TEMP).ugly $@

$(DOCDIR)/index.html: $(DOCS)
	cat $(sort $^) | build/doc.sh $(TITLE) > $@
	cp -t $(DOCDIR) build/docpage/*.{css,js}

$(DOCDIR)/%.html: $(SRCDIR)/$(DOCDIR)/%.md | $(DOCDIR)
	$(eval NAME=$(patsubst $(SRCDIR)/$(DOCDIR)/%.md,%,$<))
	pandoc --from=markdown_github --to=html < $< > $@
	build/demo.sh $(SRCDIR) $(DOCDIR) $(NAME) $(SRCDIR)/$(DOCDIR)/doc-demos/$(MODULE)

npm_%: | $(NODE_MODULES)/%
	$(NODE_INSTALL) $(@:npm_%=%)
