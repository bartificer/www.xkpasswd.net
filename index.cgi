#!/usr/bin/perl

use strict;
use Template;
use CGI;
use CGI::Carp;
use English qw( -no_match_vars ); # for more readable code
#use HTTP::BrowserDetect; # for browser detection
use HTML::ParseBrowser; # for better browser detection
use XKPasswd;
use XKPasswd::Util;

# action mappings
my $ACTIONS = {
    start => \&show_html,
    genpw => \&generate_password,
    presets => \&get_presets,
};

# initialise a CGI object
my $CGI = CGI->new();


# figure out what to do
my $action = 'start';
if($CGI->param('a')){
    $action = $CGI->param('a');
}
if(defined $ACTIONS->{$action}){
    &{$ACTIONS->{$action}}();
}else{
    croak("Invalid action '$action'");
}

#
# --- Action processing functions ---------------------------------------------
#

# render the front page
sub show_html{
    # figure out whether or not the browser is supported.
    #my $browser = HTTP::BrowserDetect->new($CGI->user_agent());
    my $browser = HTML::ParseBrowser->new($CGI->user_agent());
    my $browser_supported = browser_suported($browser);
    
    # generate the main HTML page
    my $html = q{};
    my $template = Template->new();
    my $args = {
        browser_supported => $browser_supported,
        #browser_supported => 'MAYBE',
        browser_name => $browser->name(),
        browser_version => $browser->major(),
    };
    $template->process("index.tt", $args, \$html)|| croak("Template processing failed: ", $template->error(), "\n");
    print $CGI->header();
    print $html;
}

# generate a password
sub generate_password{
    # figure out how many passwords to generate
    my $num_pw = $CGI->param('n');
    unless(defined $num_pw && ref $num_pw eq q{} && $num_pw =~ m/^\d+$/sx && $num_pw > 0){
        $num_pw = 1;
    }
    
    # make sure we got a valid JSON config string
    my $configString = $CGI->param('c');
    my $config;
    eval{
        $config = XKPasswd::Util->config_from_json($configString);
    }or do{
        croak("failed to load config with error: $EVAL_ERROR");
    };
    
    # generate the password & stats into a JSON string
    $XKPasswd::SUPRESS_ENTROPY_WARNINGS = 'ALL';
    my $response_json = q{};
    eval{
        my $xkpasswd = XKPasswd->new('English.dict.txt', $config);
        $response_json = XKPasswd::Util->passwords_json($xkpasswd, $num_pw);
        1; # ensure truthy evaluation on success
    }or do{
        croak("Failed to generate password(s) with error: $EVAL_ERROR");
    };
    
    
    # return the JSON string
    print $CGI->header(-type => 'text/plain');
    print $response_json;
}

# fetch the presets
sub get_presets{
    # generate the JSON string
    my $prests_json = q{};
    eval{
        $prests_json = XKPasswd::Util->presets_json();
        1; # ensure truthy evaliation on success
    }or do{
        croak("Failed to generate presets JSON with error: $EVAL_ERROR");
    };
    
    # return the JSON string
    print $CGI->header(-type => 'text/plain');
    print $prests_json;
}

#
# --- Helper functions
#

#####-SUB-######################################################################
# Type       : SUBROUTINE
# Purpose    : Return an error (HTTP response code 500)
# Returns    : Always returns 1 (to keep perlcritic happy)
# Arguments  : 1. OPTIONAL - a an error message
# Throws     : NOTHING
# Notes      : Replies to the client with a 500 error and logs the message to
#              the server log
# See Also   :
sub return_error{
    my $msg = shift;
    croak($msg);
}

#####-SUB-######################################################################
# Type       : SUBROUTINE
# Purpose    : Determine whether the browser is definitely not supported,
#              definitely supported, or unknown.
# Returns    : 'YES', 'NO', or 'MAYBE'
# Arguments  : 1. a HTML::ParseBrowser object
# Throws     : Croaks on invalid args
# Notes      :
# See Also   :
sub browser_suported{
    my $browser = shift;
    
    # validate args
    unless($browser && $browser->isa('HTML::ParseBrowser')){
        croak((caller 0)[3].'() - invalid args - must pass a HTML::ParseBrowser object');
    }
    
    # figure out if the browser is OK or not
    my $name = $browser->name();
    my $version = $browser->major();
    my $sub_version = $browser->minor();
    
    if($name eq 'Internet Explorer'){
        # deal with IE - if it's less than 9 it's not supported!
        if($version < 9){
            return 'NO';
        }
        return 'YES';
    }elsif($name eq 'Safari'){
        # deal with Safari - if the major version is 6 or greater all is OK,
        # if major version is less than 5 definitely not OK, if vresion is 5
        # and minor version is greater than or equal to 1 all is OK too
        if($version >= 6){
            return 'YES';
        }
        if($version <= 4){
            return 'NO';
        }
        # if we get here the major version must be 5, so check the minor version
        if($sub_version >= 1){
            return 'YES';
        }
        return 'NO';
    }elsif($name eq 'Firefox'){
        # officially JQuery supports "current -1" - as of today (11-11-2014),
        # ESR is 31, so that seems a sane baseline - older FireFox's probably
        # work fine, so return 'MAYBE'
        if($version >= 31){
            return 'YES';
        }
        return 'MAYBE';
    }elsif($name eq 'Chrome'){
        # officially JQuery supports "current -1" - as of today (11-11-2014),
        # the current version of Chrome is 38, so 35 seems a sane baseline -
        # older Chromes are probably fine, so return 'MAYBE'
        if($version >= 35){
            return 'YES';
        }
        return 'MAYBE';
    }elsif($name eq 'Opera'){
        # Officially JQuery suppors 12.1x or "current -1. Seems reasonabl to
        # assume versions below 12 are not supported, and since current is 25
        # (as of 11-11-2014), versions above 20 are probaly fine too.
        if($version >= 20 || $version == 12){
            return 'YES';
        }
        return 'NO';
    }
    
    # if the browser is known to be obsolete - return 'NO'
    if($name eq 'Netscape' || $name eq 'Mozilla'){
        return 'NO';
    }
    
    # if we get here we're not sure, so return 'MAYBE'
    return 'MAYBE';
}