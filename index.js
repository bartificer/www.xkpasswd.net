// The Javascript to make the XKPasswd web UI go

//
// --- The JS Object which will contain all custom JS functions ---------------
//
var XKPWD = {
    version: '0.0.1',
    icons: {
        //expand: 'contrib/famfamfam_silk_icons_v013/icons/add.png',
        //collapse: 'contrib/famfamfam_silk_icons_v013/icons/delete.png'
        expand: 'contrib/fugue-icons-3.5.6/icons-shadowless/plus-white.png',
        collapse: 'contrib/fugue-icons-3.5.6/icons-shadowless/minus-white.png',
        valid: 'contrib/famfamfam_silk_icons_v013/icons/accept.png',
        invalid: 'contrib/famfamfam_silk_icons_v013/icons/exclamation.png',
        info: 'contrib/famfamfam_silk_icons_v013/icons/information.png',
        error: 'contrib/famfamfam_silk_icons_v013/icons/exclamation.png',
        add: 'contrib/famfamfam_silk_icons_v013/icons/add.png',
        close: 'contrib/fugue-icons-3.5.6/icons-shadowless/cross-white.png'
    },
    aniTime: 250,
    ajaxURL: 'index.cgi',
    entropyBlindThreshold: 78,
    entropySeenThreshold: 52,
    definedPresets: [], // to be populated by XKPWD.loadPresets()
    presetDescriptions: {}, // to be populated by XKPWD.loadPresets()
    presets: {} // to be populated by XKPWD.loadPresets()
};

//
// --- Document Ready (onLoad) ------------------------------------------------
//
$(document).ready(function(){
    // dynamically generate needed UI elements and icons etc.
    XKPWD.initSectionIcons();
    XKPWD.initValidationErrorIcons();
    XKPWD.addCloseButtons();
    
    // attach change handlers (and execute them once to init descriptions)
    $('#section_words select').change(XKPWD.updateWordsDescription);
    XKPWD.updateWordsDescription();
    $('#word_length_min').change(function(){
        var minlen = parseInt($('#word_length_min').val());
        var maxlen = parseInt($('#word_length_max').val());
        if(minlen > maxlen){
            $('#word_length_max').val(minlen);
            $('#word_length_max').change();
        }
    });
    $('#word_length_max').change(function(){
        var minlen = parseInt($('#word_length_min').val());
        var maxlen = parseInt($('#word_length_max').val());
        if(maxlen < minlen){
            $('#word_length_min').val(maxlen);
            $('#word_length_min').change();
        }
    });
    $('#section_transformations select').change(XKPWD.updateTransformationsDescription);
    XKPWD.updateTransformationsDescription();
    $('#separator_type').change(XKPWD.updateSeparatorType);
    XKPWD.updateSeparatorType();
    $('#section_separator select').change(XKPWD.updateSeparatorDescription);
    $('#section_separator input').keyup(XKPWD.updateSeparatorDescription);
    XKPWD.updateSeparatorDescription();
    $('#section_padding_digits select').change(XKPWD.updatePaddingDigitsDescription);
    XKPWD.updatePaddingDigitsDescription();
    $('#padding_type').change(XKPWD.updatePaddingType);
    XKPWD.updatePaddingType();
    $('#padding_char_type').change(XKPWD.updatePaddingCharacterType);
    XKPWD.updatePaddingCharacterType();
    $('#section_padding_symbols select').change(XKPWD.updatePaddingSymbolsDescription);
    $('#section_padding_symbols input').keyup(XKPWD.updatePaddingSymbolsDescription);
    XKPWD.updatePaddingSymbolsDescription();
    $('#save_config_btn').click(XKPWD.saveConfig);
    $('#load_config_btn').click(XKPWD.loadScratchSpaceConfig);
    $('#summary_info_icon').click(XKPWD.toggleSummaryInfo);
    $('#num_passwords').change(XKPWD.updateNumPasswords);
    $('#generate_password_btn').click(XKPWD.generatePassword);
    
    // load the presets from the server
    XKPWD.loadPresets();
});

//
// --- UI Generating functions (to be called on load) -------------------------
//

// function for inserting the expand, collapse and validation icons into the section headers, add buttons into text box sets, and extra info icon into summary section
XKPWD.initSectionIcons = function(){
    // loop through each form section and insert the icon
    $('div.section_container').each(function(){
        var $container = $(this);
        var id = $container.attr('id');
        var $header = $('.section_header', $container);
        if(id && $header.length){
            $header.prepend($('<img />').attr('id', id + '_icon').attr('alt', 'Expand Section').attr('src', XKPWD.icons['expand']).addClass('expand_icon'));
            if(!$container.is('.no_validate')){
                $header.prepend($('<img />').attr('id', id + '_validation_icon').attr('alt', 'OK').attr('src', XKPWD.icons['valid']).addClass('section_validation_icon'));
            }
            if(!$container.is('.no_description')){
                $header.append(' ');
                $header.append($('<span></span>').attr('id', id + '_summary').addClass('section_summary'));
            }
            $header.click(function(){XKPWD.toggleSection(id);});
        }else{
            try{console.log("WARNING - missing varialbe: id='" + id + "' & $header.length='" + $header.length + "'")}catch(e){};
        }
    });
    
    // add the add buttons to the end of all text box sets
    $('span.tbset').each(function(){
        var $tbset = $(this);
        var setID = $tbset.attr('id');
        var $addButton = $('<img />').attr('id', setID + '_add').attr('alt', 'Add More Characters').attr('src', XKPWD.icons['add']).addClass('add_button');
        $addButton.click(function(){
            // calculate the prefix
            var tbPrefix = setID.replace('_tbset', '');
            
            // add the buttons
            XKPWD.addTextBoxes(tbPrefix, 3);
        });
        $tbset.after($addButton);
    });
    
    // add the info icon to the summary section
    $('#summary_title').append($('<img />').attr('id', 'summary_info_icon').attr('alt', 'Show Legends').attr('src', XKPWD.icons['info']).addClass('info_icon'));
    
    // add the icon to the password generation and config load/save error paragraphs
    $('#generate_password_error_container').prepend(XKPWD._errorIcon());
    $('#load_save_error_container').prepend(XKPWD._errorIcon());
    $('#preset_load_error_container').prepend(XKPWD._errorIcon());
};

// function for insterting the exclamation point icon into validation error messages
XKPWD.initValidationErrorIcons = function(){
    // loop through each validation error span and insert the icon
    $('span.validation_error').each(function(){
        $(this).prepend($('<img />').attr('alt', 'Validation Error!').attr('src', XKPWD.icons['invalid']).addClass('validation_error_icon'));
    });
};

// function for adding one or more text boxes to a textbox set
XKPWD.addTextBoxes = function(tbPrefix, numToAdd){
    // get the container for the text box set
    var $tbset = $('#' + tbPrefix + '_tbset');
    if(!$tbset.length){
        try{console.log("WARNING - to text box set found with id=" + tbPrefix + "_tbset")}catch(e){};
        return;
    }
    
    // get the number of textboxes to add
    if(!(numToAdd && String(numToAdd).match(/^\d+$/))){
        numToAdd = 1;
        try{console.log("WARNING - found invalid value for numToAdd, setting to 1 and continuing")}catch(e){};
    }
    
    // add the text boxes
    var n = 1;
    var numAdded = 0;
    while(numAdded < numToAdd){
        var $tb = $('#' + tbPrefix + '_' + n);
        if(!$tb.length){
            var $newTB = $('<input type="text" size="1" maxlength="1" />').attr('id', tbPrefix + '_' + n);
            if(tbPrefix == 'separator_type_random'){
                $newTB.keyup(XKPWD.updateSeparatorDescription)
            }else if(tbPrefix == 'padding_char_type_random'){
                $newTB.keyup(XKPWD.updatePaddingSymbolsDescription);
            }
            $tbset.append($newTB);
            numAdded++;
        }
        n++;
    }
};

