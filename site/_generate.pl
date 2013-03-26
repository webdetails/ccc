#!/usr/bin/perl

use strict;
use warnings;

my $resDir = $ARGV[1];
##print STDERR "replacing tokens in " . $ARGV[0];
##print STDERR " with contents of " . $ARGV[1] . "\n";
##print STDERR $ARGV[0];
open(TEMPL, $ARGV[0]) or die("Template file not found");

my $contents = "";
while(<TEMPL>) {
  my $item = $_;
  
  # supports only 1 resource per line...
  if($item =~ m/<!--\s+\@RESOURCE\@\s+"(.+?)"\s+-->/) {
    my $resourceFile = "$resDir/$1";
    
    open(RES, $resourceFile) or die("resource file '$resourceFile' not found");
    undef $/;
    my $resourceText = <RES>;
    close RES;
    $/ = "\n"; # Restore normal read line by line behaviour
    
    # Replace tag with resource text
    $item =~ s/<!--\s+\@RESOURCE\@\s+".+?"\s+-->/$resourceText/g;
  }
  
  $contents = "$contents$item";
}
close TEMPL;

##print STDERR "$contents";

print $contents;