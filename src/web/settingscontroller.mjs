/* istanbul ignore file @preserve */

/**
 * @module web/SettingsController
 */
import log from 'loglevel';

/**
 * @class This class handles the entire Settings pane
 * @constructor
 */
class SettingsController {
  /**
   * model - reference to settings model
   */
  #model;

  /**
   * view - reference to SettingsView
   */
  #view;

  /**
   * config - reference to ConfigController
   */
  #config;
  // eslint-disable-next-line jsdoc/require-description
  /**
   * @param {Object} model - new SettingsModel
   * @param {SettingsView} view - new SettingsView
   */
  constructor(model, view) {
    this.#model = model;
    this.#view = view;

    this.#view.bindSaveSettings(this.saveSettings);
    const config = this.#model.getPreset().config();

    this.#view.renderSettings(config);
    log.trace('SettingsController constructor executed');
  }

  /**
   * Set the config controller separately, so we can use one config controller
   *
   * @param {ConfigController} configController - new ConfigController
   */
  setConfigController( configController) {
    this.#config = configController;

    // Now that the configController is set, we can update the Config Url
     const config = this.#model.getPreset().config();
    this.#config.updateLink(config);
  }

  /**
   * Convert the rendered settings back to the model and pass it on
   * to the [XKPasswd]{@link module:lib/XKPasswd~XKPasswd} class to use
   * for password generation
   *
   * @param {Object} settings - the object containing the new settings
   * @function
   */
  saveSettings = (settings) => {
    log.trace(`controller saveSettings: ${JSON.stringify(settings)}`);

    // convert characters back to numbers
    settings.padding_digits_before = parseInt(settings.padding_digits_before);
    settings.padding_digits_after = parseInt(settings.padding_digits_after);
    settings.padding_characters_before =
      parseInt(settings.padding_characters_before);
    settings.padding_characters_after =
      parseInt(settings.padding_characters_after);
    settings.pad_to_length = parseInt(settings.pad_to_length);

    this.#model.setCustomPreset(settings);

    // Update the URL with the encoded settings
    this.#config.updateLink(settings);
  };

  /**
   * Update settings with the presets
   *
   * @param {Object} config - the configuration
   */
  updateSettings(config, preset = null) {
    log.trace(`controller updateSettings: ${JSON.stringify(config)}`);
    try {
      this.#view.renderSettings(config);
      this.#config.updateLink(config, preset);
    } catch (e) {
      this.#view.renderConfigError(e);
    }
  }
}

export {SettingsController};