// function to empty a textboc set
XKPWD.emptyTextboxSet = function(tbPrefix){
    // get the container for the text box set
    var $tbset = $('#' + tbPrefix + '_tbset');
    if(!$tbset.length){
        try{console.log("WARNING - no text box set found with id=" + tbPrefix + "_tbset")}catch(e){};
        return;
    }
    
    // blank all the text boxes in the set
    $('input:text', $tbset).val('');
}

// function for expanding a textbox set to a given length
XKPWD.expandTextboxSetTo = function(tbPrefix, expandTo){
    // get the container for the text box set
    var $tbset = $('#' + tbPrefix + '_tbset');
    if(!$tbset.length){
        try{console.log("WARNING - no text box set found with id=" + tbPrefix + "_tbset")}catch(e){};
        return;
    }
    
    // get the number of textboxes to expand the set to
    if(!(expandTo && String(expandTo).match(/^\d+$/))){
        try{console.log("WARNING - found invalid value for expandTo")}catch(e){};
        return;
    }
    
    // add the needed text boxes
    var n = 1;
    while(n <= expandTo){
        var $tb = $('#' + tbPrefix + '_' + n);
        if(!$tb.length){
            var $newTB = $('<input type="text" size="1" maxlength="1" />').attr('id', tbPrefix + '_' + n);
            if(tbPrefix == 'separator_type_random'){
                $newTB.keyup(XKPWD.updateSeparatorDescription)
            }else if(tbPrefix == 'padding_char_type_random'){
                $newTB.keyup(XKPWD.updatePaddingSymbolsDescription);
            }
            $tbset.append($newTB);
        }
        n++;
    }
}

// load presets
XKPWD.loadPresets = function(){
    // make the AJAX call
    $.ajax({
        url: XKPWD.ajaxURL,
        type: 'POST',
        async: true,
        cache: false,
        data: {
            a: 'presets'
        },
        success: function(data){
            // render the presets
            XKPWD._renderPresets(data);
        },
        error: function(jqXHR, textStatus, errorThrown){
            // render an error
            $('#preset_buttons_container').empty().append(XKPWD._errorIcon()).append($('<span></span>').addClass('error').html('Error - failed to load presets - server responded with: <em>' + errorThrown + '</em>'));
        }
    });
};

// a helper function to render the presets
XKPWD._renderPresets = function(presetsJSON){
    // try parse the presets
    var presetsObject = {};
    try{
        presetsObject = JSON.parse(presetsJSON);
    }catch(e){
        $('#preset_buttons_container').empty().append(XKPWD._errorIcon()).append($('<span></span>').addClass('error').html('Error - failed to interpert presets returned by server'));
        try{console.log("WARNING - failed to parse presets JSON with error: " + errorThrown)}catch(e){};
        return;
    }
    
    // save the details to the XKPWD object for future reference
    XKPWD.definedPresets = presetsObject.defined_presets;
    XKPWD.presets = presetsObject.presets;
    XKPWD.presetDescriptions = presetsObject.preset_descriptions;
    
    // render the presets into a span
    var $presets = $('<span></span>');
    XKPWD.definedPresets.forEach(function(p){
        var $preset = $('<input type="button" />').val(p).attr('title', XKPWD.presetDescriptions[p]);
        $preset.click(function(){
            XKPWD.loadPreset(p);
        });
        $presets.append($preset);
    });
    
    // replace the loading icon with the presets
    $('#preset_buttons_container').empty().append($presets);
    
    // finally, load the default preset
    XKPWD.loadPreset('DEFAULT');
};

// a helper function to generate an error icon JQuery object
XKPWD._errorIcon = function(){
    return $('<img />').attr('alt', 'Error!').attr('src', XKPWD.icons['error']).addClass('error_icon');
};

// render the close button on any closable divs on the page
XKPWD.addCloseButtons = function(){
    $('div.closeable').each(function(){
        var $div = $(this);
        var divID = $div.attr('id');
        var $closeButton = $('<img />').attr('alt', 'Close').attr('src', XKPWD.icons['close']);
        $closeButton.addClass('close_button');
        $closeButton.click(function(){
            $('#' + divID).hide(XKPWD.aniTime);
        });
        $div.prepend($closeButton);
    });
}

//
// --- Click handlers (to be called when buttons are clicked) -----------------
//

// section toggle
XKPWD.toggleSection = function(container_id){
    var $container = $('#' + container_id);
    var $body = $('.section_body', $container);
    if($body.is(':visible')){
        $body.hide(XKPWD.aniTime);
        $('#' + container_id + '_icon').attr('src', XKPWD.icons['expand']).attr('alt', 'Expand Section');
    }else{
        $body.show(XKPWD.aniTime);
        $('#' + container_id + '_icon').attr('src', XKPWD.icons['collapse']).attr('alt', 'Collapse Section');
    }
};

// summary extra info toggle
XKPWD.toggleSummaryInfo = function(){
    var $extraInfo = $('.summary_extra_info');
    if($extraInfo.is(':visible')){
        $extraInfo.hide(XKPWD.aniTime);
    }else{
        $extraInfo.show(XKPWD.aniTime);
    }
};

// generate password
XKPWD.generatePassword = function(){
    // only execute if the form is valid
    if(!XKPWD.validateFormSection('ALL')){
        try{console.log('INFO - validation failed - abandining password generation')}catch(e){};
        return;
    }
    
    // hide the error paragraph, blank the text box & blank the trafficlight
    $('#generate_password_error_container').hide(XKPWD.aniTime);
    $('#generated_password').val('');
    $('#password_trafficlight_container').empty();
    
    // disable the form
    XKPWD._setFormEnabled(false);
    
    // generate a config hashref
    var config = XKPWD.generateConfig();
    
    // make the AJAX call
    $.ajax({
        url: XKPWD.ajaxURL,
        type: 'POST',
        async: true,
        cache: false,
        data: {
            a: 'genpw',
            n: parseInt($('#num_passwords').val()),
            c: JSON.stringify(config)
        },
        success: function(data){
            // render the password
            XKPWD._renderPassword(data);
        },
        error: function(jqXHR, textStatus, errorThrown){
            // render an error
            XKPWD._renderPasswordError('ERROR - failed to generate password - server responded with: <em>' + errorThrown + '</em>');
        },
        complete: function(){
            // regardless of success or failure, re-enable the form
            XKPWD._setFormEnabled(true);
        }
    });
};

// helper function to enable or disable the form
XKPWD._setFormEnabled = function(doEnable){
    if(doEnable){
        $('#form_overlay').fadeOut(XKPWD.aniTime);
        $('#generate_password_btn').prop('disabled', false);
    }else{
        $('#form_overlay').fadeIn(XKPWD.aniTime);
        $('#generate_password_btn').prop('disabled', true);
    }
};

// helper function to show a password generation error
XKPWD._renderPasswordError = function(msg){
    // write the error messgae to the div and show it
    $('#generate_password_errors').html(msg);
    $('#generate_password_error_container').show(XKPWD.aniTime);
    // bank the traffic light
    $('#password_trafficlight_container').empty();
    // bank and hide the stats
    $('#password_stats_container').empty().hide(XKPWD.aniTime);
};

