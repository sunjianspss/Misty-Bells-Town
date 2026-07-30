(function () {
  const specs = {
    player: {
      src: "assets/images/game/v0.4/characters/chr_player_walk_4dir_4f_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { up: 0, right: 1, left: 2, down: 3 },
    },
    azhi: {
      src: "assets/images/game/v0.4/characters/chr_azhi_walk_4dir_4f_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
    },
    villagers: {
      src: "assets/images/game/v0.4/characters/chr_villagers_idle_4dir_v01.png",
      cellWidth: 40,
      cellHeight: 48,
      rows: { down: 0, left: 1, right: 2, up: 3 },
      columns: { linmai: 0, shenyan: 1, xuhuai: 2, qin: 3 },
    },
    terrainBase: {
      src: "assets/images/game/v0.4/tiles/tile_terrain_base_4x4_v01.png",
      cellWidth: 32,
      cellHeight: 32,
      rows: { grass: 0, path: 1, plaza: 2, water: 3 },
    },
    riverbank: {
      src: "assets/images/game/v0.4/tiles/tile_riverbank_overlay_4x2_v01.png",
      cellWidth: 32,
      cellHeight: 32,
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
