#!/usr/bin/perl -i  -p

# Prefixes all module names with "battlesnake." and also updates dependency lists

if (/\.module\(\'/) {
	s/(?<=\.module\(\')/battlesnake./g;
	s/(?<=(?:\ \[|,\ )\')(?=[a-z\-]+\')/battlesnake./g;
}

# We originally prefixed Wheatley, but that name was already taken on github
s/wheatley/battlesnake/g;
s/Wheatley/Battlesnake/g;
s/battlesnake\.(?=battlesnake\.)//g;