// helper function to render the returned password(s)
XKPWD._renderPassword = function(responseJSON){
    // convert the JSON string returned by the server to an object
    var responseObj;
    try{
       responseObj = JSON.parse(responseJSON);
    }catch(e){
        // render an error then return
        XKPWD._renderPasswordError('ERROR - failed to interpret response from server');
        try{console.log('WARNING - failed to parse returned JSON string with error: ' + e.message)}catch(e){};
        return;
    }
    
    // read the password from the object and render it
    var passwds = responseObj.passwords.join("\n");
    if(passwds){
        $('#generated_password').val(passwds).select();
    }else{
        XKPWD._renderPasswordError('ERROR - server returned no passwords');
        return;
    }
    
    // render trafficlight icon
    var blindEntropyMin = parseInt(responseObj.stats.password_entropy_blind_min);
    var blindEntropyMax = parseInt(responseObj.stats.password_entropy_blind_max);
    var seenEntropy = parseInt(responseObj.stats.password_entropy_seen);
    var $trafficLight = $('<span></span>').addClass('losenge');
    if(blindEntropyMin >= XKPWD.entropyBlindThreshold && seenEntropy >= XKPWD.entropySeenThreshold){
        // all good
        $trafficLight.html('Good').addClass('good');
    }else if(blindEntropyMin < XKPWD.entropyBlindThreshold && seenEntropy < XKPWD.entropySeenThreshold){
        // all bad
        $trafficLight.html('Poor').addClass('poor');
    }else{
        // mix of good and bad
        $trafficLight.html('OK').addClass('ok');
    }
    $('#password_trafficlight_container').html('<h3>Strength:</h3> ').append($trafficLight);
    
    // Render the detailed stats
    var $stats = $('<span></span>').append($('<h3></h3>').html('Entropy:'));
    // first the blind entropy
    $stats.append(' ');
    if(blindEntropyMin == blindEntropyMax){
        var $blindEntropy = $('<span></span>').html(blindEntropyMin + 'bits').addClass('losenge');
        if(blindEntropyMin >= XKPWD.entropyBlindThreshold){
            $blindEntropy.addClass('good');
        }else{
            $blindEntropy.addClass('poor');
        }
        $stats.append($blindEntropy);
    }else{
        $stats.append('between ');
        var $blindEntropyMin = $('<span></span>').html(blindEntropyMin + 'bits').addClass('losenge');
        if(blindEntropyMin >= XKPWD.entropyBlindThreshold){
            $blindEntropyMin.addClass('good');
        }else{
            $blindEntropyMin.addClass('poor');
        }
        $stats.append($blindEntropyMin);
        $stats.append(' &amp; ');
        var $blindEntropyMax = $('<span></span>').html(blindEntropyMax + 'bits').addClass('losenge');
        if(blindEntropyMax >= XKPWD.entropyBlindThreshold){
            $blindEntropyMax.addClass('good');
        }else{
            $blindEntropyMax.addClass('poor');
        }
        $stats.append($blindEntropyMax);
    }
    $stats.append(' blind &amp; ');
    // seen entropy
    var $seenEntropy = $('<span></span>').html(seenEntropy + 'bits').addClass('losenge');
    if(seenEntropy >= XKPWD.entropySeenThreshold){
        $seenEntropy.addClass('good');
    }else{
        $seenEntropy.addClass('poor');
    }
    $stats.append($seenEntropy);
    $stats.append(' with full knowledge ');
    $stats.append($('<span></span>').addClass('aside').html('(suggest keeping blind entropy above ' + XKPWD.entropyBlindThreshold + 'bits & seen above ' + XKPWD.entropySeenThreshold + 'bits)'));
    $('#password_stats_container').empty().append($stats).show(XKPWD.aniTime);
};

// function to save the running config to the scratchspace text area
XKPWD.saveConfig = function(){
    // only execute if the form is valid
    if(!XKPWD.validateFormSection('ALL')){
        XKPWD._showScratchSpaceError("Can't save confing while there are validation errors");
        return;
    }
    
    // generate the config , save it to the text area, and hide the error message if there is one
    $('#config_scratchspace').val(JSON.stringify(XKPWD.generateConfig(), null, ' '));
    $('#load_save_error_container').hide(XKPWD.aniTime);
};

// function to load a config from the scratchspace text area
XKPWD.loadScratchSpaceConfig = function(){
    // get the scratchspace string and convert to object
    var cfg = {};
    try{
        cfg = JSON.parse($('#config_scratchspace').val());
    }catch(e){
        XKPWD._showScratchSpaceError("Failed to parse config to JSON with error: " + e);
        return;
    }
    
    // load the config into the form
    try{
        XKPWD.loadConfig(cfg);
    }catch(e){
        XKPWD._showScratchSpaceError("Failed to load config with error: " + e);
        return;
    }
    
    // if we got here there was no error, so hide the error box
    $('#load_save_error_container').hide(XKPWD.aniTime);
};

// function to render a load/save error in the config scratchspace
XKPWD._showScratchSpaceError = function(msg){
    $('#load_save_error').html(msg);
    $('#load_save_error_container').show(XKPWD.aniTime);
};

//  function to load a preset
XKPWD.loadPreset = function(p){
    // make sure there is a preset to load
    if(!(p && XKPWD.presets[p])){
        XKPWD._showPresetLoadError('Error - failed to load preset');
        try{console.log('WARNING - Received invalid preset identifier p=' + p)}catch(e){};
        return;
    }
    
    // try load the preset
    try{
        XKPWD.loadConfig(XKPWD.presets[p]);
    }catch(e){
        XKPWD._showPresetLoadError('Error - failed to load preset');
        try{console.log('WARNING - failed to load preset ' + p + ' with error: ' + e)}catch(e){};
        return;
    }
    
    // if we got here all is well so hide the error message
    $('#preset_load_error_container').hide(XKPWD.aniTime);
};

// a helper function to show a preset loading error
XKPWD._showPresetLoadError = function(msg){
    $('#preset_load_error').html(msg);
    $('#preset_load_error_container').show(XKPWD.aniTime);
}

//
// --- Change handlers (to be called on change or keyup) ----------------------
//

// update words section description
XKPWD.updateWordsDescription = function(){
    if(XKPWD.validateFormSection('section_words')){
        // get a reference to the section description
        var $span = $('span#section_words_summary');
        
        // assemble the text
        var desc = $('#num_words').val() + ' words of ';
        var minlen = $('#word_length_min').val();
        var maxlen = $('#word_length_max').val();
        if(minlen == maxlen){
            desc += minlen;
        }else{
            desc += 'between ' + minlen + ' and ' + maxlen;
        }
        desc += ' letters from the ';
        desc += $('#dict').val();
        desc += ' dictionary';
        
        // set the description
        $span.html(desc);
    }
};

// update the transformations
XKPWD.updateTransformationsDescription = function(){
    if(XKPWD.validateFormSection('section_transformations')){
        // get a reference to the section description
        var $span = $('#section_transformations_summary');
        
        // assemble the text
        var desc = $('option:selected', $('#case_transform')).text();
        
        // set the description
        $span.html(desc);
    }
};

