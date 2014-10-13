SRCDIR=src
OUTDIR=out
TMPDIR=tmp
TAGDIR=html
DOCDIR=doc

DOCS=$(patsubst $(SRCDIR)/%.md, %.html, $(wildcard $(SRCDIR)/$(DOCDIR)/*.md))

MODULES=$(patsubst $(SRCDIR)/%/module.js, $(OUTDIR)/%.js, $(shell find $(SRCDIR)/ -maxdepth 2 -type f -name 'module.js'))

SOURCES=$(shell find $(SRCDIR)/ -type f -name '*.js')

BUNDLE=$(OUTDIR)/bundle.js

NODE_DEPS=ng-annotate uglify-js
NODE_INSTALL=npm install -g

NGANNOTATE=ng-annotate --add --single_quotes -

ifdef TEST
UGLIFY=uglifyjs -b -
else
UGLIFY=uglifyjs -c -m -
endif

TAGS=sources modules bundle

RMRF=rm -rf --
RMF=rm -f --
MKDIRP=mkdir -p --
RMDIR=rmdir --ignore-fail-on-non-empty --

SHELL=bash
.SHELLFLAGS=-euo pipefail -c

.PHONY: all bundle modules docs clean deps npm_deps tags syntax $(NODE_DEPS:%=npm_%)

all: bundle modules docs tags
	@true

bundle: $(BUNDLE)
	@true

modules: $(MODULES)
	@true

docs: $(DOCS)
	@true

deps: | $(NODE_DEPS:%=npm_%)
	@true

syntax:
	@for SOURCE in $(SOURCES); do \
		echo -e "\e[1;32m * Checking \e[0;32m$$SOURCE\e[0;37m"; \
		if ! $(NGANNOTATE) < $$SOURCE | $(UGLIFY) > /dev/null; then \
			echo -e "\e[1;31m   Failed: \e[0;31m$$SOURCE\e[0;37m"; \
			echo ""; \
		fi; \
	done

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
	@for SCRIPT in $(SOURCES:$(SRCDIR)/%=%); do \
		echo "<script src=\"$(PREFIX)$$SCRIPT\"></script>"; \
	done > $(TAGDIR)/sources.html
	@for SCRIPT in $(MODULES:$(OUTDIR)/%=%); do \
		echo "<script src=\"$(PREFIX)$$SCRIPT\"></script>"; \
	done > $(TAGDIR)/modules.html
	@echo "<script src=\"$(PREFIX)$(BUNDLE:$(OUTDIR)/%=%)\"></script>" > $(TAGDIR)/bundle.html

$(BUNDLE): $(MODULES) | npm_deps $(OUTDIR) $(TMPDIR)
	$(eval TEMP=$(TMPDIR)/$(subst /,_,$@))
	cat $^ > $(TEMP).cat
	$(UGLIFY) < $(TEMP).cat > $(TEMP).ugly
	cp $(TEMP).ugly $@

$(OUTDIR)/%.js: $(SRCDIR)/%/*.js | npm_deps $(OUTDIR) $(TMPDIR)
	$(eval TEMP=$(TMPDIR)/$(subst /,_,$@))
	cat $^ > $(TEMP).cat
	$(NGANNOTATE) < $(TEMP).cat > $(TEMP).annot
	$(UGLIFY) < $(TEMP).annot > $(TEMP).ugly
	cp $(TEMP).ugly $@

$(DOCDIR)/%.html: $(SRCDIR)/$(DOCDIR)/%.md | $(DOCDIR)
	pandoc --from=markdown_github --to=html < $< > $@

npm_%: | $(NODE_MODULES)/%
	$(NODE_INSTALL) $(@:npm_%=%)
