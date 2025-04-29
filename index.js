const SettingsUI = require("tera-mod-ui").Settings;

module.exports = function GatheringMarkers(mod) {
	let gui = null;
	const MSG = new TeraMessage(mod);
	const spawnedItems = new Map();
	const spawnedMarkers = new Set();
	const gatheringItemNames = new Map();

	const gatheringItems = {
		"verdra_plant": [1, 2, 3, 6],
		"sylva_plant": [4, 5, 7, 8, 9, 10, 11, 12],
		"shetla_plant": [13, 14, 15, 16, 17, 18, 19, 20, 21],
		"toira_plant": [22, 23, 24, 25, 26, 27, 28, 29, 30],
		"luria_plant": [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
		"osyo_plant": [49],
		"noctenium_seedpod": [50],
		"floretta": [51],
		"taproot": [52],
		"flame_pepper": [53, 58],
		"cobseed": [54, 59, 60],
		"mudroot": [55],
		"moongourd": [56, 61],
		"sky_lotus": [57],
		"shevranberry": [62],
		"pilka_plant": [63],
		"krymetal_ore": [101, 102, 103, 106],
		"linmetal_ore": [104, 105, 107, 108, 109, 110, 111, 112],
		"normetal_ore": [113, 114, 115, 116, 117, 118, 119, 120, 121],
		"shadmetal_ore": [122, 123, 124, 125, 126, 127, 128, 129, 130],
		"xermetal_ore": [131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148],
		"eresmetal_ore": [149],
		"noctenium_ore": [150],
		"cobala_ore": [151],
		"sun_essence": [201, 202, 203, 206, 301, 302, 303, 304, 306],
		"essence_of_wind": [204, 205, 207, 208, 209, 210, 211, 212, 305, 307, 308, 309, 310, 311, 312],
		"star_essence": [213, 214, 215, 216, 217, 218, 219, 220, 221, 313, 314, 315, 316, 317, 318, 319, 320, 321],
		"essence_of_ice": [222, 223, 224, 225, 226, 227, 228, 229, 230, 322, 323, 324, 325, 326, 327, 328, 329, 330],
		"lightning_essence": [231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348],
		"aether_essence": [349],
		"noctenium_flux": [350],
		"goblu_essence": [351],
		"veridia_plant": [400]
	};

	const gatheringItemIds = Object.values(gatheringItems).flat();

	mod.command.add("gat", {
		"ui": () => showGui(),
		"$none": () => {
			mod.settings.enabled = !mod.settings.enabled;
			MSG.chat(`Module ${mod.settings.enabled ? "enabled" : "disabled"}`);

			respawnMarkers();
		}
	});

	mod.game.on("enter_character_lobby", async () => {
		await applyGatheringItemNames();

		if (global.TeraProxy.GUIMode) {
			gui = new SettingsUI(mod, getSettingsStructure(), mod.settings, {
				"width": 400,
				"height": 720,
				"resizable": false
			});

			gui.on("update", settings => {
				mod.settings = settings;
				respawnMarkers();
			});
		}
	});

	async function applyGatheringItemNames() {
		(await mod.queryData("/StrSheet_Collections/String@collectionId=?", [gatheringItemIds], true))
			.forEach(res => gatheringItemNames.set(res.attributes.collectionId, res.attributes.string));
	}

	mod.hook("S_LOAD_TOPO", "*", () => {
		spawnedItems.clear();
		spawnedMarkers.clear();
	});

	mod.hook("S_SPAWN_COLLECTION", "*", event => {
		if (!mod.settings.enabled || !gatheringItemIds.includes(event.id)) return;

		const itemKey = Object.keys(gatheringItems).find(k => gatheringItems[k].includes(event.id));
		const itemString = `Found ${MSG.BLU(gatheringItemNames.get(event.id))}`;

		if (mod.settings[itemKey] === true && mod.settings.alert) {
			MSG.chat(itemString);
			MSG.raids(itemString);
		}

		spawnedItems.set(event.gameId, event);
		respawnMarkers();
	});

	mod.hook("S_DESPAWN_COLLECTION", 2, event => {
		if (!mod.settings.enabled || !spawnedItems.has(event.gameId)) return;

		spawnedItems.set(event.gameId, null);
		respawnMarkers();
	});

	function respawnMarkers() {
		spawnedItems.forEach((event, itemId) => {
			if (mod.settings.enabled && event !== null) {
				const itemKey = Object.keys(gatheringItems).find(k => gatheringItems[k].includes(event.id));

				if (itemKey && mod.settings[itemKey] === true) {
					return spawnMarker(itemId, event.loc);
				}
			}

			despawnMarker(itemId);
		});
	}

	function spawnMarker(gameId, loc) {
		if (spawnedMarkers.has(gameId)) return;

		const itemLoc = { ...loc };
		itemLoc.z -= 100;

		mod.send("S_SPAWN_DROPITEM", "*", {
			"gameId": gameId * 10n,
			"loc": itemLoc,
			"item": 45411,
			"amount": 1,
			"expiry": 0,
			"owners": []
		});

		spawnedMarkers.add(gameId);
	}

	function despawnMarker(gameId) {
		if (!spawnedMarkers.has(gameId)) return;

		mod.send("S_DESPAWN_DROPITEM", "*", {
			"gameId": gameId * 10n
		});

		spawnedMarkers.delete(gameId);
	}

	function showGui() {
		if (!gui) return;

		gui.show();

		if (gui.ui.window) {
			gui.ui.window.webContents.on("did-finish-load", () => {
				gui.ui.window.webContents.executeJavaScript(
					"!function(){var e=document.getElementById('close-btn');e.style.cursor='default',e.onclick=function(){window.parent.close()}}();"
				);
			});
		}
	}

	function getSettingsStructure() {
		const settingsStructure = [{
			"key": "enabled",
			"name": "Module Enabled",
			"type": "bool"
		},
		{
			"key": "alert",
			"name": "Alert Messages",
			"type": "bool"
		}];

		Object.values(gatheringItems).forEach(itemId => {
			if (!gatheringItemNames.has(parseInt(itemId))) return;

			settingsStructure.push({
				"key": Object.keys(gatheringItems).find(k => gatheringItems[k].includes(itemId)),
				"name": gatheringItemNames.get(parseInt(itemId)),
				"type": "bool"
			});
		});

		return settingsStructure;
	}

	this.destructor = () => {
		if (gui) {
			gui.close();
			gui = null;
		}

		spawnedItems.clear();
		spawnedMarkers.clear();
		mod.command.remove("gat");
	};
};

class TeraMessage {
	constructor(mod) {
		this.mod = mod;
	}

	clr(text, hexColor) {
		return `<font color="#${hexColor}">${text}</font>`;
	}

	RED(text) {
		return `<font color="#FF0000">${text}</font>`;
	}

	BLU(text) {
		return `<font color="#56B4E9">${text}</font>`;
	}

	YEL(text) {
		return `<font color="#E69F00">${text}</font>`;
	}

	TIP(text) {
		return `<font color="#00FFFF">${text}</font>`;
	}

	GRY(text) {
		return `<font color="#A0A0A0">${text}</font>`;
	}

	PIK(text) {
		return `<font color="#FF00DC">${text}</font>`;
	}

	chat(msg) {
		this.mod.command.message(msg);
	}

	party(msg) {
		this.mod.send("S_CHAT", "*", {
			"channel": 21,
			"message": msg
		});
	}

	raids(msg) {
		this.mod.send("S_CHAT", "*", {
			"channel": 25,
			"message": msg
		});
	}
}