// update the rendering of the separator UI when the type is changed
XKPWD.updateSeparatorType = function(){
    // get the selected separator type
    var sepType = $('#separator_type').val();
    
    if(sepType == 'NONE'){
        $('span#separator_type_char, span#separator_type_random').hide(XKPWD.aniTime);
        // disable the option to use the separator for padding
        if($('#padding_char_type').val() == 'SEPARATOR'){
            $('#padding_char_type').val('CHAR');
            $('#padding_char_type').change();
        }
        $('#padding_char_type_separator').prop('disabled', true);
    }else if(sepType == 'CHAR'){
        $('span#separator_type_char').show(XKPWD.aniTime);
        $('span#separator_type_random').hide(XKPWD.aniTime);
        // enable the option to use the separator for padding
        $('#padding_char_type_separator').prop('disabled', false);
    }else if(sepType == 'RANDOM'){
        $('span#separator_type_random').show(XKPWD.aniTime);
        $('span#separator_type_char').hide(XKPWD.aniTime);
        // enable the option to use the separator for padding
        $('#padding_char_type_separator').prop('disabled', false);
    }else{
        try{console.log('WARNING - Received invalid separator_type=' + sepType)}catch(e){};
    }
};

// update the separator description
XKPWD.updateSeparatorDescription = function(){
    // get a reference to the section description
    var $span = $('#section_separator_summary');
    
    // only render if valid
    if(XKPWD.validateFormSection('section_separator')){
        // assemble the text
        var sepType = $('#separator_type').val();
        var desc = '';
        if(sepType == 'NONE'){
            desc = '-none-';
        }else if(sepType == 'CHAR'){
            desc = 'the character <code>' + $('#separator_type_char_tb').val() + '</code>';
        }else if(sepType == 'RANDOM'){
            desc = 'a character randomly chosen from the set: ';
            var sepAlphabet = XKPWD.separatorAlphabet();
            sepAlphabet.forEach(function(sepChar){
                desc += '<code>' + sepChar + '</code>';
            });
        }
        
        // set the description
        $span.html(desc);
    }
};

// update the padding digits description
XKPWD.updatePaddingDigitsDescription = function(){
    if(XKPWD.validateFormSection('section_padding_digits')){
        // get a reference to the section description
        var $span = $('#section_padding_digits_summary');
        
        // assemble the text
        var numBefore = $('#padding_digits_before').val();
        var numAfter = $('#padding_digits_after').val();
        var desc = '';
        if(numBefore == numAfter){
            if(numBefore == 0 && numAfter == 0){
                desc = '-none-';
            }else{
                desc = numBefore + ' digit';
                if(numBefore > 1){
                    desc += 's';
                }
                desc += ' before and after the words';
            }
        }else{
            if(numBefore == 0){
                desc = 'No digits'
            }else{
                desc = numBefore + ' digit';
                if(numBefore > 1){
                    desc += 's';
                }
            }
            desc += ' before and ';
            if(numAfter == 0){
                desc += ' none';
            }else{
                desc += numAfter
            }
            desc += ' after the words';
        }
        
        // set the description
        $span.html(desc);
    }
};

// update the rendering of the padding symbols UI when the type is changed
XKPWD.updatePaddingType = function(){
    // get the selected padding type
    var padType = $('#padding_type').val();
    
    if(padType == 'NONE'){
        $('span#padding_type_fixed, span#padding_type_adaptive, div#padding_char_container').hide(XKPWD.aniTime);
    }else if(padType == 'FIXED'){
        // before showing anything, make sure there are some characters set
        if($('#padding_characters_before').val() == 0 && $('#padding_characters_after').val() == 0){
           $('#padding_characters_before, #padding_characters_after').val(2);
           XKPWD.updatePaddingSymbolsDescription();
        }
        $('span#padding_type_fixed').show(XKPWD.aniTime);
        $('span#padding_type_adaptive').hide(XKPWD.aniTime);
        $('div#padding_char_container').show(XKPWD.aniTime);
    }else if(padType == 'ADAPTIVE'){
        $('span#padding_type_adaptive').show(XKPWD.aniTime);
        $('span#padding_type_fixed').hide(XKPWD.aniTime);
        $('div#padding_char_container').show(XKPWD.aniTime);
    }else{
        try{console.log('WARNING - Received invalid padding_type=' + padType)}catch(e){};
    }
};

// update the rendering of the padding character UI when the type is changed
XKPWD.updatePaddingCharacterType = function(){
    // get the selected padding character type
    var padCharType = $('#padding_char_type').val();
    
    if(padCharType == 'SEPARATOR'){
        // only allow this option be selected when there is a separator character, if not, switch to single separator char
        if($('#separator_type').val() == 'NONE'){
            $('#padding_char_type').val('CHAR');
            XKPWD.updatePaddingCharacterType();
            return;
        }
        // if it is OK to select this uption, update the UI appropriately
        $('span#padding_char_type_char').hide(XKPWD.aniTime);
        $('span#padding_char_type_random').hide(XKPWD.aniTime);
    }else if(padCharType == 'CHAR'){
        $('span#padding_char_type_char').show(XKPWD.aniTime);
        $('span#padding_char_type_random').hide(XKPWD.aniTime);
    }else if(padCharType == 'RANDOM'){
        $('span#padding_char_type_char').hide(XKPWD.aniTime);
        $('span#padding_char_type_random').show(XKPWD.aniTime);
    }else{
        try{console.log('WARNING - Received invalid padCharType=' + padCharType)}catch(e){};
    }
};

// update the padding symbols description
XKPWD.updatePaddingSymbolsDescription = function(){
    if(XKPWD.validateFormSection('section_padding_symbols')){
        // get a reference to the section description
        var $span = $('#section_padding_symbols_summary');
        
        // assemble the text
        var desc = '';
        
        // start with the type
        var padType = $('#padding_type').val();
        if(padType == 'NONE'){
            desc = '-none-';
        }else if(padType == 'FIXED'){
            var numBefore = $('#padding_characters_before').val();
            var numAfter = $('#padding_characters_after').val();
            // if padding front and back is zero, change to no padding and return
            if(numBefore == 0 && numAfter == 0){
                $('#padding_type').val('NONE');
                $('#padding_type').change();
                return;
            }
            if(numBefore == numAfter){
                desc = numBefore + ' symbol';
                if(numBefore > 1){
                    desc += 's';
                }
                desc += ' will be added to the front and back of the password. ';
            }else{
                if(numBefore == 0){
                    desc = 'No symbols'
                }else{
                    desc = numBefore + ' symbol';
                    if(numBefore > 1){
                        desc += 's';
                    }
                }
                desc += ' will be added to the front of the password, and ';
                if(numAfter == 0){
                    desc += 'none';
                }else{
                    desc += numAfter;
                }
                desc += ' to the back. ';
            }
        }else if(padType == 'ADAPTIVE'){
            desc = 'The password will be padded to a length of ' + $('#pad_to_length').val() + ' characters with a symbol. ';
        }else{
            try{console.log('WARNING - Received invalid padType=' + padType)}catch(e){};
            return;
        }
        
        // then append the character detail
        if(padType != 'NONE'){
            var padCharType = $('#padding_char_type').val();
            if(padCharType == 'SEPARATOR'){
                desc += 'The separator character will be used to as the symbol.';
            }else if(padCharType == 'CHAR'){
                desc += 'The symbol <code>' + $('#padding_character').val() + '</code> will be used.';
            }else if(padCharType == 'RANDOM'){
                desc += 'The symbol will be randomly chosen from the set: ';
                var padAlphabet = XKPWD.paddingAlphabet();
                padAlphabet.forEach(function(padChar){
                    desc += '<code>' + padChar + '</code>';
                });
            }else{
                try{console.log('WARNING - Received invalid padCharType=' + padCharType)}catch(e){};
                return;
            }
        }
        
        // set the description
        $span.html(desc);
    }
};

