#!/usr/bin/perl -w
use strict;
use JSON;

@ARGV = ('April_23_2013_Special_Election_Unofficial_Results.csv') if not @ARGV;
$_ = <>;
chomp;
my %v;
my %ward;
my @columns = map { chomp; s/["\r\n]//g; lc } split /,/;
my(%max, %min);
while (<>) {
    s/\s+$//;
    s/^"//; s/"$//;
    my %r;
    @r{@columns} = split /","/;
    next unless $r{contest_name} =~ /^AT\W*LARGE/
        and $r{candidate} !~ /ER VOTES$/;
    my $key2 = $r{ballot_name} || $r{candidate};
    $key2 =~ s/.* //;
    $key2 = ucfirst lc $key2;
    my $key1 = $r{precinct_number};
    if ($ward{$r{precinct_number}} && $ward{$r{precinct_number}} != $r{ward}) {
        warn "Precinct $r{precinct_number} is Ward $ward{$r{precinct_number}}" .
            " and $r{ward}\n";
    }
    $ward{$r{precinct_number}} = $r{ward};
    if (!exists $min{$key2} or $min{$key2} > $r{votes}) {
        $min{$key2} = $r{votes};
    }
    if (!exists $max{$key2} or $max{$key2} < $r{votes}) {
        $max{$key2} = $r{votes};
    }
    $v{$key1}{$key2} = $r{votes} + 0;
}
#use Data::Dumper; print Dumper \%max, \%min;

my %c;
for my $pct (keys %v) {
    my %votes = %{$v{$pct}};
    my @candidates = sort { $votes{$b} <=> $votes{$a} } keys %votes;
    my $total  = 0;
    for my $n (values %votes) {
        $total += $n;
    }
    my $n = 100 * $votes{$candidates[1]} / $total;
    my $frac = $votes{$candidates[1]} / $votes{$candidates[0]};
    $c{$frac > 0.5 ? join(', ', @candidates[0..1]) : $candidates[0]}++;
    if ($n >= 50 and $candidates[0] ne 'Bonds') {
        print "$pct: ", join(', ', @candidates), "\n";
        printf "%s: %.1f%%\n", $pct, $n;
    }
}
use Data::Dumper; print Dumper \%c;
