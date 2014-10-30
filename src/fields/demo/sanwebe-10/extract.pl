#!/bin/perl

use strict;
use warnings;

my $css = 0;

while (<>) {
	if (/<\/style>/i) {
		$css = 0;
		next;
	} elsif (/\<style/i) {
		$css = 1;
	}
	next unless $css;
	print $_;
}