// a function to update the rendering of the overall config summary
XKPWD.updateConfigSummary = function(){
    //
    // first update the password structure
    //
    
    // assemble the markup
    var $newMarkup = $('<span></span>');
    
    // start with the words (and separator)
    var separator = XKPWD.separatorCharacter();
    $newMarkup.append(XKPWD._summarySegment('word'));
    for(var i = 1; i < XKPWD.numWords(); i++){
        if(separator != 'NONE'){
            $newMarkup.append(XKPWD._summarySegment('s'));
        }
        $newMarkup.append(XKPWD._summarySegment('word'));
    }
    
    // then add the digits (if any)
    var digitsBefore = XKPWD.paddingDigitsBefore();
    var digitsAfter = XKPWD.paddingDigitsAfter();
    if(digitsBefore > 0){
        if(separator != 'NONE'){
            $newMarkup.prepend(XKPWD._summarySegment('s'));
        }
        for(var i = 0; i< digitsBefore; i++){
            $newMarkup.prepend(XKPWD._summarySegment('d'));
        }
    }
    if(digitsAfter > 0){
        if(separator != 'NONE'){
            $newMarkup.append(XKPWD._summarySegment('s'));
        }
        for(var i = 0; i< digitsAfter; i++){
            $newMarkup.append(XKPWD._summarySegment('d'));
        }
    }
    
    // finally deal with the padding
    var padding = XKPWD.paddingType();
    if(padding == 'FIXED'){
        for(var i = 0; i < XKPWD.paddingCharactersBefore(); i++){
            $newMarkup.prepend(XKPWD._summarySegment('p'));
        }
        for(var i = 0; i < XKPWD.paddingCharactersAfter(); i++){
            $newMarkup.append(XKPWD._summarySegment('p'));
        }
    }
    if(padding == 'ADAPTIVE'){
        $newMarkup.append(XKPWD._summarySegment('p'));
        $newMarkup.append(XKPWD._summarySegment('&hellip;'));
        $newMarkup.append(XKPWD._summarySegment('p'));
    }
    
    // add the markup into the page
    var $structContainer = $('#password_structure_container');
    $structContainer.empty();
    $structContainer.append($newMarkup);
    
    //
    // Then update the password stats
    //
    
    // get the stats
    var stats = XKPWD._stats();
    
    // generate the length markup
    var lengthString = "";
    if(stats.min_length == stats.max_length){
        lengthString += 'always ' + stats.min_length + ' characters';
    }else{
        lengthString += 'between ' + stats.min_length + ' and ' +  stats.max_length + ' characters';
    }
    
    // write the length markup to the page
    $('#length_container').html(lengthString);
    
    // generate the character coverage markup
    //var coverageString = 'Mixed Case = ' + stats.contains_mixed_case + ', Digits = ' + stats.contains_digits + ', Symbols = ' + stats.contains_symbols;
    var $coverage = $('<span></span>');
    $coverage.append($('<span>abcABC</span>').addClass('losenge ' + stats.contains_mixed_case.toLowerCase()));
    $coverage.append($('<span>0-9</span>').addClass('losenge ' + stats.contains_digits.toLowerCase()));
    $coverage.append($('<span>$!*</span>').addClass('losenge ' + stats.contains_symbols.toLowerCase()));
    
    // write the coverage markup to the page
    $('#coverage_container').empty().append($coverage);
};

// a helper function for generating summary component spans
XKPWD._summarySegment = function(txt){
    return $('<span></span>').html(txt).addClass('losenge structure_element');
};

// a helper function to generate the passord stats
XKPWD._stats = function(){
    //
    // Work out the lengths
    //
    
    // initialise the length counters
    var min_length = 0;
    var max_length = 0;
    
    // if the padding type is fixed, then there is no need to do any calculations, so check that first
    var paddingType = XKPWD.paddingType();
    if(paddingType == 'ADAPTIVE'){
        min_length = max_length = XKPWD.padToLength();
    }else{
        // start the calculations with the number of characters from just the words
        var numWords = XKPWD.numWords();
        min_length += numWords * XKPWD.wordLengthMin();
        max_length += numWords * XKPWD.wordLengthMax();
        
        // add in the number of speparator characters, if any
        var separatorCharacter = XKPWD.separatorCharacter();
        if(separatorCharacter != 'NONE'){
            min_length += numWords - 1;
            max_length += numWords - 1;
        }
        
        // add in the number of padding digits, if any
        var paddingDigitsBefore = XKPWD.paddingDigitsBefore();
        var paddingDigitsAfter = XKPWD.paddingDigitsAfter();
        if(paddingDigitsBefore > 0){
            min_length += paddingDigitsBefore;
            max_length += paddingDigitsBefore;
            if(separatorCharacter != 'NONE'){
                min_length++;
                max_length++;
            }
        }
        if(paddingDigitsAfter > 0){
            min_length += paddingDigitsAfter;
            max_length += paddingDigitsAfter;
            if(separatorCharacter != 'NONE'){
                min_length++;
                max_length++;
            }
        }
        
        // deal with the number of padding symbols, if any
        if(paddingType == 'FIXED'){
            var paddingCharactersBefore = XKPWD.paddingCharactersBefore();
            var paddingCharactersAfter = XKPWD.paddingCharactersAfter();
            min_length += paddingCharactersBefore + paddingCharactersAfter;
            max_length += paddingCharactersBefore + paddingCharactersAfter;
        }
    }
    
    //
    // work out the character coverage
    //
    
    var contains_mixed_case = 'N';
    var contains_digits = 'N';
    var contains_symbols = 'N';
    
    // if the case transform is 'ALTERNATE', 'CAPITALISE', 'INVERT', or 'RANDOM', set yes to mixed case
    var caseTransform = XKPWD.caseTransform();
    if(caseTransform == 'ALTERNATE' || caseTransform == 'CAPITALISE' | caseTransform == 'INVERT' || caseTransform == 'RANDOM'){
        contains_mixed_case = 'Y';
    }
    // if the case transform is 'NONE' then it depends on the dictionary, so set 'M' (maybe)
    if(caseTransform == 'NONE'){
        contains_mixed_case = 'M';
    }
    
    // gather needed data once
    var separatorCharacter = XKPWD.separatorCharacter();
    var allSeps = XKPWD.separatorAlphabet().join('');
    var allPads = XKPWD.paddingAlphabet().join('');
    var paddingCharacter = XKPWD.paddingCharacter();
    
    // if there are padding digits, there are definitely digits, if not, check the padding and separator characters to be sure to be sure
    if(XKPWD.paddingDigitsBefore() > 0 || XKPWD.paddingDigitsAfter() > 0){
        contains_digits = 'Y';
    }else{
        // check the separator character for numbers
        if(separatorCharacter != 'NONE'){
            if(separatorCharacter == 'RANDOM'){
                // see if they are all digits, or contain digits
                if(String(allSeps).match(/^\d+$/)){
                    contains_digits = 'Y';
                }else if(String(allSeps).match(/\d/)){
                    contains_digits = 'M';
                }
            }else{
                // if the specified separator is a digit, set Y
                if(String(separatorCharacter).match(/\d/)){
                    contains_digits = 'Y';
                }
            }
        }
        
        // check the padding symbol for numbers (if we haven't already found them for sure)
        if(contains_digits != 'Y' && paddingType != 'NONE'){
            if(paddingCharacter != 'SEPARATOR'){
                if(paddingCharacter == 'RANDOM'){
                    // see if they are all digits, or contain digits
                    if(String(allPads).match(/^\d+$/)){
                        contains_digits = 'Y';
                    }else if(String(allPads).match(/\d/)){
                        contains_digits = 'M';
                    }
                }else{
                    if(String(paddingCharacter).match(/\d/)){
                        contains_digits = 'Y';
                    }
                }
            }
        }
    }
    
    // check the separator for symbols (not a-z A-Z or 0-9)
    if(separatorCharacter != 'NONE'){
        if(separatorCharacter == 'RANDOM'){
            // see if they are all symbols, or contain symbols
            if(String(allSeps).match(/^[^a-zA-Z0-9]+$/)){
                contains_symbols = 'Y';
            }else if(String(allSeps).match(/[^a-zA-Z0-9]/)){
                contains_symbols = 'M';
            }
        }else{
            // if the specified separator is a symbol, set Y
            if(String(separatorCharacter).match(/[^a-zA-Z0-9]/)){
                contains_symbols = 'Y';
            }
        }
    }
    
    // check the padding for symbols (unless the separator is definitely a symbol)
    if(contains_symbols != 'Y' && paddingType != 'NONE'){
        if(paddingCharacter != 'SEPARATOR'){
            if(paddingCharacter == 'RANDOM'){
                // see if they are all symbols, or contain symbols
                if(String(allPads).match(/^[^a-zA-Z0-9]+$/)){
                    contains_symbols = 'Y';
                }else if(String(allPads).match(/[^a-zA-Z0-9]/)){
                    contains_symbols = 'M';
                }
            }else{
                if(String(paddingCharacter).match(/[^a-zA-Z0-9]/)){
                    contains_symbols = 'Y';
                }
            }
        }
    }
    
    //
    // return the stats
    //
    return {
        min_length: min_length,
        max_length: max_length,
        contains_mixed_case: contains_mixed_case,
        contains_digits: contains_digits,
        contains_symbols: contains_symbols
    };
}

