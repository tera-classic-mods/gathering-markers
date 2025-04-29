/* eslint-disable no-param-reassign */
"use strict";

const DefaultSettings = {
	"enabled": true,
	"alert": false,

	"verdra_plant": true,
	"sylva_plant": true,
	"shetla_plant": true,
	"toira_plant": true,
	"luria_plant": true,
	"osyo_plant": true,
	"noctenium_seedpod": true,
	"floretta": true,
	"taproot": true,
	"flame_pepper": true,
	"cobseed": true,
	"mudroot": true,
	"moongourd": true,
	"sky_lotus": true,
	"shevranberry": true,
	"pilka_plant": true,
	"krymetal_ore": true,
	"linmetal_ore": true,
	"normetal_ore": true,
	"shadmetal_ore": true,
	"xermetal_ore": true,
	"eresmetal_ore": true,
	"noctenium_ore": true,
	"cobala_ore": true,
	"sun_essence": true,
	"essence_of_wind": true,
	"star_essence": true,
	"essence_of_ice": true,
	"lightning_essence": true,
	"aether_essence": true,
	"noctenium_flux": true,
	"goblu_essence": true,
	"veridia_plant": true
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
	if (from_ver === undefined) return { ...DefaultSettings, ...settings };
	else if (from_ver === null) return DefaultSettings;
	else {
		from_ver = Number(from_ver);
		to_ver = Number(to_ver);

		if (from_ver + 1 < to_ver) {
			settings = MigrateSettings(from_ver, from_ver + 1, settings);
			return MigrateSettings(from_ver + 1, to_ver, settings);
		}

		const oldsettings = settings;

		switch (to_ver) {
			default:
				settings = Object.assign(DefaultSettings, {});

				for (const option in oldsettings) {
					if (settings[option] !== undefined) {
						settings[option] = oldsettings[option];
					}
				}
		}

		return settings;
	}
};
