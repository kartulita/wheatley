#!/usr/bin/perl

use strict;
use warnings;

use constant false => 0;
use constant true => 1;

my $base = shift or die "No target folder specified";
my $hasheader = false;
my $line;

while ($hasheader or $line = <>) {
	$_ = $line;
	$hasheader = false;
	next unless /^###\s+([\w\-\.]+)/;
	my $filename = "$base/$1";
	print "Extracting file '$filename'... ";
	open (my $file, '>', $filename) or die "Failed to open file '$filename' for writing";
	my $lines = 0;
	while ($line = <>) {
		$_ = $line;
		last if /^#/;
		s/^(\t|\ {4})//;
		print $file $_;
		$lines++;
	}
	print "$lines lines\n";
	close $file;
	$hasheader = $line;
}