// update the number of passwords to generate
XKPWD.updateNumPasswords = function(){
    // get the number of passwords needed
    var numPwds = parseInt($('#num_passwords').val());
    
    // update the text in the generate button
    if(numPwds > 1){
        $('#generate_password_btn').val('Generate ' + numPwds + ' Passwords');
    }else{
        $('#generate_password_btn').val('Generate Password');
    }
    
    // update the height of the text area
    $('#generated_password').attr('rows', numPwds);
};

//
// --- Validation Functions ---------------------------------------------------
//

// a function to validate one or all sections of the form (use section ALL to validate all)
XKPWD.validateFormSection = function(sec){
    //  count how many sections were validated
    var secs_validated = 0;
    
    // skip over, the section with no valiudation to do, but count them as 1 to
    // ensure there is no false error thrown below
    if(sec == 'section_words' || sec == 'section_transformations' || sec == 'section_padding_digits'){
        secs_validated++;
    }
    
    // deal with the sections where there is real work to do
    // store all invalid secitons found in an array
    var invalidSections = [];
    if(sec == 'ALL' || sec == 'section_separator'){
        // validate the separator
        var sepType = $('#separator_type').val();
        var secOK = true;
        if(sepType == 'CHAR'){
            // make sure exactly one character is entered as the separator
            if($('#separator_type_char_tb').val().length == 1){
                $('#separator_type_char_tb_err').hide(XKPWD.aniTime);
            }else{
                $('#separator_type_char_tb_err').show(XKPWD.aniTime);
                secOK = false;
            }
        }
        if(sepType == 'RANDOM'){
            // make sure at least two characters are entered
            var sepAplbabet = XKPWD.separatorAlphabet();
            if(sepAplbabet.length >= 2){
                $('#separator_type_random_err').hide(XKPWD.aniTime);
            }else{
                $('#separator_type_random_err').show(XKPWD.aniTime);
                secOK = false;
            }
        }
        
        // if we found an error in this section, record that fact
        if(!secOK){
            invalidSections.push('section_separator');
        }
        
        // udpate the rendering for this section
        XKPWD._renderSectionErrorStatus('section_separator', secOK);
        
        secs_validated++;
    }
    if(sec == 'ALL' || sec == 'section_padding_symbols'){
        // validate the symbol padding
        var padType = $('#padding_type').val();
        var secOK = true;
        if(padType == 'ADAPTIVE'){
            // make sure the pad to length is sane
            var padToLength = parseInt($('#pad_to_length').val());
            if(padToLength >= 8 && padToLength <= 999){
                $('#pad_to_length_err').hide(XKPWD.aniTime);
            }else{
                $('#pad_to_length_err').show(XKPWD.aniTime);
                secOK = false;
            }
        }
        if(padType == 'FIXED' || padType == 'ADAPTIVE'){
            // if there is a padding character specified, validate it
            var padCharType = $('#padding_char_type').val();
            if(padCharType == 'CHAR'){
                // make sure there is exactly one padding character set
                if($('#padding_character').val().length == 1){
                    $('#padding_character_err').hide(XKPWD.aniTime);
                }else{
                    $('#padding_character_err').show(XKPWD.aniTime);
                    secOK = false;
                }
            }
            if(padCharType == 'RANDOM'){
                // make sure we have at least two characters to choose between
                if(XKPWD.paddingAlphabet().length >= 2){
                    $('#padding_char_type_random_err').hide(XKPWD.aniTime);
                }else{
                    $('#padding_char_type_random_err').show(XKPWD.aniTime);
                    secOK = false;
                }
            }
        }
        
        // if we found an error in this section, record that fact
        if(!secOK){
            invalidSections.push('section_padding_symbols');
        }
        
        // udpate the rendering for this section
        XKPWD._renderSectionErrorStatus('section_padding_symbols', secOK);
        
        secs_validated++;
    }
    
    // make sure we validated at least one seciton, if we didn't, there was a mistake, so throw a warning
    if(!secs_validated){
        try{console.log('WARNING - Received invalid section id sec=' + sec)}catch(e){};
    }
    
    // update the overall summary and action buttons as appropriate
    if(invalidSections.length == 0){
        // all is well so render the summary and enable submission
        XKPWD.updateConfigSummary();
        $('#generate_password_btn').prop('disabled', false);
        $('#save_config_btn').prop('disabled', false);
    }else{
        // something is invalid, so write error messages and disable submission
        $('.summary_data_container').html('<span class="error">Invalid Config</span>');
        $('#generate_password_btn').prop('disabled', true);
        $('#save_config_btn').prop('disabled', true);
    }
    
    // return true or false as apppropriate
    if(invalidSections.length == 0){
        return true;
    }
    return false;
};

// a helper function to show a section as having an error
XKPWD._renderSectionErrorStatus = function(sec, isValid){
    var $validationIcon = $('#' + sec + '_validation_icon');
    var $sectionSummary = $('#' + sec + '_summary');
    if($validationIcon.length && $sectionSummary.length){
        if(isValid){
            $validationIcon.attr('src', XKPWD.icons['valid']).attr('alt', 'OK');
        }else{
            $validationIcon.attr('src', XKPWD.icons['invalid']).attr('alt', 'VALIDATION ERROR');
            $sectionSummary.html('<span class="error">invalid input</span>');
        }
    }else{
        try{console.log('WARNING - missing DOM elements: $validationIcon.length=' + $validationIcon.length + ' & $sectionSummary.length=' + $sectionSummary.length + '(sec=' + sec + ')')}catch(e){};
    }
}

