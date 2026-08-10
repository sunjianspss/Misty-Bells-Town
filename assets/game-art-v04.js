(function () {
  const specs = {
    player: {
      src: "assets/images/game/v0.4/characters/chr_player_walk_4dir_4f_v02.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { up: 0, right: 1, left: 2, down: 3 },
    },
    azhi: {
      src: "assets/images/game/v0.4/characters/chr_azhi_walk_4dir_4f_v02.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
    },
    azhiTalk: {
      src: "assets/images/game/v0.4/characters/chr_azhi_talk_4dir_2f_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
    },
    azhiRibbons: {
      src: "assets/images/game/v0.4/characters/chr_azhi_ribbons_4dir_2f_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
    },
    villagers: {
      src: "assets/images/game/v0.4/characters/chr_villagers_idle_4dir_v02.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
      columns: { linmai: 0, shenyan: 1, xuhuai: 2, qin: 3 },
    },
    villagersIdle: {
      src: "assets/images/game/v0.4/characters/chr_villagers_idle_4dir_2f_v03.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
      columns: { linmai: 0, shenyan: 2, xuhuai: 4, qin: 6 },
    },
    villagersTalk: {
      src: "assets/images/game/v0.4/characters/chr_villagers_talk_4dir_2f_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
      columns: { linmai: 0, shenyan: 2, xuhuai: 4, qin: 6 },
    },
    villagersWork: {
      src: "assets/images/game/v0.4/characters/chr_villagers_work_4dir_2f_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
      columns: { linmai: 0, shenyan: 2, xuhuai: 4, qin: 6 },
    },
    festivalCrowd: {
      src: "assets/images/game/v0.4/characters/chr_festival_crowd_idle_5x1_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      columns: { crowd1: 0, crowd2: 1, crowd3: 2, crowd4: 3, crowd5: 4 },
    },
    festivalCrowdIdle: {
      src: "assets/images/game/v0.4/characters/chr_festival_crowd_idle_10x1_2f_v02.png",
      cellWidth: 40,
      cellHeight: 48,
      columns: { crowd1: 0, crowd2: 2, crowd3: 4, crowd4: 6, crowd5: 8 },
    },
    terrainBase: {
      src: "assets/images/game/v0.4/tiles/tile_terrain_base_4x4_v01.png",
      cellWidth: 32,
      cellHeight: 32,
      rows: { grass: 0, path: 1, plaza: 2, water: 3 },
    },
    grassBase: {
      src: "assets/images/game/v0.4/tiles/tile_grass_base_4x2_v01.png",
      cellWidth: 32,
      cellHeight: 32,
    },
    grassDetails: {
      src: "assets/images/game/v0.4/tiles/tile_grass_details_4x4_v02.png",
      cellWidth: 32,
      cellHeight: 32,
    },
    grassPatches: {
      src: "assets/images/game/v0.4/tiles/tile_grass_patches_4x2_v01.png",
      cellWidth: 64,
      cellHeight: 64,
    },
    riverbank: {
      src: "assets/images/game/v0.4/tiles/tile_riverbank_overlay_4x2_v01.png",
      cellWidth: 32,
      cellHeight: 32,
    },
    flora: {
      src: "assets/images/game/v0.4/tiles/tile_flora_static_4x2_v01.png",
      cellWidth: 32,
      cellHeight: 32,
      rows: { flowers: 0, reeds: 1 },
    },
    treeLayers: {
      src: "assets/images/game/v0.4/props/prop_tree_layers_1x2_v01.png",
      cellWidth: 96,
      cellHeight: 96,
      rows: { base: 0, foreground: 1 },
    },
    landmarkLayers: {
      src: "assets/images/game/v0.4/props/prop_landmarks_layers_2x2_v01.png",
      cellWidth: 192,
      cellHeight: 160,
      rows: { bakery: 0, bridge: 1 },
      columns: { base: 0, foreground: 1 },
    },
    herbShed: {
      src: "assets/images/game/v0.4/props/prop_herb_shed_layers_2x2_v01.png",
      cellWidth: 96,
      cellHeight: 80,
      rows: { base: 0, foreground: 1 },
      columns: { closedCrate: 0, openCrate: 1 },
    },
    storyProps: {
      src: "assets/images/game/v0.4/props/prop_story_props_4x3_v01.png",
      cellWidth: 64,
      cellHeight: 64,
      rows: { notice: 0, table: 1, festival: 2 },
    },
    bridgeFx: {
      src: "assets/images/game/v0.4/props/prop_bridge_fx_4x4_v01.png",
      cellWidth: 32,
      cellHeight: 32,
      rows: {
        windChime: 0,
        ribbons: 1,
        lantern: 2,
        reflection: 3,
      },
    },
    weatherFx: {
      src: "assets/images/game/v0.4/effects/fx_weather_4x2_4f_v01.png",
      cellWidth: 32,
      cellHeight: 32,
      rows: { rainPuddle: 0, petals: 1 },
    },
    festivalAccents: {
      src: "assets/images/game/v0.4/props/prop_festival_accents_4x2_v01.png",
      cellWidth: 64,
      cellHeight: 64,
      rows: { plaza: 0, scaffold: 1 },
    },
    bridgeDuskBackground: {
      src: "assets/images/game/v0.4/backgrounds/scene_bridge_dusk_bg_576x448_v01.png",
    },
    bridgeDuskForeground: {
      src: "assets/images/game/v0.4/foregrounds/scene_bridge_dusk_fg_576x448_v01.png",
    },
  };

  const images = {};
  const status = {};

  const ready = Promise.allSettled(
    Object.entries(specs).map(
      ([key, spec]) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          status[key] = "loading";
          image.decoding = "async";
          image.addEventListener(
            "load",
            () => {
              images[key] = image;
              status[key] = "ready";
              resolve(key);
            },
            { once: true },
          );
          image.addEventListener(
            "error",
            () => {
              status[key] = "error";
              reject(new Error(`Unable to load v0.4 art asset: ${spec.src}`));
            },
            { once: true },
          );
          image.src = spec.src;
        }),
    ),
  );

  function get(key) {
    const image = images[key];
    return image && image.complete && image.naturalWidth > 0 ? image : null;
  }

  window.MistyBellsArtV04 = {
    get,
    images,
    ready,
    specs,
    status,
  };
})();
