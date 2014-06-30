#!/usr/bin/perl

use strict;
use warnings;

my $format = "    '#value#'";

##print STDERR "replacing tokens in " . $ARGV[0];
##print STDERR " with contents of " . $ARGV[1] . "\n";

open(ITEMLIST, $ARGV[0]) or die("Listing file not found");

my $contents = "";
while(<ITEMLIST>) {
  my $item = $_;
  $item =~ s/^\s*|\s*$//g;
  if ($item ne "") {
    my $row = $format;
    $row =~ s/#value#/$item/g;
    if ($contents ne "") {
        $contents = "$contents,\n$row";
    } else {
        $contents = "[\n$row";
    }
  }
}
close ITEMLIST;
if($contents ne "") {
    $contents = "$contents\n]";
}

print $contents;