// function to validate a config object - throws errors rather than returning false
// NOTE - this function also casts all values that should be numeric to numeric
XKPWD.validateConfig = function(cfg){
    // if we weren't even passed a config to test - whine
    if(arguments.length < 1){
        throw "blank config";
    }
    
    // check the words details
    var numWords = parseInt(cfg.num_words);
    if(!(XKPWD._isInt(cfg.num_words) && numWords >= 2 && numWords <= 10)){
        throw "<code>num_words</code> must be an integer between 2 and 10 inclusive";
    }
    cfg.num_words = numWords;
    var wordLengthMin = parseInt(cfg.word_length_min);
    if(!(XKPWD._isInt(cfg.word_length_min) && wordLengthMin >= 4 && wordLengthMin <= 12)){
        throw "<code>word_length_min</code> must be an integer between 4 and 12 inclusive";
    }
    wordLengthMax = parseInt(cfg.word_length_max);
    if(!(XKPWD._isInt(cfg.word_length_max) && wordLengthMax >= 4 && wordLengthMax <= 12)){
        throw "<code>word_length_max</code> must be an integer between 4 and 12 inclusive";
    }
    if(!(wordLengthMin <= wordLengthMax)){
        throw "<code>word_length_min</code> must be less than or equal to <code>word_length_max</code>";
    }
    cfg.word_length_min = wordLengthMin;
    cfg.word_length_max = wordLengthMax;
    
    // check transformations
    if(!(cfg.case_transform == 'ALTERNATE' || cfg.case_transform == 'CAPITALISE' || cfg.case_transform == 'INVERT' || cfg.case_transform == 'LOWER' || cfg.case_transform == 'NONE' || cfg.case_transform == 'RANDOM' || cfg.case_transform == 'UPPER')){
        throw "<code>case_transform</code> must be one of <code>ALTERNATE</code>, <code>CAPITALISE</code>, <code>INVERT</code>, <code>LOWER</code>, <code>NONE</code>, <code>RANDOM</code> or <code>UPPER</code>";
    }
    
    // check separator
    if(!(cfg.separator_character == 'NONE' || cfg.separator_character == 'RANDOM' || String(cfg.separator_character).length == 1)){
        throw "<code>separator_character</code> must be a single character, or the special value <code>NONE</code> or <code>RANDOM</code>";
    }
    if(cfg.separator_character == 'RANDOM'){
        // we need either separator_alphabet or symbol_alphabet to be present and valid
        if($.isArray(cfg.separator_alphabet)){
            if(!XKPWD._isAlphabet(cfg.separator_alphabet)){
                throw "<code>separator_alphabet</code> must be an array containing at least two entries, each a single character";
            }
        }else if($.isArray(cfg.symbol_alphabet)){
            if(!XKPWD._isAlphabet(cfg.symbol_alphabet)){
                throw "<code>symbol_alphabet</code> must be an array containing at least two entries, each a single character";
            }
        }else{
            throw "<code>separator_character=RANDOM</code> requires either <code>separator_alphabet</code> or <code>symbol_alphabet</code> be defined";
        }
    }
    
    // check the padding digits
    var padDB = parseInt(cfg.padding_digits_before);
    if(!(XKPWD._isInt(cfg.padding_digits_before) && padDB >= 0 && padDB <= 5)){
        throw "<code>padding_digits_before</code> must be an integer between 0 and 5 inclusive";
    }
    cfg.padding_digits_before = padDB;
    var padDA = parseInt(cfg.padding_digits_after);
    if(!(XKPWD._isInt(cfg.padding_digits_after) && padDA >= 0 && padDA <= 5)){
        throw "<code>padding_digits_after</code> must be an integer between 0 and 5 inclusive";
    }
    cfg.padding_digits_after = padDA;
    
    // check the padding characters
    if(!(cfg.padding_type == 'NONE' || cfg.padding_type == 'FIXED' || cfg.padding_type == 'ADAPTIVE')){
        throw "<code>padding_type</code> must be one of <code>NONE</code>, <code>FIXED</code> or <code>ADAPTIVE</code>";
    }
    if(cfg.padding_type == 'FIXED'){
        var charBefore = parseInt(cfg.padding_characters_before);
        if(!(XKPWD._isInt(cfg.padding_characters_before) && charBefore >= 0 && charBefore <= 5)){
            throw "<code>padding_characters_before</code> must be an integer between 0 and 5 inclusive";
        }
        cfg.padding_characters_before = charBefore;
        var charAfter = parseInt(cfg.padding_characters_after);
        if(!(XKPWD._isInt(cfg.padding_characters_after) && charAfter >= 0 && charAfter <= 5)){
            throw "<code>padding_characters_after</code> must be an integer between 0 and 5 inclusive";
        }
        cfg.padding_characters_after = charAfter;
        if(charBefore + charAfter == 0){
            throw "<code>padding_type=FIXED</code> requires that <code>padding_characters_before + padding_characters_after</code> be greater than 0";
        }
    }
    if(cfg.padding_type == 'ADAPTIVE'){
        var padTo = parseInt(cfg.pad_to_length);
        if(!(XKPWD._isInt(cfg.pad_to_length) && padTo >= 8 && padTo <= 999)){
            throw "<code>pad_to_length</code> must be an integer between 8 and 999 inclusive";
        }
        cfg.pad_to_length = padTo;
    }
    if(cfg.padding_type != 'NONE'){
        if(!(cfg.padding_character == 'SEPARATOR' || cfg.padding_character == 'RANDOM' || String(cfg.padding_character).length == 1)){
            throw "<code>padding_character</code> must be a single character, or the special value <code>SEPARATOR</code> or <code>RANDOM</code>";
        }
        if(cfg.padding_character == 'SEPARATOR' && cfg.separator_character == 'NONE'){
            throw "<code>padding_character=SEPARATOR</code> cannot be used when <code>separator_character=NONE</code>";
        }
        if(cfg.padding_character == 'RANDOM'){
            // we need either padding_alphabet or symbol_alphabet to be present and valid
            if($.isArray(cfg.padding_alphabet)){
                if(!XKPWD._isAlphabet(cfg.padding_alphabet)){
                    throw "<code>padding_alphabet</code> must be an array containing at least two entries, each a single character";
                }
            }else if($.isArray(cfg.symbol_alphabet)){
                if(!XKPWD._isAlphabet(cfg.symbol_alphabet)){
                    throw "<code>symbol_alphabet</code> must be an array containing at least two entries, each a single character";
                }
            }else{
                throw "<code>padding_character=RANDOM</code> requires either <code>padding_alphabet</code> or <code>symbol_alphabet</code> be defined";
            }
        }
    }
    
    //if we got here all is well so return true
    return true;
};

// helper function to check if a value is an integer
XKPWD._isInt = function(n){
    if(String(n).match(/^\d+$/)){
        return true;
    }
    return false;
};

// helper function to check if an array is a valid alphabet
XKPWD._isAlphabet = function(a){
    if($.isArray(a)){
        if(a.length < 2){
            return false;
        }
        for(var i = 0; i < a.length; i++){
            if(String(a[i]).length != 1){
                return false;
            }
        }
        return true;
    }
    return false;
};

//
// --- Config Form Data Accessor Functions ------------------------------------
//

// get/set the number of words
XKPWD.numWords = function(){
    if(arguments.length > 0){
        $('#num_words').val(arguments[0]).change();
    }
    return parseInt($('#num_words').val());
}

// get/set the minimum word length
XKPWD.wordLengthMin = function(){
    if(arguments.length > 0){
        $('#word_length_min').val(arguments[0]).change();
    }
    return parseInt($('#word_length_min').val());
};

// get/set the maximum word length
XKPWD.wordLengthMax = function(){
    if(arguments.length > 0){
        $('#word_length_max').val(arguments[0]).change();
    }
    return parseInt($('#word_length_max').val());
};

// get/set the case transform
XKPWD.caseTransform = function(){
    if(arguments.length > 0){
        $('#case_transform').val(arguments[0]).change();
    }
    return $('#case_transform').val();
};

