#!/usr/bin/perl
# USAGE:
# for file in *.txt; do ./repl-scripts.pl $file list.input > $file.out;done;

use strict;
use warnings;

my $format = "        <script type=\"text/javascript\" src=\"../package-res/#value#.js\"></script>";
my $placeholderBeg = "<!-- \@SCRIPTSBEG\@ -->";
my $placeholderEnd = "<!-- \@SCRIPTSEND\@ -->";

##print STDERR "replacing tokens in " . $ARGV[0];
##print STDERR " with contents of " . $ARGV[1] . "\n";

open(ITEMLIST, $ARGV[1]) or die("Listing file not found");

my $contents = "";
while(<ITEMLIST>) {
  my $item = $_;
  $item =~ s/^\s*|\s*$//g;
  if ($item ne "") {
    my $row = $format;
    $row =~ s/#value#/$item/g;
    $contents = "$contents\n$row";
  }
}
close ITEMLIST;

##print STDERR "$contents";

open(SRC, $ARGV[0]) or die("base file not found");

undef $/;

my $filecontent = <SRC>;
close SRC;
$/ = "\n"; #Restore normal read line by line behaviour

$filecontent =~ s/^(\s*$placeholderBeg)(.*?)(\s*$placeholderEnd)/$1$contents$3/smg;

print $filecontent;