// get/set the separator character
XKPWD.separatorCharacter = function(){
    if(arguments.length > 0){
        var sepChar = arguments[0];
        if(sepChar == 'NONE' || sepChar == 'RANDOM'){
            $('#separator_type').val(sepChar).change();
        }else{
            $('#separator_type_char_tb').val(sepChar);
            $('#separator_type').val('CHAR').change();
        }
    }
    var separatorType = $('#separator_type').val();
    if(separatorType == 'NONE' || separatorType == 'RANDOM'){
        return separatorType;
    }else{
        return $('#separator_type_char_tb').val();
    }
};

// get/set the separator alphabet
XKPWD.separatorAlphabet = function(){
    if(arguments.length > 0){
        var charArray = arguments[0];
        XKPWD.expandTextboxSetTo('separator_type_random', charArray.length);
        XKPWD.emptyTextboxSet('separator_type_random');
        for(var c = 1; c <= charArray.length; c++){
            $('#separator_type_random_' + c).val(charArray[c - 1]);
        }
        $('#separator_type_random_1').keyup();
    }
    var sepAlphabet = [];
    var i = 1;
    while($('#separator_type_random_' + i).length){
        var sep_char = $('#separator_type_random_' + i).val();
        if(sep_char.length){
            sepAlphabet.push(sep_char);
        }
        i++;
    }
    return sepAlphabet;
};

// get/set the number of padding digits before
XKPWD.paddingDigitsBefore = function(){
    if(arguments.length > 0){
        $('#padding_digits_before').val(arguments[0]).change();
    }
    return parseInt($('#padding_digits_before').val());
};

// get/set the number of padding digits after
XKPWD.paddingDigitsAfter = function(){
    if(arguments.length > 0){
        $('#padding_digits_after').val(arguments[0]).change();
    }
    return parseInt($('#padding_digits_after').val());
};

// get/set the padding type
XKPWD.paddingType = function(){
    if(arguments.length > 0){
        $('#padding_type').val(arguments[0]).change();
    }
    return $('#padding_type').val();
};

// get/set the number of padding characters before
XKPWD.paddingCharactersBefore = function(){
    if(arguments.length > 0){
        $('#padding_characters_before').val(arguments[0]).change();
    }
    return parseInt($('#padding_characters_before').val());
};

// get/set the number of padding characters after
XKPWD.paddingCharactersAfter = function(){
    if(arguments.length > 0){
        $('#padding_characters_after').val(arguments[0]).change();
    }
    return parseInt($('#padding_characters_after').val());
};

// get/set the adaptive padding length
XKPWD.padToLength = function(){
    if(arguments.length > 0){
        $('#pad_to_length').val(arguments[0]).change();
    }
    return parseInt($('#pad_to_length').val());
};

// get/set the padding character
XKPWD.paddingCharacter = function(){
    if(arguments.length > 0){
        var padChar = arguments[0];
        if(padChar == 'SEPARATOR' || padChar == 'RANDOM'){
            $('#padding_char_type').val(padChar).change();
        }else{
            $('#padding_character').val(padChar);
            $('#padding_char_type').val('CHAR').change();
        }
    }
    var padCharType = $('#padding_char_type').val();
    if(padCharType == 'SEPARATOR' || padCharType == 'RANDOM'){
        return padCharType;
    }else{
        return $('#padding_character').val();
    }
}

// get/set the padding alphabet
XKPWD.paddingAlphabet = function(){
    if(arguments.length > 0){
        var charArray = arguments[0];
        XKPWD.expandTextboxSetTo('padding_char_type_random', charArray.length);
        XKPWD.emptyTextboxSet('padding_char_type_random');
        for(var c = 1; c <= charArray.length; c++){
            $('#padding_char_type_random_' + c).val(charArray[c - 1]);
        }
        $('#padding_char_type_random_1').keyup();
    }
    var padAlphabet = [];
    var i = 1;
    while($('#padding_char_type_random_' + i).length){
        var padChar = $('#padding_char_type_random_' + i).val();
        if(padChar.length){
            padAlphabet.push(padChar);
        }
        i++;
    }
    return padAlphabet;
};

//
//--- Password generation functions -------------------------------------------
//

// function for generating a config object from the form
XKPWD.generateConfig = function(){
    // create a blank object
    var config = {};
    
    // start with the words
    config['num_words'] = XKPWD.numWords();
    config['word_length_min'] = XKPWD.wordLengthMin();
    config['word_length_max'] = XKPWD.wordLengthMax();
    
    // then deal with the transformations
    config['case_transform'] = XKPWD.caseTransform();
    
    // then the separator
    config['separator_character'] = XKPWD.separatorCharacter();
    if(config['separator_character'] == 'RANDOM'){
        config['separator_alphabet'] = XKPWD.separatorAlphabet();
    }
    
    // then the padding digits
    config['padding_digits_before'] = XKPWD.paddingDigitsBefore();
    config['padding_digits_after'] = XKPWD.paddingDigitsAfter();
    
    // then the symbol padding
    config['padding_type'] = XKPWD.paddingType();
    if(config['padding_type'] != 'NONE'){
        config['padding_character'] = XKPWD.paddingCharacter();
        if(config['padding_character'] == 'RANDOM'){
            config['symbol_alphabet'] = XKPWD.paddingAlphabet();
        }
        if(config['padding_type'] == 'FIXED'){
            config['padding_characters_before'] = XKPWD.paddingCharactersBefore();
            config['padding_characters_after'] = XKPWD.paddingCharactersAfter();
        }
        if(config['padding_type'] == 'ADAPTIVE'){
            config['pad_to_length'] = XKPWD.padToLength();
        }
    }
    
    // finally, always set the random increment to AUTO
    config['random_increment'] = 'AUTO';
    
    // return the assembled object
    return config;
};

// function for loading a config object into the form
// throws errors
XKPWD.loadConfig = function(cfg){
    // validate the config - throws errors
    XKPWD.validateConfig(cfg);
    
    //
    // load the keys
    //
    
    // word-related keys
    XKPWD.numWords(cfg.num_words);
    XKPWD.wordLengthMin(cfg.word_length_min);
    XKPWD.wordLengthMax(cfg.word_length_max);
    
    // transform-related keys
    XKPWD.caseTransform(cfg.case_transform);
    
    // separator keys
    XKPWD.separatorCharacter(cfg.separator_character);
    if(cfg.separator_character == 'RANDOM'){
        if($.isArray(cfg.separator_alphabet)){
            XKPWD.separatorAlphabet(cfg.separator_alphabet);
        }else{
            XKPWD.separatorAlphabet(cfg.symbol_alphabet);
        }
    }
    
    // padding digit keys
    XKPWD.paddingDigitsBefore(cfg.padding_digits_before);
    XKPWD.paddingDigitsAfter(cfg.padding_digits_after);
    
    // symbol padding keys
    XKPWD.paddingType(cfg.padding_type);
    if(cfg.padding_type == 'FIXED'){
        XKPWD.paddingCharactersBefore(cfg.padding_characters_before);
        XKPWD.paddingCharactersAfter(cfg.padding_characters_after);
    }if(cfg.padding_type == 'ADAPTIVE'){
        XKPWD.padToLength(cfg.pad_to_length);
    }
    if(cfg.padding_type != 'NONE'){
        XKPWD.paddingCharacter(cfg.padding_character);
        if(cfg.padding_character == 'RANDOM'){
            if($.isArray(cfg.padding_alphabet)){
                XKPWD.paddingAlphabet(cfg.padding_alphabet);
            }else{
                XKPWD.paddingAlphabet(cfg.symbol_alphabet);
            }
        }
    }
};