(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const refs = {
    hudDay: document.getElementById("hud-day"),
    hudWeather: document.getElementById("hud-weather"),
    hudTime: document.getElementById("hud-time"),
    hudProgress: document.getElementById("hud-progress"),
    objective: document.getElementById("objective"),
    guideObjective: document.getElementById("guide-objective"),
    guideNextStep: document.getElementById("guide-next-step"),
    inventory: document.getElementById("inventory"),
    sharedTracesKicker: document.getElementById("shared-traces-kicker"),
    sharedTracesStatus: document.getElementById("shared-traces-status"),
    sharedTracesCount: document.getElementById("shared-traces-count"),
    sharedTracesList: document.getElementById("shared-traces-list"),
    sharedModePill: document.getElementById("shared-mode-pill"),
    sharedTracesRefresh: document.getElementById("shared-traces-refresh"),
    sharedTracesCompose: document.getElementById("shared-traces-compose"),
    sharedTraceModal: document.getElementById("shared-trace-modal"),
    sharedTraceModalMeta: document.getElementById("shared-trace-modal-meta"),
    sharedTraceInput: document.getElementById("shared-trace-input"),
    sharedTraceFeedback: document.getElementById("shared-trace-feedback"),
    sharedTraceSubmit: document.getElementById("shared-trace-submit"),
    sharedTraceCancel: document.getElementById("shared-trace-cancel"),
    dayStrip: document.getElementById("day-strip"),
    progressCaption: document.getElementById("progress-caption"),
    demoStatus: document.getElementById("demo-status"),
    jumpGrid: document.getElementById("jump-grid"),
    audioBell: document.getElementById("audio-bell"),
    audioRain: document.getElementById("audio-rain"),
    audioFestival: document.getElementById("audio-festival"),
    audioStop: document.getElementById("audio-stop"),
    audioStatus: document.getElementById("audio-status"),
    gameAudioToggle: document.getElementById("game-audio-toggle"),
    gameAudioMute: document.getElementById("game-audio-mute"),
    gameAudioNote: document.getElementById("game-audio-note"),
    hint: document.getElementById("hint"),
    toast: document.getElementById("toast"),
    dialogue: document.getElementById("dialogue"),
    dialogueSpeaker: document.getElementById("dialogue-speaker"),
    dialogueText: document.getElementById("dialogue-text"),
    dialogueNext: document.getElementById("dialogue-next"),
    dayNote: document.getElementById("day-note"),
    dayNoteText: document.getElementById("day-note-text"),
    restartDay: document.getElementById("restart-day"),
    resetDemo: document.getElementById("reset-demo"),
    touchInteract: document.getElementById("touch-interact"),
    titleScreen: document.getElementById("title-screen"),
    titleStart: document.getElementById("title-start"),
    titleContinue: document.getElementById("title-continue"),
    titleSaveNote: document.getElementById("title-save-note"),
    ending: document.getElementById("ending"),
    endingSummary: document.getElementById("ending-summary"),
    endingDays: document.getElementById("ending-days"),
    endingItems: document.getElementById("ending-items"),
    endingRestart: document.getElementById("ending-restart"),
    endingContinue: document.getElementById("ending-continue"),
  };

  const TILE = 16;
  const MAP_W = 18;
  const MAP_H = 14;
  const WALK_MS = 130;
  const DAY_TOTAL = 7;
  const SAVE_KEY = "wuling-demo-save-v2";
  const SHARED_TRACE_LIMIT = 8;
  const SHARED_TRACE_POST_KEY = "wuling-demo-shared-posts-v1";
  const dayChapters = [
    { day: 1, short: "春1", title: "初到小镇", summary: "先让雾铃小镇认识你。" },
    { day: 2, short: "春2", title: "告示贴上", summary: "风铃集会第一次被正式说出口。" },
    { day: 3, short: "春3", title: "旧铃半响", summary: "桥边那半句开始重新变完整。" },
    { day: 4, short: "春4", title: "细雨找种", summary: "小镇的节奏慢下来，也更靠近人心。" },
    { day: 5, short: "春5", title: "布条上桥", summary: "安静过后，颜色先把热闹提起来。" },
    { day: 6, short: "春6", title: "节日前夜", summary: "桥灯亮起，明天终于真的近了。" },
    { day: 7, short: "春7", title: "风铃集会", summary: "这一周等来的第一声终于响给人群听。" },
  ];

  function tileKey(x, y) {
    return `${x},${y}`;
  }

  function makeSet() {
    return new Set();
  }

  function addLine(set, x1, y1, x2, y2) {
    if (x1 === x2) {
      const [start, end] = y1 <= y2 ? [y1, y2] : [y2, y1];
      for (let y = start; y <= end; y += 1) {
        set.add(tileKey(x1, y));
      }
      return;
    }

    const [start, end] = x1 <= x2 ? [x1, x2] : [x2, x1];
    for (let x = start; x <= end; x += 1) {
      set.add(tileKey(x, y1));
    }
  }

  function addRect(set, x, y, width, height) {
    for (let yy = y; yy < y + height; yy += 1) {
      for (let xx = x; xx < x + width; xx += 1) {
        set.add(tileKey(xx, yy));
      }
    }
  }

  const world = {
    path: makeSet(),
    square: makeSet(),
    water: makeSet(),
    bridge: makeSet(),
    solids: makeSet(),
    flowers: [
      { x: 6, y: 1, color: "#f0bf6d" },
      { x: 7, y: 1, color: "#d795a0" },
      { x: 8, y: 1, color: "#f4d789" },
      { x: 6, y: 2, color: "#d795a0" },
      { x: 8, y: 2, color: "#f0bf6d" },
      { x: 0, y: 8, color: "#d795a0" },
      { x: 4, y: 0, color: "#f4d789" },
      { x: 10, y: 3, color: "#d795a0" },
      { x: 15, y: 7, color: "#f0bf6d" },
      { x: 16, y: 7, color: "#d795a0" },
    ],
    reeds: [
      { x: 13, y: 8 },
      { x: 14, y: 8 },
      { x: 16, y: 8 },
    ],
    lamps: [
      { x: 11, y: 9 },
      { x: 14, y: 9 },
    ],
  };

  addLine(world.path, 2, 13, 2, 8);
  addLine(world.path, 2, 8, 11, 8);
  addLine(world.path, 11, 8, 11, 10);
  addLine(world.path, 11, 10, 14, 10);
  addLine(world.path, 4, 6, 6, 6);
  addLine(world.path, 7, 4, 7, 5);
  addRect(world.square, 6, 5, 4, 3);
  addRect(world.water, 12, 8, 6, 6);
  addLine(world.bridge, 11, 10, 14, 10);
  addRect(world.solids, 1, 2, 4, 3);
  world.solids.add(tileKey(1, 12));
  world.solids.add(tileKey(8, 4));
  world.solids.add(tileKey(9, 7));
  world.solids.add(tileKey(0, 9));
  world.solids.add(tileKey(0, 10));
  world.solids.add(tileKey(1, 9));
  world.solids.add(tileKey(1, 10));

  const npcBase = {
    azhi: { id: "azhi", name: "阿栀", palette: "azhi" },
    linmai: { id: "linmai", name: "林麦", palette: "linmai" },
    shenyan: { id: "shenyan", name: "沈砚", palette: "shenyan" },
    xuhuai: { id: "xuhuai", name: "许槐", palette: "xuhuai" },
    qin: { id: "qin", name: "秦婆婆", palette: "qin" },
  };

  const dayLayouts = {
    1: {
      azhi: { x: 3, y: 11, facing: "down" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 14, y: 9, facing: "left" },
      xuhuai: { x: 10, y: 6, facing: "left" },
      qin: { x: 7, y: 2, facing: "down" },
    },
    2: {
      azhi: { x: 6, y: 8, facing: "right" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 14, y: 9, facing: "left" },
      xuhuai: { x: 10, y: 5, facing: "left" },
      qin: { x: 7, y: 2, facing: "down" },
    },
    3: {
      azhi: { x: 9, y: 8, facing: "left" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 14, y: 9, facing: "left" },
      xuhuai: { x: 11, y: 9, facing: "right" },
      qin: { x: 7, y: 2, facing: "down" },
    },
    4: {
      azhi: { x: 8, y: 8, facing: "left" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 14, y: 9, facing: "left" },
      xuhuai: { x: 10, y: 5, facing: "left" },
      qin: { x: 8, y: 2, facing: "down" },
    },
    5: {
      azhi: { x: 10, y: 8, facing: "left" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 14, y: 9, facing: "left" },
      xuhuai: { x: 11, y: 9, facing: "left" },
      qin: { x: 8, y: 2, facing: "down" },
    },
    6: {
      azhi: { x: 9, y: 8, facing: "right" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 13, y: 9, facing: "left" },
      xuhuai: { x: 11, y: 8, facing: "down" },
      qin: { x: 8, y: 2, facing: "down" },
    },
    7: {
      azhi: { x: 8, y: 7, facing: "right" },
      linmai: { x: 5, y: 6, facing: "down" },
      shenyan: { x: 13, y: 9, facing: "left" },
      xuhuai: { x: 11, y: 8, facing: "left" },
      qin: { x: 8, y: 2, facing: "down" },
    },
  };

  let npcs = {};

  function makeDefaultState() {
    return {
      currentDayIndex: 1,
      unlockedDay: 1,
      demoFinished: false,
      day: "周一 / 春 1",
      weather: "薄雾",
      timeSlot: "清晨",
      objective: "先和村口的阿栀打个招呼。",
      objectiveTarget: "azhi",
      inventory: [],
      metAzhi: false,
      questBreadAccepted: false,
      breadDelivered: false,
      breadReturned: false,
      bridgeSceneDone: false,
      noticeReadDay2: false,
      questBreadDay2Accepted: false,
      breadDay2Delivered: false,
      breadDay2Returned: false,
      bridgeDay2Done: false,
      bellIssueSeenDay3: false,
      bellListenLeftDone: false,
      bellListenCenterDone: false,
      bellListenRightDone: false,
      bellTestReportedDay3: false,
      bridgeDay3Done: false,
      seedQuestAcceptedDay4: false,
      seedFoundDay4: false,
      seedReturnedDay4: false,
      bridgeDay4Done: false,
      ribbonQuestAcceptedDay5: false,
      ribbonBlueDoneDay5: false,
      ribbonWhiteDoneDay5: false,
      ribbonGoldDoneDay5: false,
      ribbonTaskReturnedDay5: false,
      bridgeDay5Done: false,
      lanternQuestAcceptedDay6: false,
      lanternLeftDoneDay6: false,
      lanternCenterDoneDay6: false,
      lanternRightDoneDay6: false,
      lanternTaskReturnedDay6: false,
      bridgeDay6Done: false,
      festivalQuestAcceptedDay7: false,
      festivalLineLinmaiDay7: false,
      festivalLineXuhuaiDay7: false,
      festivalLineQinDay7: false,
      festivalTagsReadyDay7: false,
      festivalWishLeftDoneDay7: false,
      festivalWishCenterDoneDay7: false,
      festivalWishRightDoneDay7: false,
      bridgeDay7Done: false,
      dialogueOpen: false,
      noteOpen: false,
      dialogueLines: [],
      dialogueIndex: 0,
      dialogueDone: null,
      dayNoteText: "",
      dayNoteAction: "restart",
      dayNoteButtonLabel: "继续",
      lastHint: "",
      toastTimer: null,
      dayComplete: false,
    };
  }

  let state = makeDefaultState();

  const player = {
    x: 2,
    y: 12,
    drawX: 2,
    drawY: 12,
    moving: false,
    moveStart: 0,
    fromX: 2,
    fromY: 12,
    toX: 2,
    toY: 12,
    facing: "up",
  };

  const canPersist = (() => {
    try {
      const probe = `${SAVE_KEY}:probe`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  })();

  const sharedWorldClient =
    window.MistyBellsSharedWorld && typeof window.MistyBellsSharedWorld.createClient === "function"
      ? window.MistyBellsSharedWorld.createClient()
      : null;

  const sharedWorldState = {
    traces: [],
    loading: false,
    mode: sharedWorldClient && sharedWorldClient.remoteEnabled ? "supabase" : "local",
    warning: "",
    modalOpen: false,
    submitting: false,
  };

  const audioState = {
    currentKey: null,
    players: {},
    resetTimer: null,
  };

  const audioLibrary = {
    bell: {
      src: "assets/audio/wind-chime-preview.wav",
      loading: "正在试听：桥边风铃发布素材。",
      ended: "试听结束：风铃素材偏轻、亮、留尾音。",
      error: "风铃素材加载失败了，请确认 `assets/audio/wind-chime-preview.wav` 存在。",
      volume: 0.78,
    },
    rain: {
      src: "assets/audio/drizzle-preview.wav",
      loading: "正在试听：细雨与河面发布素材。",
      ended: "试听结束：细雨素材偏薄、近、水气更重。",
      error: "细雨素材加载失败了，请确认 `assets/audio/drizzle-preview.wav` 存在。",
      volume: 0.68,
    },
    festival: {
      src: "assets/audio/festival-dusk-preview.wav",
      loading: "正在试听：集会黄昏发布素材。",
      ended: "试听结束：黄昏素材先有底色，再把铃声放进来。",
      error: "集会黄昏素材加载失败了，请确认 `assets/audio/festival-dusk-preview.wav` 存在。",
      volume: 0.74,
    },
  };

  const gameAudioState = {
    unlocked: false,
    enabled: false,
    muted: false,
    musicCueKey: null,
    musicTrackKey: null,
    ambientKey: null,
    loopPlayers: {},
    sfxPrototypes: {},
    transitionFrame: null,
    lastTransitionNow: 0,
    musicCueCursors: {},
  };

  const gameAudioLibrary = {
    musicPrimary: {
      src: "assets/audio/hjm-hjx.mp3",
      volume: 0.08,
      loop: true,
      role: "music",
    },
    ambientRiverside: {
      src: "assets/audio/ambient-riverside-loop.wav",
      volume: 0.16,
      loop: true,
      role: "ambient",
    },
    ambientRain: {
      src: "assets/audio/ambient-rain-loop.wav",
      volume: 0.18,
      loop: true,
      role: "ambient",
    },
    step: {
      src: "assets/audio/sfx-step.wav",
      volume: 0.34,
    },
    dialogue: {
      src: "assets/audio/sfx-dialogue.wav",
      volume: 0.24,
    },
    quest: {
      src: "assets/audio/sfx-quest.wav",
      volume: 0.46,
    },
    bridgeBell: {
      src: "assets/audio/sfx-bridge-bell.wav",
      volume: 0.52,
    },
  };

  const musicCueLibrary = {
    villageMorning: ["musicPrimary"],
    villageDay: ["musicPrimary"],
    villageEvening: ["musicPrimary"],
    villageNightSoft: ["musicPrimary"],
    rainSoft: ["musicPrimary"],
    festivalPrep: ["musicPrimary"],
    festivalMain: ["musicPrimary"],
  };

  function setAudioStatus(text) {
    if (refs.audioStatus) {
      refs.audioStatus.textContent = text;
    }
  }

  function setGameAudioNote(text) {
    if (refs.gameAudioNote) {
      refs.gameAudioNote.textContent = text;
    }
  }

  function syncGameAudioButtons() {
    if (refs.gameAudioToggle) {
      refs.gameAudioToggle.textContent = gameAudioState.enabled ? "暂停游戏音频" : "启用游戏音频";
    }
    if (refs.gameAudioMute) {
      refs.gameAudioMute.textContent = gameAudioState.muted ? "取消静音" : "静音游戏音频";
    }
  }

  function clearAudioTimer() {
    if (audioState.resetTimer) {
      window.clearTimeout(audioState.resetTimer);
      audioState.resetTimer = null;
    }
  }

  function scheduleAudioStatus(text, delay) {
    clearAudioTimer();
    audioState.resetTimer = window.setTimeout(() => {
      setAudioStatus(text);
      audioState.resetTimer = null;
    }, delay);
  }

  function stopAudioPreview(updateStatus) {
    clearAudioTimer();

    Object.values(audioState.players).forEach((player) => {
      if (!player) {
        return;
      }

      player.pause();
      player.currentTime = 0;
    });

    audioState.currentKey = null;
    if (updateStatus !== false) {
      setAudioStatus("已停止试听。你可以继续点别的发布素材。");
    }
  }

  function ensureAudioPlayer(key) {
    if (audioState.players[key]) {
      return audioState.players[key];
    }

    const config = audioLibrary[key];
    if (!config) {
      return null;
    }

    const player = new Audio(config.src);
    player.preload = "auto";
    player.volume = config.volume;
    player.addEventListener("ended", () => {
      if (audioState.currentKey === key) {
        audioState.currentKey = null;
        setAudioStatus(config.ended);
      }
    });
    player.addEventListener("error", () => {
      if (audioState.currentKey === key) {
        audioState.currentKey = null;
      }
      setAudioStatus(config.error);
    });
    audioState.players[key] = player;
    return player;
  }

  function playAudioPreview(key) {
    const config = audioLibrary[key];
    const player = ensureAudioPlayer(key);
    if (!config || !player) {
      return;
    }

    stopAudioPreview(false);
    setAudioStatus(config.loading);
    audioState.currentKey = key;
    player.currentTime = 0;

    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (audioState.currentKey === key) {
          audioState.currentKey = null;
        }
        setAudioStatus(`浏览器拦截了自动播放，请再点一次“${key === "bell" ? "试听风铃" : key === "rain" ? "试听细雨" : "试听集会黄昏"}”。`);
      });
    }
  }

  function playBellPreview() {
    playAudioPreview("bell");
  }

  function playRainPreview() {
    playAudioPreview("rain");
  }

  function playFestivalPreview() {
    playAudioPreview("festival");
  }

  function pauseAllGameLoops() {
    Object.values(gameAudioState.loopPlayers).forEach((loopState) => {
      if (!loopState) {
        return;
      }
      loopState.targetVolume = 0;
      loopState.resetOnSilence = false;
    });
    scheduleGameAudioTransition();
  }

  function ensureGameLoopPlayer(key) {
    if (gameAudioState.loopPlayers[key]) {
      return gameAudioState.loopPlayers[key];
    }

    const config = gameAudioLibrary[key];
    if (!config) {
      return null;
    }

    const player = new Audio(config.src);
    player.preload = "auto";
    player.loop = Boolean(config.loop);
    player.volume = 0;

    if (config.role === "music") {
      player.addEventListener("ended", () => {
        if (gameAudioState.musicTrackKey !== key) {
          return;
        }

        if (!gameAudioState.unlocked || !gameAudioState.enabled || gameAudioState.muted) {
          return;
        }

        const nextCueKey = desiredMusicCueKey();
        if (nextCueKey !== gameAudioState.musicCueKey) {
          syncGameSceneAudio();
          return;
        }

        advanceMusicCue(nextCueKey);
      });
    }

    const loopState = {
      key,
      player,
      currentVolume: 0,
      targetVolume: 0,
      resetOnSilence: true,
    };

    gameAudioState.loopPlayers[key] = loopState;
    return loopState;
  }

  function ensureGameSfxPrototype(key) {
    if (gameAudioState.sfxPrototypes[key]) {
      return gameAudioState.sfxPrototypes[key];
    }

    const config = gameAudioLibrary[key];
    if (!config) {
      return null;
    }

    const player = new Audio(config.src);
    player.preload = "auto";
    gameAudioState.sfxPrototypes[key] = player;
    return player;
  }

  function playGameSfx(key) {
    if (!gameAudioState.unlocked || !gameAudioState.enabled || gameAudioState.muted) {
      return;
    }

    const config = gameAudioLibrary[key];
    const prototype = ensureGameSfxPrototype(key);
    if (!config || !prototype) {
      return;
    }

    const player = prototype.cloneNode();
    player.volume = config.volume;
    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  function desiredMusicCueKey() {
    if (state.currentDayIndex === 7) {
      if (state.timeSlot === "夜晚") {
        return "villageNightSoft";
      }
      if (state.timeSlot === "清晨") {
        return "villageMorning";
      }
      return "festivalMain";
    }

    if (state.currentDayIndex === 6 && (state.timeSlot === "傍晚" || state.timeSlot === "夜晚")) {
      return "festivalPrep";
    }

    if (state.weather === "细雨" || state.currentDayIndex === 4) {
      return "rainSoft";
    }

    if (state.timeSlot === "清晨") {
      return "villageMorning";
    }

    if (state.timeSlot === "傍晚") {
      return "villageEvening";
    }

    if (state.timeSlot === "夜晚") {
      return "villageNightSoft";
    }

    return "villageDay";
  }

  function desiredAmbientKey() {
    if (state.weather === "细雨" || state.currentDayIndex === 4) {
      return "ambientRain";
    }

    return "ambientRiverside";
  }

  function resolveLoopTargetVolume(key) {
    const config = gameAudioLibrary[key];
    if (!config) {
      return 0;
    }

    if (state.dialogueOpen || state.noteOpen) {
      if (config.role === "music") {
        return config.volume * 0.84;
      }
      if (config.role === "ambient") {
        return config.volume * 0.92;
      }
    }

    return config.volume;
  }

  function scheduleGameAudioTransition() {
    if (gameAudioState.transitionFrame) {
      return;
    }

    gameAudioState.lastTransitionNow = 0;
    gameAudioState.transitionFrame = window.requestAnimationFrame(runGameAudioTransition);
  }

  function runGameAudioTransition(now) {
    if (!gameAudioState.lastTransitionNow) {
      gameAudioState.lastTransitionNow = now;
    }

    const deltaSeconds = Math.min(0.05, (now - gameAudioState.lastTransitionNow) / 1000 || 0.016);
    gameAudioState.lastTransitionNow = now;
    const fadeDuration = 0.42;
    const step = deltaSeconds / fadeDuration;
    let needsAnotherFrame = false;

    Object.values(gameAudioState.loopPlayers).forEach((loopState) => {
      if (!loopState) {
        return;
      }

      const { player } = loopState;
      const diff = loopState.targetVolume - loopState.currentVolume;

      if (Math.abs(diff) <= step) {
        loopState.currentVolume = loopState.targetVolume;
      } else {
        loopState.currentVolume += Math.sign(diff) * step;
        needsAnotherFrame = true;
      }

      player.volume = Math.max(0, Math.min(1, loopState.currentVolume));

      if (loopState.targetVolume === 0 && loopState.currentVolume <= 0.001 && !player.paused) {
        player.pause();
        if (loopState.resetOnSilence) {
          player.currentTime = 0;
        }
      }
    });

    if (needsAnotherFrame) {
      gameAudioState.transitionFrame = window.requestAnimationFrame(runGameAudioTransition);
      return;
    }

    gameAudioState.transitionFrame = null;
    gameAudioState.lastTransitionNow = 0;
  }

  function playLoopKey(key, options) {
    const config = gameAudioLibrary[key];
    const loopState = ensureGameLoopPlayer(key);
    if (!config || !loopState) {
      return;
    }

    const player = loopState.player;
    const startFromBeginning = Boolean(options && options.startFromBeginning);
    const preservePositionOnFadeOut = Boolean(options && options.preservePositionOnFadeOut);

    loopState.targetVolume = resolveLoopTargetVolume(key);
    loopState.resetOnSilence = !preservePositionOnFadeOut;

    if (player.paused) {
      const nearTrackEnd = player.duration && player.currentTime >= Math.max(0, player.duration - 0.05);
      if (startFromBeginning || nearTrackEnd) {
        player.currentTime = 0;
      }
      const playPromise = player.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    scheduleGameAudioTransition();
  }

  function fadeOutLoopKey(key, resetOnSilence) {
    const loopState = gameAudioState.loopPlayers[key];
    if (!loopState) {
      return;
    }

    loopState.targetVolume = 0;
    loopState.resetOnSilence = resetOnSilence;
  }

  function chooseMusicTrackKey(cueKey) {
    const cueTracks = musicCueLibrary[cueKey];
    if (!cueTracks || !cueTracks.length) {
      return null;
    }

    if (cueTracks.length === 1) {
      gameAudioState.musicCueCursors[cueKey] = 0;
      return cueTracks[0];
    }

    const lastIndex =
      typeof gameAudioState.musicCueCursors[cueKey] === "number" ? gameAudioState.musicCueCursors[cueKey] : -1;
    const nextIndex = (lastIndex + 1) % cueTracks.length;
    gameAudioState.musicCueCursors[cueKey] = nextIndex;
    return cueTracks[nextIndex];
  }

  function syncDesiredMusic(cueKey) {
    const cueTracks = musicCueLibrary[cueKey] || [];
    let nextTrackKey = null;

    if (gameAudioState.musicTrackKey && cueTracks.includes(gameAudioState.musicTrackKey)) {
      nextTrackKey = gameAudioState.musicTrackKey;
    } else {
      nextTrackKey = chooseMusicTrackKey(cueKey);
    }

    Object.entries(gameAudioLibrary).forEach(([key, config]) => {
      if (config.role !== "music" || key === nextTrackKey) {
        return;
      }
      fadeOutLoopKey(key, true);
    });

    if (!nextTrackKey) {
      gameAudioState.musicCueKey = cueKey;
      gameAudioState.musicTrackKey = null;
      return;
    }

    const isNewTrack = nextTrackKey !== gameAudioState.musicTrackKey;
    playLoopKey(nextTrackKey, {
      startFromBeginning: isNewTrack,
      preservePositionOnFadeOut: !isNewTrack,
    });

    gameAudioState.musicCueKey = cueKey;
    gameAudioState.musicTrackKey = nextTrackKey;
  }

  function advanceMusicCue(cueKey) {
    const nextTrackKey = chooseMusicTrackKey(cueKey);
    if (!nextTrackKey) {
      return;
    }

    Object.entries(gameAudioLibrary).forEach(([key, config]) => {
      if (config.role !== "music" || key === nextTrackKey) {
        return;
      }
      fadeOutLoopKey(key, true);
    });

    playLoopKey(nextTrackKey, {
      startFromBeginning: true,
      preservePositionOnFadeOut: false,
    });

    gameAudioState.musicCueKey = cueKey;
    gameAudioState.musicTrackKey = nextTrackKey;
  }

  function syncDesiredAmbient(nextAmbientKey) {
    Object.entries(gameAudioLibrary).forEach(([key, config]) => {
      if (config.role !== "ambient") {
        return;
      }

      if (key !== nextAmbientKey) {
        fadeOutLoopKey(key, true);
        return;
      }

      const startFromBeginning = gameAudioState.ambientKey !== nextAmbientKey;
      playLoopKey(key, {
        startFromBeginning,
        preservePositionOnFadeOut: false,
      });
    });

    gameAudioState.ambientKey = nextAmbientKey;
  }

  function syncGameSceneAudio() {
    if (!gameAudioState.unlocked || !gameAudioState.enabled || gameAudioState.muted) {
      pauseAllGameLoops();
      return;
    }

    const nextMusicCueKey = desiredMusicCueKey();
    const nextAmbientKey = desiredAmbientKey();

    syncDesiredMusic(nextMusicCueKey);
    syncDesiredAmbient(nextAmbientKey);

    scheduleGameAudioTransition();
  }

  function unlockGameAudio(sourceLabel) {
    if (!gameAudioState.unlocked) {
      gameAudioState.unlocked = true;
      gameAudioState.enabled = true;
      setGameAudioNote(`游戏音频已启用。触发来源：${sourceLabel}。`);
      syncGameAudioButtons();
      syncGameSceneAudio();
      return;
    }

    if (!gameAudioState.enabled) {
      gameAudioState.enabled = true;
      setGameAudioNote("游戏音频已恢复。");
      syncGameAudioButtons();
      syncGameSceneAudio();
    }
  }

  function toggleGameAudioEnabled() {
    if (!gameAudioState.unlocked) {
      unlockGameAudio("手动开启");
      return;
    }

    gameAudioState.enabled = !gameAudioState.enabled;
    if (gameAudioState.enabled) {
      setGameAudioNote("游戏音频已恢复。");
      syncGameSceneAudio();
    } else {
      setGameAudioNote("游戏音频已暂停。");
      pauseAllGameLoops();
    }
    syncGameAudioButtons();
  }

  function toggleGameAudioMute() {
    if (!gameAudioState.unlocked) {
      unlockGameAudio("手动开启");
    }

    gameAudioState.muted = !gameAudioState.muted;
    if (gameAudioState.muted) {
      setGameAudioNote("游戏音频已静音。");
      pauseAllGameLoops();
    } else {
      setGameAudioNote("游戏音频已取消静音。");
      syncGameSceneAudio();
    }
    syncGameAudioButtons();
  }

  function captureBridgeMilestones() {
    return {
      bridgeSceneDone: state.bridgeSceneDone,
      bridgeDay2Done: state.bridgeDay2Done,
      bridgeDay3Done: state.bridgeDay3Done,
      bridgeDay4Done: state.bridgeDay4Done,
      bridgeDay5Done: state.bridgeDay5Done,
      bridgeDay6Done: state.bridgeDay6Done,
      bridgeDay7Done: state.bridgeDay7Done,
    };
  }

  function bridgeMilestoneJustUnlocked(beforeMilestones) {
    return Object.keys(beforeMilestones).some(
      (key) => beforeMilestones[key] === false && state[key] === true,
    );
  }

  function chapterMeta(dayIndex) {
    return dayChapters.find((chapter) => chapter.day === dayIndex) || dayChapters[0];
  }

  function sanitizeDayIndex(dayIndex) {
    return Math.max(1, Math.min(DAY_TOTAL, Number(dayIndex) || 1));
  }

  function isModalOpen() {
    return (
      !refs.titleScreen.classList.contains("hidden") ||
      !refs.ending.classList.contains("hidden") ||
      !refs.sharedTraceModal.classList.contains("hidden")
    );
  }

  function sharedTracesUnlocked() {
    return state.currentDayIndex >= 5;
  }

  function playerNearBridge() {
    const bridgeTiles = [
      { x: 11, y: 10 },
      { x: 12, y: 10 },
      { x: 13, y: 10 },
      { x: 14, y: 10 },
      { x: 12, y: 9 },
      { x: 13, y: 9 },
    ];
    return bridgeTiles.some((tile) => Math.abs(player.x - tile.x) + Math.abs(player.y - tile.y) <= 1);
  }

  function selectedSharedRibbonColor() {
    const checked = document.querySelector('input[name="shared-trace-color"]:checked');
    return checked ? checked.value : "晴蓝";
  }

  function normalizeSharedTraceText(raw) {
    return String(raw || "")
      .replace(/\s+/g, " ")
      .replace(/[<>]/g, "")
      .trim();
  }

  function readSharedPostHistory() {
    if (!canPersist) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(SHARED_TRACE_POST_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((value) => Number.isFinite(value)) : [];
    } catch (error) {
      return [];
    }
  }

  function writeSharedPostHistory(history) {
    if (!canPersist) {
      return;
    }
    window.localStorage.setItem(SHARED_TRACE_POST_KEY, JSON.stringify(history.slice(-12)));
  }

  function recentSharedTraceCount() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    return readSharedPostHistory().filter((stamp) => stamp >= oneDayAgo).length;
  }

  function relativeTraceTime(value) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) {
      return "刚刚";
    }
    const diff = Date.now() - time;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) {
      return "刚刚";
    }
    if (diff < hour) {
      return `${Math.max(1, Math.round(diff / minute))} 分钟前`;
    }
    if (diff < day) {
      return `${Math.max(1, Math.round(diff / hour))} 小时前`;
    }
    return `${Math.max(1, Math.round(diff / day))} 天前`;
  }

  function traceMetaLabel(trace) {
    return `春 ${trace.storyDay} · ${trace.weatherTag} · ${relativeTraceTime(trace.createdAt)}`;
  }

  function traceColorClass(name) {
    switch (name) {
      case "晴蓝":
        return "sky";
      case "米白":
        return "ivory";
      case "杏黄":
        return "gold";
      case "苔绿":
        return "moss";
      case "晚霞粉":
        return "rose";
      default:
        return "ivory";
    }
  }

  function defaultSharedTraceMessage() {
    if (state.currentDayIndex >= 7) {
      return "愿今天这一声，替后来的人也把桥边慢慢等热。";
    }
    if (state.currentDayIndex === 6) {
      return "愿桥灯一亮，晚风就记得把明天带过桥。";
    }
    return "愿今天这阵风，替后来的人先碰一碰桥边的颜色。";
  }

  function sharedTraceFlavorLine(npcId) {
    if (!sharedWorldState.traces.length || state.currentDayIndex < 5) {
      return null;
    }

    if (npcId === "azhi") {
      return sharedWorldState.traces.length >= 4
        ? "这几天桥边多了好多陌生人的话，像是连外乡人的风也肯在这里停一下。"
        : "前几天也有外乡人在桥边留了短短一句。我每次路过，都觉得桥在偷偷把人记住。";
    }
    if (npcId === "linmai") {
      return sharedWorldState.traces.length >= 4
        ? "连桥边那几条陌生人的布痕都开始有了人气。热闹要真到了，大概就会先长成这种样子。"
        : "桥边最近多了一两句陌生人的话。没见着人，可看见那点痕迹，面包房都像更愿意早点热起来。";
    }
    if (npcId === "shenyan") {
      return sharedWorldState.traces.length >= 4
        ? "这座桥现在不只替村里人留声了。有人来过、站过、把一句话交给风，这桥就比前几天更像在等人。"
        : "桥边多了句陌生人的话以后，我忽然更信‘等风’这件事不是白等。";
    }
    return null;
  }

  function renderSharedTraceList() {
    if (!refs.sharedTracesList) {
      return;
    }

    refs.sharedTracesList.innerHTML = "";
    if (!sharedTracesUnlocked()) {
      const li = document.createElement("li");
      li.className = "shared-trace-empty";
      li.textContent = "先把这周剧情走到春 5，桥边才会开始替人留下痕迹。";
      refs.sharedTracesList.appendChild(li);
      return;
    }

    if (!sharedWorldState.traces.length) {
      const li = document.createElement("li");
      li.className = "shared-trace-empty";
      li.textContent = "桥边还没有新的风痕。你会是今天先把一句话交给风的人吗？";
      refs.sharedTracesList.appendChild(li);
      return;
    }

    sharedWorldState.traces.slice(0, SHARED_TRACE_LIMIT).forEach((trace) => {
      const item = document.createElement("li");
      item.className = `shared-trace-item color-${traceColorClass(trace.ribbonColor)}`;

      const message = document.createElement("p");
      message.className = "shared-trace-message";
      message.textContent = trace.message;

      const meta = document.createElement("p");
      meta.className = "shared-trace-meta";
      meta.textContent = traceMetaLabel(trace);

      item.appendChild(message);
      item.appendChild(meta);
      refs.sharedTracesList.appendChild(item);
    });
  }

  function syncSharedTracesUi() {
    if (!refs.sharedTracesStatus) {
      return;
    }

    const unlocked = sharedTracesUnlocked();
    const nearBridge = playerNearBridge();

    if (!unlocked) {
      refs.sharedTracesKicker.textContent = "春 5 起，桥边会开始替人留下痕迹。";
      refs.sharedTracesStatus.textContent = "现在还是单人剧情阶段。等走到第五天，桥边会开放共享风痕。";
      refs.sharedTracesCount.textContent = "最近风痕：0 条";
      refs.sharedModePill.textContent = sharedWorldClient && sharedWorldClient.remoteEnabled ? "远端已就绪" : "本机试装";
      refs.sharedModePill.className = sharedWorldClient && sharedWorldClient.remoteEnabled ? "shared-mode-pill live" : "shared-mode-pill";
      refs.sharedTracesRefresh.disabled = true;
      refs.sharedTracesCompose.disabled = true;
      refs.sharedTracesCompose.textContent = "走到春 5 后开放";
      renderSharedTraceList();
      return;
    }

    refs.sharedTracesKicker.textContent = nearBridge
      ? "你已经走到桥边了，可以把一句短短的话交给风。"
      : "走到桥边再留痕，会更像真的把话挂给风听。";

    if (sharedWorldState.loading) {
      refs.sharedTracesStatus.textContent = "正在收一收桥边的风痕。";
    } else if (sharedWorldState.warning) {
      refs.sharedTracesStatus.textContent = sharedWorldState.warning;
    } else if (sharedWorldState.mode === "supabase") {
      refs.sharedTracesStatus.textContent = "这里显示的是最近几条公共桥边风痕，后来的玩家也会看见。";
    } else {
      refs.sharedTracesStatus.textContent = "当前先以本机模式运行。把 Supabase 配好后，这里会变成真正共享的桥边痕迹。";
    }

    refs.sharedTracesCount.textContent = `最近风痕：${sharedWorldState.traces.length} 条`;
    refs.sharedModePill.textContent =
      sharedWorldState.mode === "supabase"
        ? "公共桥边"
        : sharedWorldState.mode === "local-fallback"
          ? "远端回退"
          : "本机试装";
    refs.sharedModePill.className =
      sharedWorldState.mode === "supabase"
        ? "shared-mode-pill live"
        : sharedWorldState.mode === "local-fallback"
          ? "shared-mode-pill fallback"
          : "shared-mode-pill";
    refs.sharedTracesRefresh.disabled = sharedWorldState.loading;
    refs.sharedTracesCompose.disabled = sharedWorldState.submitting;
    refs.sharedTracesCompose.textContent = nearBridge ? "在桥边留下风痕" : "先走到桥边再留痕";
    renderSharedTraceList();
  }

  async function loadSharedTraces(force) {
    if (!sharedTracesUnlocked() || !sharedWorldClient) {
      syncSharedTracesUi();
      return;
    }

    if (sharedWorldState.loading && !force) {
      return;
    }

    sharedWorldState.loading = true;
    syncSharedTracesUi();
    const result = await sharedWorldClient.loadRecent(SHARED_TRACE_LIMIT);
    sharedWorldState.loading = false;
    sharedWorldState.mode = result.mode || sharedWorldState.mode;
    sharedWorldState.warning = result.warning || "";
    sharedWorldState.traces = Array.isArray(result.traces) ? result.traces : [];
    syncSharedTracesUi();
  }

  function openSharedTraceModal(fromBridge) {
    if (!sharedTracesUnlocked()) {
      showToast("先把剧情走到春 5，桥边才会开放共享风痕。");
      return;
    }

    if (!playerNearBridge()) {
      showToast("走到桥边再留痕，会更像真的把话挂给风听。");
      return;
    }

    sharedWorldState.modalOpen = true;
    refs.sharedTraceModal.classList.remove("hidden");
    refs.sharedTraceModalMeta.textContent = `你现在站在桥边，当前是第 ${state.currentDayIndex} 天、${state.weather}。这句话会和天气一起被后来的人看见。`;
    refs.sharedTraceInput.value = fromBridge ? "" : refs.sharedTraceInput.value;
    if (!refs.sharedTraceInput.value.trim()) {
      refs.sharedTraceInput.value = defaultSharedTraceMessage();
    }
    refs.sharedTraceFeedback.classList.remove("error");
    refs.sharedTraceFeedback.textContent = "会自动带上你当前这一天的天气与时间痕迹。";
    refs.sharedTraceInput.focus();
  }

  function closeSharedTraceModal() {
    sharedWorldState.modalOpen = false;
    refs.sharedTraceModal.classList.add("hidden");
    refs.sharedTraceFeedback.classList.remove("error");
    syncSharedTracesUi();
  }

  async function submitSharedTrace() {
    if (!sharedWorldClient || sharedWorldState.submitting) {
      return;
    }

    const message = normalizeSharedTraceText(refs.sharedTraceInput.value);
    if (message.length < 2 || message.length > 28) {
      refs.sharedTraceFeedback.classList.add("error");
      refs.sharedTraceFeedback.textContent = "把这句话控制在 2 到 28 个字之间，会更像桥边轻轻挂着的一条风痕。";
      return;
    }

    if (/(https?:\/\/|www\.|@|[0-9]{6,})/i.test(message)) {
      refs.sharedTraceFeedback.classList.add("error");
      refs.sharedTraceFeedback.textContent = "桥边不收链接、长串数字或引流信息，只收一句安静留下来的话。";
      return;
    }

    if (recentSharedTraceCount() >= 3) {
      refs.sharedTraceFeedback.classList.add("error");
      refs.sharedTraceFeedback.textContent = "今天这位外乡人已经留过几句了，先把桥边让给后来的人吧。";
      return;
    }

    sharedWorldState.submitting = true;
    refs.sharedTraceSubmit.disabled = true;
    refs.sharedTraceFeedback.classList.remove("error");
    refs.sharedTraceFeedback.textContent = "正在把这句话挂到桥边。";

    const result = await sharedWorldClient.submitTrace({
      message,
      ribbonColor: selectedSharedRibbonColor(),
      weatherTag: state.weather,
      storyDay: Math.max(5, Math.min(7, state.currentDayIndex)),
      authorLabel: "桥边来客",
    });

    sharedWorldState.submitting = false;
    refs.sharedTraceSubmit.disabled = false;

    if (result.ok) {
      writeSharedPostHistory([...readSharedPostHistory(), Date.now()]);
      refs.sharedTraceInput.value = "";
      sharedWorldState.warning = result.warning || "";
      await loadSharedTraces(true);
      closeSharedTraceModal();
      showToast(result.mode === "supabase" ? "你的风痕已经挂到桥边了" : "这条风痕先保存在本机桥边", "quest");
      persistProgress();
      return;
    }

    refs.sharedTraceFeedback.classList.add("error");
    refs.sharedTraceFeedback.textContent = "这阵风没把话稳稳挂上去，等一会儿再试一次吧。";
  }

  function createStoryStateForDay(dayIndex, unlockedDay) {
    const next = makeDefaultState();
    next.unlockedDay = Math.max(1, Math.min(DAY_TOTAL, unlockedDay || dayIndex));

    if (dayIndex >= 2) {
      next.metAzhi = true;
      next.questBreadAccepted = true;
      next.breadDelivered = true;
      next.breadReturned = true;
      next.bridgeSceneDone = true;
      next.inventory.push("春莓小卷");
    }

    if (dayIndex >= 3) {
      next.noticeReadDay2 = true;
      next.questBreadDay2Accepted = true;
      next.breadDay2Delivered = true;
      next.breadDay2Returned = true;
      next.bridgeDay2Done = true;
      next.inventory.push("蜜香小饼");
    }

    if (dayIndex >= 4) {
      next.bellIssueSeenDay3 = true;
      next.bellListenLeftDone = true;
      next.bellListenCenterDone = true;
      next.bellListenRightDone = true;
      next.bellTestReportedDay3 = true;
      next.bridgeDay3Done = true;
      next.inventory.push("风铃木片");
    }

    if (dayIndex >= 5) {
      next.seedQuestAcceptedDay4 = true;
      next.seedFoundDay4 = true;
      next.seedReturnedDay4 = true;
      next.bridgeDay4Done = true;
      next.inventory.push("铃兰香包");
    }

    if (dayIndex >= 6) {
      next.ribbonQuestAcceptedDay5 = true;
      next.ribbonBlueDoneDay5 = true;
      next.ribbonWhiteDoneDay5 = true;
      next.ribbonGoldDoneDay5 = true;
      next.ribbonTaskReturnedDay5 = true;
      next.bridgeDay5Done = true;
      next.inventory.push("春色布结");
    }

    if (dayIndex >= 7) {
      next.lanternQuestAcceptedDay6 = true;
      next.lanternLeftDoneDay6 = true;
      next.lanternCenterDoneDay6 = true;
      next.lanternRightDoneDay6 = true;
      next.lanternTaskReturnedDay6 = true;
      next.bridgeDay6Done = true;
      next.inventory.push("灯穗小签");
    }

    return next;
  }

  function cloneNpcData() {
    return Object.fromEntries(
      Object.entries(npcBase).map(([key, npc]) => [
        key,
        {
          ...npc,
          x: 0,
          y: 0,
          facing: "down",
        },
      ]),
    );
  }

  function captureNpcSnapshot() {
    return Object.fromEntries(
      Object.entries(npcs).map(([id, npc]) => [
        id,
        {
          x: npc.x,
          y: npc.y,
          facing: npc.facing,
        },
      ]),
    );
  }

  function readSavedPayload() {
    if (!canPersist) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return null;
      }

      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object" || !payload.state) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  function clearSavedProgress() {
    if (!canPersist) {
      return;
    }

    window.localStorage.removeItem(SAVE_KEY);
    refreshTitleScreen();
  }

  function persistProgress() {
    if (!canPersist || state.dialogueOpen || player.moving) {
      return;
    }

    const payload = {
      version: 2,
      savedAt: Date.now(),
      state: {
        ...state,
        dialogueOpen: false,
        dialogueLines: [],
        dialogueIndex: 0,
        dialogueDone: null,
        toastTimer: null,
        lastHint: "",
      },
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
      },
      npcs: captureNpcSnapshot(),
    };

    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    refreshTitleScreen();
  }

  function hydrateSavedUi() {
    refs.toast.classList.remove("visible");
    state.toastTimer = null;
    state.lastHint = "";
    state.dialogueOpen = false;
    state.dialogueLines = [];
    state.dialogueIndex = 0;
    state.dialogueDone = null;
    refs.dialogue.classList.add("hidden");

    if (state.noteOpen) {
      refs.dayNoteText.textContent = state.dayNoteText;
      refs.restartDay.textContent = state.dayNoteButtonLabel || "继续";
      refs.dayNote.classList.remove("hidden");
      state.dayComplete = true;
      return;
    }

    refs.dayNote.classList.add("hidden");
    state.dayComplete = false;
  }

  function loadSavedProgress() {
    const payload = readSavedPayload();
    if (!payload) {
      return false;
    }

    const savedState = {
      ...makeDefaultState(),
      ...payload.state,
    };

    savedState.currentDayIndex = sanitizeDayIndex(savedState.currentDayIndex);
    savedState.unlockedDay = Math.max(savedState.currentDayIndex, sanitizeDayIndex(savedState.unlockedDay));
    savedState.inventory = Array.isArray(savedState.inventory) ? savedState.inventory.slice() : [];

    state = savedState;
    npcs = cloneNpcData();
    applyNpcLayout(state.currentDayIndex);

    if (payload.npcs && typeof payload.npcs === "object") {
      Object.entries(payload.npcs).forEach(([id, snapshot]) => {
        if (!npcs[id] || !snapshot) {
          return;
        }
        npcs[id].x = Number(snapshot.x) || npcs[id].x;
        npcs[id].y = Number(snapshot.y) || npcs[id].y;
        npcs[id].facing = snapshot.facing || npcs[id].facing;
      });
    }

    const savedPlayer = payload.player || {};
    positionPlayer(
      Number.isFinite(savedPlayer.x) ? savedPlayer.x : 2,
      Number.isFinite(savedPlayer.y) ? savedPlayer.y : 12,
      savedPlayer.facing || "up",
    );

    hydrateSavedUi();
    syncHud();
    syncInventory();
    syncMetaUi();
    syncSharedTracesUi();
    loadSharedTraces(false);
    syncGameSceneAudio();
    return true;
  }

  function renderDayStrip() {
    refs.dayStrip.innerHTML = "";
    dayChapters.forEach((chapter) => {
      const pill = document.createElement("div");
      let className = "day-pill";
      if (chapter.day === state.currentDayIndex) {
        className += " current";
      } else if (chapter.day < state.currentDayIndex || state.demoFinished) {
        className += " done";
      } else if (chapter.day > state.unlockedDay) {
        className += " locked";
      }
      pill.className = className;

      const label = document.createElement("strong");
      label.textContent = chapter.short;
      const title = document.createElement("span");
      title.textContent = chapter.title;
      pill.appendChild(label);
      pill.appendChild(title);
      refs.dayStrip.appendChild(pill);
    });
  }

  function renderJumpGrid() {
    refs.jumpGrid.innerHTML = "";
    dayChapters.forEach((chapter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        chapter.day === state.currentDayIndex ? "chapter-btn current" : "chapter-btn";
      button.disabled = chapter.day > state.unlockedDay;

      const strong = document.createElement("strong");
      strong.textContent = `${chapter.short} · ${chapter.title}`;
      const span = document.createElement("span");
      span.textContent = chapter.day > state.unlockedDay ? "尚未解锁" : "回到当天清晨";
      button.appendChild(strong);
      button.appendChild(span);

      button.addEventListener("click", () => {
        if (button.disabled) {
          return;
        }
        jumpToDay(chapter.day);
      });

      refs.jumpGrid.appendChild(button);
    });
  }

  function syncMetaUi() {
    const chapter = chapterMeta(state.currentDayIndex);
    refs.hudProgress.textContent = `第 ${state.currentDayIndex} / ${DAY_TOTAL} 天`;
    refs.progressCaption.textContent = `第 ${state.currentDayIndex} 天：${chapter.title}。${chapter.summary}`;
    refs.demoStatus.textContent = state.demoFinished
      ? "七天试玩主线已经完成。你现在可以从任意已解锁章节重新回看。"
      : `已解锁 ${state.unlockedDay} / ${DAY_TOTAL} 天。章节按钮会回到对应天数的清晨开头。`;
    renderDayStrip();
    renderJumpGrid();
  }

  function refreshTitleScreen() {
    const payload = readSavedPayload();
    if (!payload) {
      refs.titleContinue.classList.add("hidden");
      refs.titleSaveNote.textContent = canPersist
        ? "试玩会自动存档在当前浏览器，你随时可以回来继续。"
        : "当前浏览器无法写入本地存档，不过仍然可以完整试玩七天内容。";
      return;
    }

    const savedDay = sanitizeDayIndex(payload.state.currentDayIndex);
    const savedUnlocked = Math.max(savedDay, sanitizeDayIndex(payload.state.unlockedDay));
    const savedFinished = Boolean(payload.state.demoFinished);
    refs.titleContinue.classList.remove("hidden");
    refs.titleSaveNote.textContent = `检测到上次自动存档：第 ${savedDay} 天，已解锁 ${savedUnlocked} / ${DAY_TOTAL} 天${
      savedFinished ? "，并且已经完成整周试玩。" : "。"
    }`;
  }

  function hideTitleScreen() {
    refs.titleScreen.classList.add("hidden");
  }

  function hideEnding() {
    refs.ending.classList.add("hidden");
  }

  function showEnding() {
    refs.endingSummary.textContent =
      "这一周里，面包香、旧铃声、细雨、布条、桥灯和纸签终于一起落到桥边，也让雾铃小镇真正把你接进了人群里。";
    refs.endingDays.textContent = `${state.unlockedDay} / ${DAY_TOTAL}`;
    refs.endingItems.textContent = `${state.inventory.length} 件`;
    refs.ending.classList.remove("hidden");
  }

  function applyNpcLayout(dayIndex) {
    const layout = dayLayouts[dayIndex];
    Object.entries(layout).forEach(([id, position]) => {
      npcs[id].x = position.x;
      npcs[id].y = position.y;
      npcs[id].facing = position.facing;
    });
  }

  function positionPlayer(x, y, facing) {
    player.x = x;
    player.y = y;
    player.drawX = x;
    player.drawY = y;
    player.fromX = x;
    player.fromY = y;
    player.toX = x;
    player.toY = y;
    player.facing = facing;
    player.moving = false;
  }

  function setObjective(text, targetId) {
    state.objective = text;
    state.objectiveTarget = targetId || null;
    refs.objective.textContent = text;
    if (refs.guideObjective) {
      refs.guideObjective.textContent = text;
    }
  }

  function setTimeSlot(slot) {
    const previous = state.timeSlot;
    state.timeSlot = slot;
    refs.hudTime.textContent = slot;
    if (previous !== slot) {
      syncGameSceneAudio();
    }
  }

  function syncHud() {
    refs.hudDay.textContent = state.day;
    refs.hudWeather.textContent = state.weather;
    refs.hudTime.textContent = state.timeSlot;
    refs.objective.textContent = state.objective;
    if (refs.guideObjective) {
      refs.guideObjective.textContent = state.objective;
    }
  }

  function syncInventory() {
    refs.inventory.innerHTML = "";
    if (!state.inventory.length) {
      const li = document.createElement("li");
      li.textContent = "暂时还没有。";
      refs.inventory.appendChild(li);
      return;
    }

    state.inventory.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      refs.inventory.appendChild(li);
    });
  }

  function showToast(text, soundKey) {
    const inferredSoundKey =
      soundKey ||
      (/^(新委托|已|记下了|找到|新的消息|三张风记签都挂好了|桥边已经|桥边的试灯已经|第二天：|第三天：|第四天：|第五天：|第六天：|第七天：)/.test(
        text,
      )
        ? "quest"
        : null);

    refs.toast.textContent = text;
    refs.toast.classList.add("visible");
    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }
    state.toastTimer = window.setTimeout(() => {
      refs.toast.classList.remove("visible");
      state.toastTimer = null;
    }, 2200);

    if (inferredSoundKey) {
      playGameSfx(inferredSoundKey);
    }
  }

  function addInventory(item) {
    if (!state.inventory.includes(item)) {
      state.inventory.push(item);
      syncInventory();
      showToast(`获得：${item}`, "quest");
    }
  }

  function openDialogue(lines, onDone) {
    state.dialogueOpen = true;
    state.dialogueLines = lines.slice();
    state.dialogueIndex = 0;
    state.dialogueDone = onDone || null;
    refs.dialogue.classList.remove("hidden");
    renderDialogueLine();
    playGameSfx("dialogue");
    syncGameSceneAudio();
  }

  function closeDialogue() {
    state.dialogueOpen = false;
    refs.dialogue.classList.add("hidden");
    state.dialogueLines = [];
    state.dialogueIndex = 0;
    state.dialogueDone = null;
    syncGameSceneAudio();
  }

  function renderDialogueLine() {
    const line = state.dialogueLines[state.dialogueIndex];
    if (!line) {
      return;
    }

    refs.dialogueSpeaker.textContent = line.speaker;
    refs.dialogueText.textContent = line.text;
    refs.dialogueNext.textContent =
      state.dialogueIndex === state.dialogueLines.length - 1 ? "收下这句话" : "继续";
  }

  function advanceDialogue() {
    if (!state.dialogueOpen) {
      return;
    }

    if (state.dialogueIndex < state.dialogueLines.length - 1) {
      state.dialogueIndex += 1;
      renderDialogueLine();
      playGameSfx("dialogue");
      return;
    }

    const done = state.dialogueDone;
    const bridgeMilestonesBefore = captureBridgeMilestones();
    closeDialogue();
    if (done) {
      done();
      if (bridgeMilestoneJustUnlocked(bridgeMilestonesBefore)) {
        playGameSfx("bridgeBell");
      }
      syncHud();
      syncInventory();
      syncMetaUi();
      syncSharedTracesUi();
      persistProgress();
      syncGameSceneAudio();
    }
  }

  function showDayNote(text, action, buttonLabel) {
    state.noteOpen = true;
    state.dayComplete = true;
    state.dayNoteText = text;
    state.dayNoteAction = action;
    state.dayNoteButtonLabel = buttonLabel;
    refs.dayNoteText.textContent = text;
    refs.restartDay.textContent = buttonLabel;
    refs.dayNote.classList.remove("hidden");
    syncMetaUi();
    persistProgress();
    playGameSfx("quest");
    syncGameSceneAudio();
  }

  function hideDayNote() {
    state.noteOpen = false;
    state.dayNoteText = "";
    state.dayNoteButtonLabel = "继续";
    refs.dayNote.classList.add("hidden");
    syncGameSceneAudio();
  }

  function resetCommonUiState() {
    hideDayNote();
    closeDialogue();
    closeSharedTraceModal();
    hideEnding();
    stopAudioPreview(false);
    setAudioStatus("还没有开始试听。建议戴耳机听一下第一轮发布素材的整体方向。");
    refs.toast.classList.remove("visible");
    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
      state.toastTimer = null;
    }
    state.lastHint = "";
    state.dayComplete = false;
    syncGameSceneAudio();
  }

  function finishDayStart(shouldPersist) {
    syncHud();
    syncInventory();
    syncMetaUi();
    syncSharedTracesUi();
    loadSharedTraces(false);
    syncGameSceneAudio();
    if (shouldPersist !== false) {
      persistProgress();
    }
  }

  function startDayOne(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(1, unlockedDay || 1);
    npcs = cloneNpcData();
    applyNpcLayout(1);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
  }

  function startDayTwo(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(2, unlockedDay || Math.max(state.unlockedDay || 1, 2));
    state.currentDayIndex = 2;
    state.day = "周二 / 春 2";
    state.weather = "晴和有风";
    setTimeSlot("清晨");
    setObjective("去广场看看新贴出来的告示。", "notice");
    npcs = cloneNpcData();
    applyNpcLayout(2);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
    showToast("第二天：广场公告栏上多了一张新纸");
  }

  function startDayThree(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(3, unlockedDay || Math.max(state.unlockedDay || 1, 3));
    state.currentDayIndex = 3;
    state.day = "周三 / 春 3";
    state.weather = "风更明显了";
    setTimeSlot("清晨");
    setObjective("去桥边看看，许槐今早很早就过去了。", "xuhuai");
    npcs = cloneNpcData();
    applyNpcLayout(3);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
    showToast("第三天：桥边那串旧风铃今天只响了半声");
  }

  function startDayFour(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(4, unlockedDay || Math.max(state.unlockedDay || 1, 4));
    state.currentDayIndex = 4;
    state.day = "周四 / 春 4";
    state.weather = "细雨";
    setTimeSlot("清晨");
    setObjective("去坡上花圃看看，秦婆婆像在找什么。", "qin");
    npcs = cloneNpcData();
    applyNpcLayout(4);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
    showToast("第四天：细雨把小镇的声音压低了一点");
  }

  function startDayFive(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(5, unlockedDay || Math.max(state.unlockedDay || 1, 5));
    state.currentDayIndex = 5;
    state.day = "周五 / 春 5";
    state.weather = "雨后初晴";
    setTimeSlot("清晨");
    setObjective("去桥边找阿栀，她抱着一篮布条在等人。", "azhi");
    npcs = cloneNpcData();
    applyNpcLayout(5);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
    showToast("第五天：雨停之后，大家都重新忙了起来");
  }

  function startDaySix(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(6, unlockedDay || Math.max(state.unlockedDay || 1, 6));
    state.currentDayIndex = 6;
    state.day = "周六 / 春 6";
    state.weather = "晴朗，晚风将近";
    setTimeSlot("清晨");
    setObjective("去桥边找沈砚，他在等今晚的试灯。", "shenyan");
    npcs = cloneNpcData();
    applyNpcLayout(6);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
    showToast("第六天：节日前夜，桥边今晚要先试亮灯了");
  }

  function startDaySeven(unlockedDay, shouldPersist) {
    state = createStoryStateForDay(7, unlockedDay || Math.max(state.unlockedDay || 1, 7));
    state.currentDayIndex = 7;
    state.day = "周日 / 春 7";
    state.weather = "晴暖有风";
    setTimeSlot("清晨");
    setObjective("去广场找阿栀，她在替今天的集会准备风记签。", "azhi");
    npcs = cloneNpcData();
    applyNpcLayout(7);
    positionPlayer(2, 12, "up");
    resetCommonUiState();
    finishDayStart(shouldPersist);
    showToast("第七天：风铃集会当天，桥边终于要为人群真正响起来了");
  }

  function handleDayNoteAction() {
    hideDayNote();

    if (state.dayNoteAction === "next-day") {
      startDayTwo();
      return;
    }
    if (state.dayNoteAction === "next-day-3") {
      startDayThree();
      return;
    }
    if (state.dayNoteAction === "next-day-4") {
      startDayFour();
      return;
    }
    if (state.dayNoteAction === "next-day-5") {
      startDayFive();
      return;
    }
    if (state.dayNoteAction === "next-day-6") {
      startDaySix();
      return;
    }
    if (state.dayNoteAction === "next-day-7") {
      startDaySeven();
      return;
    }
    if (state.dayNoteAction === "show-ending") {
      showEnding();
      persistProgress();
      return;
    }
    startDayOne();
  }

  function jumpToDay(dayIndex) {
    if (isModalOpen() || state.noteOpen || state.dialogueOpen || player.moving || dayIndex > state.unlockedDay) {
      return;
    }

    hideTitleScreen();
    hideEnding();
    const unlockedDay = Math.max(state.unlockedDay || 1, dayIndex);
    if (dayIndex === 1) {
      startDayOne(unlockedDay);
    } else if (dayIndex === 2) {
      startDayTwo(unlockedDay);
    } else if (dayIndex === 3) {
      startDayThree(unlockedDay);
    } else if (dayIndex === 4) {
      startDayFour(unlockedDay);
    } else if (dayIndex === 5) {
      startDayFive(unlockedDay);
    } else if (dayIndex === 6) {
      startDaySix(unlockedDay);
    } else {
      startDaySeven(unlockedDay);
    }
  }

  function resetGame() {
    clearSavedProgress();
    startDayOne(1);
  }

  function carryingBread() {
    if (state.currentDayIndex === 1) {
      return state.questBreadAccepted && !state.breadDelivered;
    }
    return state.questBreadDay2Accepted && !state.breadDay2Delivered;
  }

  function allBellPointsDone() {
    return state.bellListenLeftDone && state.bellListenCenterDone && state.bellListenRightDone;
  }

  function allRibbonPointsDone() {
    return state.ribbonBlueDoneDay5 && state.ribbonWhiteDoneDay5 && state.ribbonGoldDoneDay5;
  }

  function allLanternPointsDone() {
    return state.lanternLeftDoneDay6 && state.lanternCenterDoneDay6 && state.lanternRightDoneDay6;
  }

  function allFestivalLinesDone() {
    return state.festivalLineLinmaiDay7 && state.festivalLineXuhuaiDay7 && state.festivalLineQinDay7;
  }

  function allFestivalWishTagsDone() {
    return (
      state.festivalWishLeftDoneDay7 &&
      state.festivalWishCenterDoneDay7 &&
      state.festivalWishRightDoneDay7
    );
  }

  function updateBellObjective() {
    if (!state.bellIssueSeenDay3 || state.bellTestReportedDay3) {
      return;
    }

    if (!state.bellListenLeftDone) {
      setObjective("先去桥左侧听一听旧风铃。", "listen-left");
      return;
    }

    if (!state.bellListenCenterDone) {
      setObjective("再去桥中央听一听。", "listen-center");
      return;
    }

    if (!state.bellListenRightDone) {
      setObjective("最后去右侧栏边听一听。", "listen-right");
      return;
    }

    setObjective("回去告诉许槐，你觉得哪边的声音最顺。", "xuhuai");
  }

  function updateRibbonObjective() {
    if (!state.ribbonQuestAcceptedDay5 || state.ribbonTaskReturnedDay5) {
      return;
    }

    if (!state.ribbonBlueDoneDay5) {
      setObjective("先去桥左侧系上晴蓝布条。", "ribbon-blue");
      return;
    }

    if (!state.ribbonWhiteDoneDay5) {
      setObjective("再去桥中央系上米白布条。", "ribbon-white");
      return;
    }

    if (!state.ribbonGoldDoneDay5) {
      setObjective("最后去右侧木栏系上杏黄布条。", "ribbon-gold");
      return;
    }

    setObjective("回去告诉阿栀，桥边的布条都绑好了。", "azhi");
  }

  function updateLanternObjective() {
    if (!state.lanternQuestAcceptedDay6 || state.lanternTaskReturnedDay6) {
      return;
    }

    if (!state.lanternLeftDoneDay6) {
      setObjective("先去点亮左侧桥灯。", "lantern-left");
      return;
    }

    if (!state.lanternCenterDoneDay6) {
      setObjective("再去点亮桥心提灯。", "lantern-center");
      return;
    }

    if (!state.lanternRightDoneDay6) {
      setObjective("最后去点亮右侧桥灯。", "lantern-right");
      return;
    }

    setObjective("回去告诉沈砚，三盏灯都亮起来了。", "shenyan");
  }

  function updateFestivalObjective() {
    if (!state.festivalQuestAcceptedDay7 || state.bridgeDay7Done) {
      return;
    }

    if (!state.festivalLineLinmaiDay7) {
      setObjective("先去问林麦，今天她想让风替她记住哪一句话。", "linmai");
      return;
    }

    if (!state.festivalLineXuhuaiDay7) {
      setObjective("再去问许槐，他想把哪句话挂到桥边。", "xuhuai");
      return;
    }

    if (!state.festivalLineQinDay7) {
      setObjective("最后去问秦婆婆，替她记下一句要交给风的话。", "qin");
      return;
    }

    if (!state.festivalTagsReadyDay7) {
      setObjective("回广场找阿栀，把三句话写成风记签。", "azhi");
      return;
    }

    if (!state.festivalWishLeftDoneDay7) {
      setObjective("先把林麦的风记签挂到左侧绳上。", "wish-left");
      return;
    }

    if (!state.festivalWishCenterDoneDay7) {
      setObjective("再把许槐的风记签挂到桥心。", "wish-center");
      return;
    }

    if (!state.festivalWishRightDoneDay7) {
      setObjective("最后把秦婆婆的风记签挂到右侧水边。", "wish-right");
      return;
    }

    setObjective("傍晚去桥边，听风铃集会真正响起的第一声。", "shenyan");
  }

  function getNpcAt(x, y) {
    return Object.values(npcs).find((npc) => npc.x === x && npc.y === y) || null;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  }

  function isBlocked(x, y) {
    if (!inBounds(x, y)) {
      return true;
    }
    if (world.water.has(tileKey(x, y)) && !world.bridge.has(tileKey(x, y))) {
      return true;
    }
    if (world.solids.has(tileKey(x, y))) {
      return true;
    }
    return Boolean(getNpcAt(x, y));
  }

  function attemptMove(dx, dy) {
    if (isModalOpen() || state.dialogueOpen || state.noteOpen || player.moving || state.dayComplete) {
      return;
    }

    const direction =
      dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : dy > 0 ? "down" : player.facing;
    player.facing = direction;
    const nextX = player.x + dx;
    const nextY = player.y + dy;
    if (isBlocked(nextX, nextY)) {
      return;
    }

    player.moving = true;
    player.moveStart = performance.now();
    player.fromX = player.x;
    player.fromY = player.y;
    player.toX = nextX;
    player.toY = nextY;
    player.x = nextX;
    player.y = nextY;
    playGameSfx("step");
  }

  function nearestTarget() {
    const targets = [];
    Object.values(npcs).forEach((npc) => {
      const distance = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
      if (distance <= 1) {
        targets.push({
          id: npc.id,
          kind: "npc",
          name: npc.name,
          x: npc.x,
          y: npc.y,
          distance,
        });
      }
    });

    const props = [
      { id: "notice", label: "查看", x: 8, y: 4, name: "公告栏" },
      {
        id: "table",
        label: carryingBread() ? "放下" : "查看",
        x: 9,
        y: 7,
        name: "白布小桌",
      },
      {
        id: "gate",
        label:
          (state.currentDayIndex === 1 && state.bridgeSceneDone) ||
          (state.currentDayIndex === 2 && state.bridgeDay2Done) ||
          (state.currentDayIndex === 3 && state.bridgeDay3Done) ||
          (state.currentDayIndex === 4 && state.bridgeDay4Done) ||
          (state.currentDayIndex === 5 && state.bridgeDay5Done) ||
          (state.currentDayIndex === 6 && state.bridgeDay6Done) ||
          (state.currentDayIndex === 7 && state.bridgeDay7Done)
            ? "休息"
            : "看看",
        x: 1,
        y: 12,
        name: "村口路牌",
      },
    ];

    if (state.currentDayIndex === 3 && state.bellIssueSeenDay3 && !state.bellTestReportedDay3) {
      if (!state.bellListenLeftDone) {
        props.push({ id: "listen-left", label: "试听", x: 10, y: 10, name: "桥左侧木桩" });
      }
      if (!state.bellListenCenterDone) {
        props.push({ id: "listen-center", label: "试听", x: 12, y: 10, name: "桥中央" });
      }
      if (!state.bellListenRightDone) {
        props.push({ id: "listen-right", label: "试听", x: 14, y: 10, name: "右侧栏边" });
      }
    }

    if (state.currentDayIndex === 4 && state.seedQuestAcceptedDay4 && !state.seedFoundDay4) {
      props.push({ id: "seed-box", label: "翻找", x: 10, y: 2, name: "旧木箱" });
    }

    if (state.currentDayIndex === 5 && state.ribbonQuestAcceptedDay5 && !state.ribbonTaskReturnedDay5) {
      if (!state.ribbonBlueDoneDay5) {
        props.push({ id: "ribbon-blue", label: "系上", x: 10, y: 10, name: "左侧挂绳" });
      }
      if (!state.ribbonWhiteDoneDay5) {
        props.push({ id: "ribbon-white", label: "系上", x: 12, y: 9, name: "桥中挂绳" });
      }
      if (!state.ribbonGoldDoneDay5) {
        props.push({ id: "ribbon-gold", label: "系上", x: 15, y: 10, name: "右侧木栏" });
      }
    }

    if (state.currentDayIndex === 6 && state.lanternQuestAcceptedDay6 && !state.lanternTaskReturnedDay6) {
      if (!state.lanternLeftDoneDay6) {
        props.push({ id: "lantern-left", label: "点亮", x: 11, y: 9, name: "左侧桥灯" });
      }
      if (!state.lanternCenterDoneDay6) {
        props.push({ id: "lantern-center", label: "点亮", x: 12, y: 10, name: "桥心提灯" });
      }
      if (!state.lanternRightDoneDay6) {
        props.push({ id: "lantern-right", label: "点亮", x: 14, y: 9, name: "右侧桥灯" });
      }
    }

    if (state.currentDayIndex === 7 && state.festivalTagsReadyDay7 && !allFestivalWishTagsDone()) {
      if (!state.festivalWishLeftDoneDay7) {
        props.push({ id: "wish-left", label: "挂上", x: 10, y: 10, name: "左侧风记绳" });
      }
      if (!state.festivalWishCenterDoneDay7) {
        props.push({ id: "wish-center", label: "挂上", x: 12, y: 10, name: "桥心风记绳" });
      }
      if (!state.festivalWishRightDoneDay7) {
        props.push({ id: "wish-right", label: "挂上", x: 14, y: 10, name: "右侧风记绳" });
      }
    }

    if (sharedTracesUnlocked()) {
      props.push({
        id: "shared-traces",
        label: playerNearBridge() ? "留痕" : "翻看",
        x: 13,
        y: 10,
        name: "桥边风痕绳",
      });
    }

    props.forEach((prop) => {
      const distance = Math.abs(player.x - prop.x) + Math.abs(player.y - prop.y);
      if (distance <= 1) {
        targets.push({
          ...prop,
          kind: "prop",
          distance,
        });
      }
    });

    targets.sort((a, b) => {
      const aPriority = a.id === state.objectiveTarget ? 0 : 1;
      const bPriority = b.id === state.objectiveTarget ? 0 : 1;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return a.distance - b.distance;
    });
    return targets[0] || null;
  }

  function updateHint() {
    const target = nearestTarget();
    let nextHint = `目标：${state.objective}`;
    if (target) {
      const verb = target.kind === "npc" ? "交谈" : target.label;
      nextHint = `按 E / 空格 ${verb}：${target.name}`;
    }

    if (state.lastHint !== nextHint) {
      state.lastHint = nextHint;
      refs.hint.textContent = nextHint;
    }

    if (refs.guideNextStep) {
      refs.guideNextStep.textContent = target ? `离你最近：${nextHint}` : nextHint;
    }
  }

  function lookAtPlayer(npc) {
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      npc.facing = dx > 0 ? "right" : "left";
    } else {
      npc.facing = dy > 0 ? "down" : "up";
    }
  }

  function talkAzhi() {
    const npc = npcs.azhi;
    lookAtPlayer(npc);

    if (state.currentDayIndex === 7) {
      if (!state.festivalQuestAcceptedDay7) {
        openDialogue(
          [
            { speaker: "阿栀", text: "今天就是风铃集会啦。我昨晚几乎没怎么睡，总怕一睁眼它还没到。" },
            { speaker: "阿栀", text: "公告上不是写了吗，若愿意，也可以带一句想让风替你记住的话。" },
            { speaker: "阿栀", text: "你帮我去问林麦姐姐、许槐哥哥和秦婆婆吧。我想把他们的话写成三张风记签，挂到桥边等第一阵风。" },
          ],
          () => {
            state.festivalQuestAcceptedDay7 = true;
            setTimeSlot("白天");
            updateFestivalObjective();
            showToast("新委托：替阿栀收三句要挂上桥的风记签");
          },
        );
        return;
      }

      if (!state.festivalTagsReadyDay7) {
        if (!allFestivalLinesDone()) {
          const remaining = [];
          if (!state.festivalLineLinmaiDay7) {
            remaining.push("林麦姐姐");
          }
          if (!state.festivalLineXuhuaiDay7) {
            remaining.push("许槐哥哥");
          }
          if (!state.festivalLineQinDay7) {
            remaining.push("秦婆婆");
          }
          openDialogue([
            { speaker: "阿栀", text: `还差${remaining.join("、")}的话呢。今天要让风记住的句子，可不能少了村里人的份。` },
          ]);
          return;
        }

        openDialogue(
          [
            { speaker: "阿栀", text: "你回来啦，我都记好了。" },
            { speaker: "阿栀", text: "左边挂林麦姐姐的甜香句子，中间挂许槐哥哥那句稳当话，右边那张就留给秦婆婆和河风说悄悄话。" },
            { speaker: "阿栀", text: "你替我把它们挂上去吧。这样等黄昏第一阵风过桥的时候，今天就真的会完整起来。" },
          ],
          () => {
            state.festivalTagsReadyDay7 = true;
            updateFestivalObjective();
            showToast("阿栀把三句话写成了风记签");
          },
        );
        return;
      }

      if (!allFestivalWishTagsDone()) {
        openDialogue([
          { speaker: "阿栀", text: "左边那张要先闻见甜味，中间那张要站得最稳，右边那张得离河近一点。你去挂吧，我在这儿替你数风。" },
        ]);
        return;
      }

      if (!state.bridgeDay7Done) {
        openDialogue([
          { speaker: "阿栀", text: "都挂好了，真好。你快去桥边吧，今天那第一声终于不用只响给风听了。" },
        ]);
        return;
      }

      openDialogue(
        [
          { speaker: "阿栀", text: "今天的第一声真的有好多人一起听见了。我本来想记住它，后来发现它自己已经把我记住了。" },
          ...(sharedTraceFlavorLine("azhi") ? [{ speaker: "阿栀", text: sharedTraceFlavorLine("azhi") }] : []),
        ],
      );
      return;
    }

    if (state.currentDayIndex === 6) {
      if (!state.lanternQuestAcceptedDay6) {
        openDialogue([
          { speaker: "阿栀", text: "我已经想好明天要站在哪儿听第一声了，可今晚还得先把桥灯试亮。" },
          { speaker: "阿栀", text: "沈砚哥哥就在桥边等着呢。灯要是一盏一盏亮起来，明天就会更像真的会到。" },
        ]);
        return;
      }

      if (!state.lanternTaskReturnedDay6) {
        if (!allLanternPointsDone()) {
          openDialogue([
            { speaker: "阿栀", text: "左边那盏像给回家的人，桥中那盏像给留下的人，右边那盏要照到水面上。三盏都亮起来才像完整的前夜。" },
          ]);
          return;
        }

        openDialogue([
          { speaker: "阿栀", text: "都亮了都亮了，你快去找沈砚哥哥。我要先把这句“明天真会来”偷偷高兴一会儿。" },
        ]);
        return;
      }

      if (!state.bridgeDay6Done) {
        openDialogue([
          { speaker: "阿栀", text: "灯一亮，连风都像梳过头发一样整整齐齐的。你快去桥边再看一眼，今晚一定很好看。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "阿栀", text: "明天人要是太多，你可记得先看桥灯那边。我大概会站在最先被风碰到的地方。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      if (!state.ribbonQuestAcceptedDay5) {
        openDialogue(
          [
            { speaker: "阿栀", text: "你看，雨一停，桥边就突然像空出了好几处该挂上颜色的地方。" },
            { speaker: "阿栀", text: "我跟林麦姐姐借了几条布带，许槐哥哥把挂绳也留好了。你帮我把它们系上去吧？" },
            { speaker: "阿栀", text: "左边要晴蓝的，中间系米白的，右边那条杏黄色要让它最先碰到风。" },
          ],
          () => {
            state.ribbonQuestAcceptedDay5 = true;
            setTimeSlot("白天");
            updateRibbonObjective();
            showToast("新委托：帮阿栀把三条春色布带系到桥边");
          },
        );
        return;
      }

      if (!state.ribbonTaskReturnedDay5) {
        if (!allRibbonPointsDone()) {
          const remaining = [];
          if (!state.ribbonBlueDoneDay5) {
            remaining.push("晴蓝");
          }
          if (!state.ribbonWhiteDoneDay5) {
            remaining.push("米白");
          }
          if (!state.ribbonGoldDoneDay5) {
            remaining.push("杏黄");
          }
          openDialogue([
            {
              speaker: "阿栀",
              text: `还差${remaining.join("、")}那几条呢。系的时候别勒太死，要给风留一点可以钻过去的空。`,
            },
          ]);
          return;
        }

        openDialogue(
          [
            { speaker: "阿栀", text: "哇，真的都系好了。" },
            { speaker: "阿栀", text: "这样桥边就不只剩声音先去等周末了，连颜色也会比人更早一步站到那里。" },
            { speaker: "阿栀", text: "这个小布结送给你。傍晚记得去桥边呀，我想看它们第一次一起被风拎起来。" },
          ],
          () => {
            state.ribbonTaskReturnedDay5 = true;
            addInventory("春色布结");
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边看新布条第一次一起起风。", "shenyan");
            showToast("桥边已经有了新的颜色");
          },
        );
        return;
      }

      if (!state.bridgeDay5Done) {
        openDialogue([
          { speaker: "阿栀", text: "快去桥边呀。布条要是先动起来，风铃今晚就不敢落后了。" },
        ]);
        return;
      }

      openDialogue(
        [
          { speaker: "阿栀", text: "今天终于不只是安安静静地等了。桥边一有颜色，我连走路都想跟着跳一下。" },
          ...(sharedTraceFlavorLine("azhi") ? [{ speaker: "阿栀", text: sharedTraceFlavorLine("azhi") }] : []),
        ],
      );
      return;
    }

    if (state.currentDayIndex === 4) {
      if (!state.seedQuestAcceptedDay4) {
        openDialogue([
          { speaker: "阿栀", text: "下小雨的时候，叶子会先说话，地才跟着湿。" },
          { speaker: "阿栀", text: "秦婆婆今早在花圃边翻种子袋呢，她看起来像在找一包很要紧的春天。" },
        ]);
        return;
      }

      if (!state.seedReturnedDay4) {
        openDialogue([
          { speaker: "阿栀", text: "雨天翻木箱最像找宝藏了。你要是找到那包种子，记得看它边角是不是缝了蓝线。" },
        ]);
        return;
      }

      if (!state.bridgeDay4Done) {
        openDialogue([
          { speaker: "阿栀", text: "这种小雨最适合去桥边站一会儿。声音会慢一点，像怕把心事惊跑。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "阿栀", text: "今天的雨把话都泡软了。可桥边那句，还是被你听到了吧。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 3) {
      if (!state.bellIssueSeenDay3) {
        openDialogue([
          { speaker: "阿栀", text: "桥上的旧铃今天像打了个哈欠，只响了半声。" },
          { speaker: "阿栀", text: "许槐哥哥一大早就过去了，他那样皱着眉的时候，多半是木头和风在闹别扭。" },
        ]);
        return;
      }

      if (!state.bellTestReportedDay3) {
        openDialogue([
          { speaker: "阿栀", text: "你也去听听看呀。左边像刚醒，中间像真的会说话，右边倒像把尾音藏起来了。" },
        ]);
        return;
      }

      if (!state.bridgeDay3Done) {
        openDialogue([
          { speaker: "阿栀", text: "傍晚的时候，修过的铃会不会先跟风打一声招呼呢？我今天一直在猜这个。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "阿栀", text: "今天那一声终于完整了。周末来的时候，肯定会比今天更像真的故事。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (!state.noticeReadDay2) {
        openDialogue([
          { speaker: "阿栀", text: "广场公告栏上今早多了一张新纸，我只认得出‘风铃’两个字。" },
          { speaker: "阿栀", text: "你快去看看吧，我觉得那两个字今天比平时更响一点。" },
        ]);
        return;
      }

      if (!state.questBreadDay2Accepted) {
        openDialogue([
          { speaker: "阿栀", text: "林麦姐姐今天比昨天更忙，她说要把甜味先送到看告示的人手里。" },
        ]);
        return;
      }

      if (!state.breadDay2Returned) {
        openDialogue([
          { speaker: "阿栀", text: "我闻见第二篮点心啦。今天的风像在帮广场数人数。" },
        ]);
        return;
      }

      if (!state.bridgeDay2Done) {
        openDialogue([
          { speaker: "阿栀", text: "傍晚去桥边呀。今天的风像在练习周末要说的话。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "阿栀", text: "周末真的会挂风铃呢。我已经开始替第一声响紧张了。" },
      ]);
      return;
    }

    if (!state.metAzhi) {
      openDialogue(
        [
          { speaker: "阿栀", text: "嘘，你先别踩这边，我刚刚发现一颗会发亮的露珠。" },
          { speaker: "阿栀", text: "你是新来的吧？你走路的声音和村里的人不一样。" },
          { speaker: "阿栀", text: "往前走就是广场，再往左一点，风会把面包房的香味送给你。" },
        ],
        () => {
          state.metAzhi = true;
          setObjective("往前去广场看看，再去左边的面包房。", "linmai");
        },
      );
      return;
    }

    if (!state.breadReturned) {
      openDialogue([
        { speaker: "阿栀", text: "你记得去闻一闻面包房。闻见香味，路就不会走错。" },
      ]);
      return;
    }

    if (!state.bridgeSceneDone) {
      openDialogue([
        { speaker: "阿栀", text: "傍晚快到了，桥那边的风会先碰到布条，再碰到铃。" },
      ]);
      return;
    }

    openDialogue([
      { speaker: "阿栀", text: "今天的风已经认识你啦。明天它大概会吹得更近一点。" },
    ]);
  }

  function talkLinmai() {
    const npc = npcs.linmai;
    lookAtPlayer(npc);

    if (state.currentDayIndex === 7) {
      if (!state.festivalQuestAcceptedDay7) {
        openDialogue([
          { speaker: "林麦", text: "今天面包房一早就热得像会发光。阿栀在广场等着写风记签呢，你去看她吧。" },
        ]);
        return;
      }

      if (!state.festivalLineLinmaiDay7) {
        openDialogue(
          [
            { speaker: "林麦", text: "我想让风替我记住一句简单的。" },
            { speaker: "林麦", text: "你替我写上：‘愿来的人都先闻见甜香，再听见铃响。’" },
            { speaker: "林麦", text: "节日嘛，总得先让人觉得暖，再让人觉得热闹。" },
          ],
          () => {
            state.festivalLineLinmaiDay7 = true;
            updateFestivalObjective();
            showToast("记下了：林麦的风记句");
          },
        );
        return;
      }

      if (!state.festivalTagsReadyDay7) {
        openDialogue([
          { speaker: "林麦", text: "你先把三句话都带回去给阿栀吧。她写字的时候，连纸角都像会跟着高兴一点。" },
        ]);
        return;
      }

      if (!allFestivalWishTagsDone()) {
        openDialogue([
          { speaker: "林麦", text: "快把风记签挂上去吧。等黄昏真的来时，甜卷、茶香和铃声才会像站到同一张桌上。" },
        ]);
        return;
      }

      if (!state.bridgeDay7Done) {
        openDialogue([
          { speaker: "林麦", text: "我把最后一盘蜂蜜小卷也摆好了。你先去桥边吧，今天那第一声响起来时，整村人都会一起把心放下去。" },
        ]);
        return;
      }

      openDialogue(
        [
          { speaker: "林麦", text: "今天忙得脚都没停，可真听见那一声的时候，心反倒静了一下。像这一周总算烤到了最刚好的火候。" },
          ...(sharedTraceFlavorLine("linmai") ? [{ speaker: "林麦", text: sharedTraceFlavorLine("linmai") }] : []),
        ],
      );
      return;
    }

    if (state.currentDayIndex === 6) {
      if (!state.lanternQuestAcceptedDay6) {
        openDialogue([
          { speaker: "林麦", text: "我今天把明早那炉面团也发上了。节日前夜最怕桥边暗着一角，你先去找沈砚，他在等今晚试灯。" },
        ]);
        return;
      }

      if (!state.lanternTaskReturnedDay6) {
        openDialogue([
          { speaker: "林麦", text: "先帮桥边把灯点起来吧。我这边已经把明天要分给孩子们的蜂蜜小卷包好了，就差那边亮起来让我安心。" },
        ]);
        return;
      }

      if (!state.bridgeDay6Done) {
        openDialogue([
          { speaker: "林麦", text: "傍晚你再去桥边时，替我看看灯火会不会把那几条布带也照得更软一点。要是是的话，明天的甜味大概也会更好入口。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "林麦", text: "我今晚终于敢把“明天会很热闹”这句话说出口了。前几天只是忙，今天才真像要迎人。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      if (!state.ribbonQuestAcceptedDay5) {
        openDialogue([
          { speaker: "林麦", text: "雨刚停，炉火就跟着精神了。阿栀抱着一篮布条在桥边转来转去，你去看她一眼吧。" },
        ]);
        return;
      }

      if (!state.ribbonTaskReturnedDay5) {
        openDialogue([
          { speaker: "林麦", text: "先帮阿栀把布条绑完吧。我这边甜面包刚出炉，村里人一忙起来，连香味都像有了脚步声。" },
        ]);
        return;
      }

      if (!state.bridgeDay5Done) {
        openDialogue([
          { speaker: "林麦", text: "傍晚去桥边时，替我看看那些布条有没有把整座桥都点亮一点。今天这一炉面包，我就是照着那个心情烤的。" },
        ]);
        return;
      }

      openDialogue(
        [
          { speaker: "林麦", text: "今天做第三炉点心都没觉得累。热闹还没真正到，可它已经先长出香味来了。" },
          ...(sharedTraceFlavorLine("linmai") ? [{ speaker: "林麦", text: sharedTraceFlavorLine("linmai") }] : []),
        ],
      );
      return;
    }

    if (state.currentDayIndex === 4) {
      if (!state.seedQuestAcceptedDay4) {
        openDialogue([
          { speaker: "林麦", text: "一下雨，面团和人都会慢一点。你要是往坡上去，看见秦婆婆的话，替我问她今天还缺不缺铃兰种子。" },
        ]);
        return;
      }

      if (!state.seedReturnedDay4) {
        openDialogue([
          { speaker: "林麦", text: "先帮秦婆婆把那包种子找回来吧。雨天里丢了要紧的小东西，人会比平时更惦记。" },
        ]);
        return;
      }

      if (!state.bridgeDay4Done) {
        openDialogue([
          { speaker: "林麦", text: "今天这雨刚刚好，不大不小。你傍晚去桥边时，替我听听风和雨有没有在一块儿把声音压轻。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "林麦", text: "我今天烤面包时都不敢把火烧太旺，怕把这场雨天的安静烤跑了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 3) {
      if (!state.bellIssueSeenDay3) {
        openDialogue([
          { speaker: "林麦", text: "你来得正好，不过今天先别急着帮我跑腿。桥边那串旧铃只响了半声，许槐一早就过去看了。" },
          { speaker: "林麦", text: "你若路过，替我也听听。节日前这种小毛病，最会让人心里发紧。" },
        ]);
        return;
      }

      if (!state.bellTestReportedDay3) {
        openDialogue([
          { speaker: "林麦", text: "先帮许槐把铃声听明白吧。我这边炉火还能等等，可风不会一直停在原地。" },
        ]);
        return;
      }

      if (!state.bridgeDay3Done) {
        openDialogue([
          { speaker: "林麦", text: "他说中间最好听，对吧？那就好。傍晚你再去桥边看看，要是那一声顺了，我今晚揉面都会轻一点。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "林麦", text: "桥边那一声稳下来以后，我忽然觉得周末真会到。明天我该开始认真想点心名单了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (!state.noticeReadDay2) {
        openDialogue([
          { speaker: "林麦", text: "今天广场公告栏贴了新纸，你先去看一眼再来。我这边等会儿正好有事想托你。" },
        ]);
        return;
      }

      if (!state.questBreadDay2Accepted) {
        openDialogue(
          [
            { speaker: "林麦", text: "你看见那张告示了吧？周末要办春季风铃集会，我一想起人会多起来，就开始替炉火紧张。" },
            { speaker: "林麦", text: "能不能再帮我一回？把第二篮点心送去广场，今天是专门留给看告示和布置场地的人。" },
            { speaker: "林麦", text: "这一篮比昨天更甜一点。节日越近，我越想让村子先闻到好消息。" },
          ],
          () => {
            state.questBreadDay2Accepted = true;
            setTimeSlot("白天");
            setObjective("把第二篮点心送去广场白布小桌。", "table");
            showToast("新委托：把第二篮点心送去广场");
          },
        );
        return;
      }

      if (!state.breadDay2Delivered) {
        openDialogue([
          { speaker: "林麦", text: "第二篮还是放到广场那张白布小桌上。今天闻见甜味的人，大概都会顺手多看两眼告示。" },
        ]);
        return;
      }

      if (!state.breadDay2Returned) {
        openDialogue(
          [
            { speaker: "林麦", text: "这回你刚放下没多久，广场那边就有人围过去了。" },
            { speaker: "林麦", text: "我还是会紧张，可一想到周末大家都会站在桥边听风铃，心又好像跟着稳一点。" },
            { speaker: "林麦", text: "这块蜜香小饼你带着。傍晚去桥边时，替我先听听今天的风是不是已经会唱集会的前奏了。" },
          ],
          () => {
            state.breadDay2Returned = true;
            addInventory("蜜香小饼");
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边听今天的风。", "shenyan");
          },
        );
        return;
      }

      if (!state.bridgeDay2Done) {
        openDialogue([
          { speaker: "林麦", text: "快去桥边吧。今天的风说不定已经学会怎么把周末的铃声带过桥了。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "林麦", text: "周末前我还想再试一炉点心。你明天来的话，记得继续替我尝第一口。" },
      ]);
      return;
    }

    if (!state.metAzhi) {
      openDialogue([
        { speaker: "林麦", text: "你先去和村口那个小机灵鬼说两句吧，她准已经发现你来了。" },
      ]);
      return;
    }

    if (!state.questBreadAccepted) {
      openDialogue(
        [
          { speaker: "林麦", text: "哎，你来得正好，我正缺一双空着的手。" },
          { speaker: "林麦", text: "能不能帮我把这第一篮点心送去广场？放到公告栏旁边那张白布小桌上就行。" },
          { speaker: "林麦", text: "路上不许偷吃。我嘴上这么说，可你真偷一口，我大概也闻得出来。" },
        ],
        () => {
          state.questBreadAccepted = true;
          setTimeSlot("白天");
          setObjective("把第一篮点心送去广场白布小桌。", "table");
          showToast("新委托：把第一篮点心送去广场");
        },
      );
      return;
    }

    if (!state.breadDelivered) {
      openDialogue([
        { speaker: "林麦", text: "广场那张铺白布的小桌就在公告栏旁边。趁它还热着，帮我送过去吧。" },
      ]);
      return;
    }

    if (!state.breadReturned) {
      openDialogue(
        [
          { speaker: "林麦", text: "这么快？篮子都还热着。" },
          { speaker: "林麦", text: "你做事挺稳的，我喜欢和稳当的人打交道。" },
          { speaker: "林麦", text: "来，这块春莓小卷给你。傍晚要是有空，去桥边看看，雾铃的风到那时候才算开口说话。" },
        ],
        () => {
          state.breadReturned = true;
          addInventory("春莓小卷");
          setTimeSlot("傍晚");
          setObjective("傍晚去桥边听风。", "shenyan");
        },
      );
      return;
    }

    if (!state.bridgeSceneDone) {
      openDialogue([
        { speaker: "林麦", text: "快去桥边吧。今天第一天，可别把雾铃的傍晚错过去了。" },
      ]);
      return;
    }

    openDialogue([
      { speaker: "林麦", text: "明天你再来早一点，我把第一炉最香的那口留给你。" },
    ]);
  }

  function talkShenyan() {
    const npc = npcs.shenyan;
    lookAtPlayer(npc);

    if (state.currentDayIndex === 7) {
      if (!state.festivalQuestAcceptedDay7) {
        openDialogue([
          { speaker: "沈砚", text: "今天桥边不会缺人，可阿栀说她还想让今天留下几句话。你先去广场找她吧，这主意很好。" },
        ]);
        return;
      }

      if (!state.festivalTagsReadyDay7) {
        openDialogue([
          { speaker: "沈砚", text: "先把三句话带回来吧。节日若只有声音，会热闹；有了想留下的话，才会让人舍不得忘。" },
        ]);
        return;
      }

      if (!allFestivalWishTagsDone()) {
        openDialogue([
          { speaker: "沈砚", text: "把风记签挂到桥边去吧。等人群来了，它们会先替我们把今天站住一点。" },
        ]);
        return;
      }

      if (!state.bridgeDay7Done) {
        openDialogue(
          [
            { speaker: "沈砚", text: "你看，今天终于不是只有风在等桥了。" },
            { speaker: "沈砚", text: "布条在，灯也在，纸签替人留下话，河水替人留住回声。等了这一周，今天这一切总算真的为人站到了一起。" },
            { speaker: "沈砚", text: "听见了吗？这一声已经不是练习，也不是试着开口。它是完整的，是给今天的。" },
            { speaker: "沈砚", text: "回去歇着吧。把这枚集会铃穗带上，往后你只要听见风过桥，大概都会想起今天。" },
          ],
          () => {
            state.bridgeDay7Done = true;
            addInventory("集会铃穗");
            setObjective("回村口休息，把这一周等来的那一声也带回去。", "gate");
          },
        );
        return;
      }

      openDialogue(
        [
          { speaker: "沈砚", text: "真正等到的那一声，往往不会比想象里更大。它只是刚刚好，刚好让你知道，这一周都没有白等。" },
          ...(sharedTraceFlavorLine("shenyan") ? [{ speaker: "沈砚", text: sharedTraceFlavorLine("shenyan") }] : []),
        ],
      );
      return;
    }

    if (state.currentDayIndex === 6) {
      if (!state.lanternQuestAcceptedDay6) {
        openDialogue(
          [
            { speaker: "沈砚", text: "明天黄昏就是风铃集会了。我想趁今晚先把桥灯点一遍，看看这座桥夜里会不会像明晚那样等人。" },
            { speaker: "沈砚", text: "左侧路口一盏，桥心一盏，右边再一盏。你帮我把火都引上吧。" },
            { speaker: "沈砚", text: "灯先亮过一遍，人心才敢真的相信“明天就到了”。" },
          ],
          () => {
            state.lanternQuestAcceptedDay6 = true;
            setTimeSlot("白天");
            updateLanternObjective();
            showToast("新委托：帮沈砚试亮桥边三盏灯");
          },
        );
        return;
      }

      if (!state.lanternTaskReturnedDay6) {
        if (!allLanternPointsDone()) {
          openDialogue([
            { speaker: "沈砚", text: "先把三盏都点起来吧。左边、桥心、右边都亮了，我才看得出今晚这条桥会不会稳稳地把人接住。" },
          ]);
          return;
        }

        openDialogue(
          [
            { speaker: "沈砚", text: "很好，三盏灯都亮了。" },
            { speaker: "沈砚", text: "这样一来，明晚先被人看见的，就不会只是那枚旧铃了。桥会先替我们把人迎住。" },
            { speaker: "沈砚", text: "这枚灯穗小签你收着。傍晚再来桥边看看吧，试亮过的夜色会比白天更像“真的快到了”。" },
          ],
          () => {
            state.lanternTaskReturnedDay6 = true;
            addInventory("灯穗小签");
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边看看试亮后的桥夜。", "shenyan");
            showToast("桥边的试灯已经准备好了");
          },
        );
        return;
      }

      if (!state.bridgeDay6Done) {
        openDialogue(
          [
            { speaker: "沈砚", text: "你看，灯一亮，桥边就真的不像还隔着一天了。" },
            { speaker: "沈砚", text: "布条已经有颜色，旧铃也稳了，灯火再一落下来，连晚风都开始学着替明天让路。" },
            { speaker: "沈砚", text: "这时候最像节日前夜。不是已经开始热闹，而是连安静里都装着“快到了”。" },
            { speaker: "沈砚", text: "回去歇着吧。明天黄昏，雾铃会把这一周一直没说完的后半句自己说完。" },
          ],
          () => {
            state.bridgeDay6Done = true;
            setObjective("回村口休息，把今晚试亮的灯火也记进心里。", "gate");
          },
        );
        return;
      }

      openDialogue([
        { speaker: "沈砚", text: "前夜最动人的地方，往往不是灯真的多亮，而是人终于肯承认“明天就在门外了”。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      if (!state.ribbonQuestAcceptedDay5) {
        openDialogue([
          { speaker: "沈砚", text: "昨天下过雨，今天桥边就开始添颜色了。阿栀抱着布条等人帮忙，你去正好。" },
        ]);
        return;
      }

      if (!state.ribbonTaskReturnedDay5) {
        openDialogue([
          { speaker: "沈砚", text: "先把布条绑好吧。风碰到颜色的时候，人会比碰到声音时更容易想起要往桥边走。" },
        ]);
        return;
      }

      if (!state.bridgeDay5Done) {
        openDialogue(
          [
            { speaker: "沈砚", text: "你看，昨天的雨刚退开，今天桥边已经多了几道会动的颜色。" },
            { speaker: "沈砚", text: "风先拂过布条，再去碰那枚旧铃，声音就不像前几天那样只顾着练习了，倒像真的开始等人。" },
            { speaker: "沈砚", text: "这就对了。集会还没到，可大家已经朝同一个方向忙起来了。回去歇着吧，明天这股劲会更明显。" },
          ],
          () => {
            state.bridgeDay5Done = true;
            setObjective("回村口休息，把重新热起来的风也记进今天。", "gate");
          },
        );
        return;
      }

      openDialogue(
        [
          { speaker: "沈砚", text: "安静过后再热闹起来的声音，通常会比一开始就热闹更动人一点。" },
          ...(sharedTraceFlavorLine("shenyan") ? [{ speaker: "沈砚", text: sharedTraceFlavorLine("shenyan") }] : []),
        ],
      );
      return;
    }

    if (state.currentDayIndex === 4) {
      if (!state.seedReturnedDay4) {
        openDialogue([
          { speaker: "沈砚", text: "小雨天的桥边最会留人。你先去帮秦婆婆，她今天看上去像在找一件不能耽误的小东西。" },
        ]);
        return;
      }

      if (!state.bridgeDay4Done) {
        openDialogue(
          [
            { speaker: "沈砚", text: "雨一落下来，河面就像把话轻轻按下去了。" },
            { speaker: "沈砚", text: "这种天气站在桥边，不一定非得说什么。听雨、听水、听那一声还没到周末就先学会安静的铃，也算陪着过了一段时间。" },
            { speaker: "沈砚", text: "回去吧。明天雨停了，人心大概会比今天更敢往前走一点。" },
          ],
          () => {
            state.bridgeDay4Done = true;
            setObjective("回村口休息，把雨声也记进今天。", "gate");
          },
        );
        return;
      }

      openDialogue([
        { speaker: "沈砚", text: "细雨天的桥边不会把话说满，可人离开的时候，心总会轻一点。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 3) {
      if (!state.bellIssueSeenDay3) {
        openDialogue([
          { speaker: "沈砚", text: "今早风刚上桥，那串旧铃只响了一半。像有人应了一声，又把后半句收回去了。" },
          { speaker: "沈砚", text: "许槐在那边等着，你去听听也好。风这种东西，多一双耳朵总比少一双稳。" },
        ]);
        return;
      }

      if (!state.bellTestReportedDay3) {
        openDialogue([
          { speaker: "沈砚", text: "左边更轻，中间最稳，右边拖得长。要是你问我，我大概也会选中间。" },
        ]);
        return;
      }

      if (!state.bridgeDay3Done) {
        openDialogue(
          [
            { speaker: "沈砚", text: "听见了吗？今天这一下终于不是半句了。" },
            { speaker: "沈砚", text: "真正的风铃集会还没到，可桥边已经开始知道自己周末该怎么响。" },
            { speaker: "沈砚", text: "你回去歇着吧。明天再来时，这村子大概会比今天更像在准备一件好事。" },
          ],
          () => {
            state.bridgeDay3Done = true;
            setObjective("回村口休息，把今天修好的那一声带回去。", "gate");
          },
        );
        return;
      }

      openDialogue([
        { speaker: "沈砚", text: "今天总算像把那句没说完的话补上了。到了周末，这条河会替铃声记得更久。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (!state.breadDay2Returned) {
        openDialogue([
          { speaker: "沈砚", text: "白天的风还像在试嗓子。你傍晚再来，桥边说的话会更完整一些。" },
        ]);
        return;
      }

      if (!state.bridgeDay2Done) {
        openDialogue(
          [
            { speaker: "沈砚", text: "你看，今天的风比昨天更敢往桥上走了。" },
            { speaker: "沈砚", text: "白天那些看告示的人把热闹带了过来，到了周末，铃声大概也会跟着更亮一点。" },
            { speaker: "沈砚", text: "真正好听的时候还在后头。先把这阵风记住，等风铃集会来了，你就知道它今天是在练习。" },
          ],
          () => {
            state.bridgeDay2Done = true;
            setObjective("回村口休息，带着今天的告示和风声。", "gate");
          },
        );
        return;
      }

      openDialogue([
        { speaker: "沈砚", text: "周末桥上大概会站满人。风若肯配合，这条河会把铃声送得很远。" },
      ]);
      return;
    }

    if (!state.breadReturned) {
      openDialogue([
        { speaker: "沈砚", text: "桥板有点潮，走慢些。你要是刚进村，傍晚再来这儿会更好。" },
      ]);
      return;
    }

    if (!state.bridgeSceneDone) {
      openDialogue(
        [
          { speaker: "沈砚", text: "你来得正是时候。风先从河面上来，再从桥上走过去。" },
          { speaker: "沈砚", text: "听见了吗？雾铃很多时候就是这样，不先热闹，先让人安静下来。" },
          { speaker: "沈砚", text: "你第一天能听见这一声，算运气不错。回去歇着吧，明天这村子还在。" },
        ],
        () => {
          state.bridgeSceneDone = true;
          setObjective("回村口休息。", "gate");
        },
      );
      return;
    }

    openDialogue([
      { speaker: "沈砚", text: "人散了，河反而更会记事。今天这阵风，明天还会留一点在水里。" },
    ]);
  }

  function talkXuhuai() {
    const npc = npcs.xuhuai;
    lookAtPlayer(npc);

    if (state.currentDayIndex === 7) {
      if (!state.festivalQuestAcceptedDay7) {
        openDialogue([
          { speaker: "许槐", text: "今天桥上要来不少人，我一早又把木板重新摸了一遍。阿栀在广场找人帮她写风记签，你去看看吧。" },
        ]);
        return;
      }

      if (!state.festivalLineXuhuaiDay7) {
        openDialogue(
          [
            { speaker: "许槐", text: "我想挂上去的话？那就写得直一点。" },
            { speaker: "许槐", text: "你替我记：‘愿这座桥把每一步都接稳。’" },
            { speaker: "许槐", text: "铃响也好，人多也好，只要脚下稳，大家就都能安心把那一声听完。" },
          ],
          () => {
            state.festivalLineXuhuaiDay7 = true;
            updateFestivalObjective();
            showToast("记下了：许槐的风记句");
          },
        );
        return;
      }

      if (!state.festivalTagsReadyDay7) {
        openDialogue([
          { speaker: "许槐", text: "先去让阿栀写吧。她要是把话挂上去了，这桥今天就不只是结实，还会有点人情味。" },
        ]);
        return;
      }

      if (!allFestivalWishTagsDone()) {
        openDialogue([
          { speaker: "许槐", text: "把我的那张挂桥心就对了。中间最稳，来的人一抬头就能看见。" },
        ]);
        return;
      }

      if (!state.bridgeDay7Done) {
        openDialogue([
          { speaker: "许槐", text: "我把最后一枚木扣也紧好了。接下来就轮到风和人群自己把今天走完了。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "许槐", text: "人一多，木头会更响，铃也会更响。可今天听起来最稳的，还是大家真的都来了这件事。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 6) {
      if (!state.lanternQuestAcceptedDay6) {
        openDialogue([
          { speaker: "许槐", text: "灯架我都装稳了，差一步就是试火。你去找沈砚吧，他在等整座桥一起亮起来的那一眼。" },
        ]);
        return;
      }

      if (!state.lanternTaskReturnedDay6) {
        if (allLanternPointsDone()) {
          openDialogue([
            { speaker: "许槐", text: "都亮了？那就先去让沈砚看。他看整桥，我看木头，刚好。" },
          ]);
          return;
        }

        openDialogue([
          { speaker: "许槐", text: "左边那盏火别送太急，桥心那盏要收稳，右边那盏可以亮得活一点。明晚人一多，灯就得自己先会站住。" },
        ]);
        return;
      }

      if (!state.bridgeDay6Done) {
        openDialogue([
          { speaker: "许槐", text: "今晚一亮成，明天就只剩等人来了。做到这一步，木头能做的差不多都做完了。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "许槐", text: "桥架、挂绳、灯钩都到位了。剩下就看明天的风和人群肯不肯一起配合。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      if (!state.ribbonQuestAcceptedDay5) {
        openDialogue([
          { speaker: "许槐", text: "昨天刚下过雨，今天得趁木头还肯听话把挂绳都试一遍。阿栀那几条布带，你去帮她系上正好。" },
        ]);
        return;
      }

      if (!state.ribbonTaskReturnedDay5) {
        if (allRibbonPointsDone()) {
          openDialogue([
            { speaker: "许槐", text: "先去让阿栀看看吧。她盯颜色的位置，比我盯木头还认真。" },
          ]);
          return;
        }

        openDialogue([
          { speaker: "许槐", text: "系的时候别把三条都拽成一样紧。左边松半指，中间收稳，右边那条给它留点甩尾，风一来才好看。" },
        ]);
        return;
      }

      if (!state.bridgeDay5Done) {
        openDialogue([
          { speaker: "许槐", text: "傍晚那阵风一过，布条要是先动，说明你系得正合适。木架的事我能管，活气还得靠你们添。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "许槐", text: "今天一抬头，桥边总算不像只剩空木架了。有人肯往上添颜色，做东西的人心里也会松一点。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 4) {
      if (!state.seedReturnedDay4) {
        openDialogue([
          { speaker: "许槐", text: "木头最怕这种潮气，我今天只敢把要紧的几块先收进棚里。你要是去花圃那边，替我看看秦婆婆有没有找到她要的种子。" },
        ]);
        return;
      }

      if (!state.bridgeDay4Done) {
        openDialogue([
          { speaker: "许槐", text: "今天不适合调木架，倒适合听声音。雨会把多余的东西都压下去，剩下的反而更真。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "许槐", text: "昨天忙着把铃调顺，今天倒像轮到雨来替桥边收音了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 3) {
      if (!state.bellIssueSeenDay3) {
        openDialogue(
          [
            { speaker: "许槐", text: "你来得正好。这串旧风铃今天只响了半声，我听着总觉得哪儿没站对。" },
            { speaker: "许槐", text: "帮我个忙。你去桥左边听一回，中间听一回，右边再听一回。" },
            { speaker: "许槐", text: "听完回来告诉我，你觉得哪边的声音最顺。" },
          ],
          () => {
            state.bellIssueSeenDay3 = true;
            setTimeSlot("白天");
            updateBellObjective();
            showToast("新委托：替许槐试听旧风铃");
          },
        );
        return;
      }

      if (!state.bellTestReportedDay3) {
        if (!allBellPointsDone()) {
          openDialogue([
            { speaker: "许槐", text: "先把左边、中间、右边都听一遍。你替我听过，我才敢信这不是我一个人的错觉。" },
          ]);
          return;
        }

        openDialogue(
          [
            { speaker: "许槐", text: "中间最好听？" },
            { speaker: "许槐", text: "……我也是这么想的。只是有时候做东西的人，不太敢先信自己的耳朵。" },
            { speaker: "许槐", text: "好，我把它再调一调。傍晚你去桥边听第一声，要是顺了，就算这回没白折腾。" },
          ],
          () => {
            state.bellTestReportedDay3 = true;
            addInventory("风铃木片");
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边听修过后的第一声。", "shenyan");
          },
        );
        return;
      }

      if (!state.bridgeDay3Done) {
        openDialogue([
          { speaker: "许槐", text: "我已经把扣子和挂点重新调过了。剩下的，就得等傍晚那阵风自己来试。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "许槐", text: "今天总算响完整了。周末我还得再把木架量一遍，可心已经没早上那么紧了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (!state.noticeReadDay2) {
        openDialogue([
          { speaker: "许槐", text: "今早那张新告示贴歪了，我刚扶正。你去看看，周末桥边大概要开始忙了。" },
        ]);
        return;
      }

      if (!state.breadDay2Returned) {
        openDialogue([
          { speaker: "许槐", text: "周末既然要办风铃集会，我明天得去桥边再量一遍木架。声音这种事，看不见，却最挑剔。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "许槐", text: "你今天也去桥边了吧？听声音的人多了，做东西的人心里会更有数。" },
      ]);
      return;
    }

    if (!state.questBreadAccepted) {
      openDialogue([
        { speaker: "许槐", text: "那张告示又歪了。你先逛吧，认不清路，就看哪儿有人在忙。" },
      ]);
      return;
    }

    if (!state.breadReturned) {
      openDialogue([
        { speaker: "许槐", text: "林麦店里的桌脚去年是我修的，放一篮热面包足够稳。" },
      ]);
      return;
    }

    openDialogue([
      { speaker: "许槐", text: "桥边那块栏杆我一会儿还要再看一遍。风一大，才能知道什么算牢靠。" },
    ]);
  }

  function talkQin() {
    const npc = npcs.qin;
    lookAtPlayer(npc);

    if (state.currentDayIndex === 7) {
      if (!state.festivalQuestAcceptedDay7) {
        openDialogue([
          { speaker: "秦婆婆", text: "这一天总算叫你们等到了。阿栀说要替大家收一句话挂给风听，你先去找她吧。" },
        ]);
        return;
      }

      if (!state.festivalLineQinDay7) {
        openDialogue(
          [
            { speaker: "秦婆婆", text: "若真要让我交一句给风，就写温和些。" },
            { speaker: "秦婆婆", text: "你替我记：‘愿春天的好事落在人肩上，都轻一点。’" },
            { speaker: "秦婆婆", text: "日子里的好事若太重，人会舍不得接。轻一点，才会愿意一直带着走。" },
          ],
          () => {
            state.festivalLineQinDay7 = true;
            updateFestivalObjective();
            showToast("记下了：秦婆婆的风记句");
          },
        );
        return;
      }

      if (!state.festivalTagsReadyDay7) {
        openDialogue([
          { speaker: "秦婆婆", text: "先把句子都交给阿栀吧。小孩子写下来的愿望，往往比大人藏着的心事还会飞。" },
        ]);
        return;
      }

      if (!allFestivalWishTagsDone()) {
        openDialogue([
          { speaker: "秦婆婆", text: "我那一句挂右边就好，挨着河，挨着风。让它慢慢飘过去，比大声说出来更长久。" },
        ]);
        return;
      }

      if (!state.bridgeDay7Done) {
        openDialogue([
          { speaker: "秦婆婆", text: "快去桥边吧。今天不只是听铃，也是看这一周一点点攒起来的春天，终于一起落到人间。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "秦婆婆", text: "这就对了。人、风、桥、铃，总得在同一天碰到一块儿，节日才算真的成了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 6) {
      if (!state.lanternQuestAcceptedDay6) {
        openDialogue([
          { speaker: "秦婆婆", text: "前夜点灯，是告诉路，也告诉心：明天该往哪儿去了。你去帮沈砚吧，桥边今晚正缺这一把火。" },
        ]);
        return;
      }

      if (!state.lanternTaskReturnedDay6) {
        openDialogue([
          { speaker: "秦婆婆", text: "把灯点起来，今晚这村子就不会再只是“正在准备”了。人心一旦见了亮，脚步自然会跟过去。" },
        ]);
        return;
      }

      if (!state.bridgeDay6Done) {
        openDialogue([
          { speaker: "秦婆婆", text: "去桥边看看吧。昨儿是颜色先到，今儿是灯先亮。这样到了明天，热闹才有地方安安稳稳落下来。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "秦婆婆", text: "前夜总该这样才对。灯先亮，心先到，明天来了才装得下真正的热闹。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      if (!state.ribbonQuestAcceptedDay5) {
        openDialogue([
          { speaker: "秦婆婆", text: "昨天下过雨，今天地气一冒上来，什么都肯长。阿栀要去绑布条，你去帮她把桥边也叫醒吧。" },
        ]);
        return;
      }

      if (!state.ribbonTaskReturnedDay5) {
        openDialogue([
          { speaker: "秦婆婆", text: "雨停后的第一件事，最该是把颜色挂回去。人心看见亮堂的东西，也会愿意跟着往前走。" },
        ]);
        return;
      }

      if (!state.bridgeDay5Done) {
        openDialogue([
          { speaker: "秦婆婆", text: "去桥边听听吧。颜色一动，人心就会跟着亮一点。昨天是把心按稳，今天该轮到把它提起来了。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "秦婆婆", text: "日子有轻有重才好。昨儿是静，今儿是忙，这一周的春天就算慢慢长全了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 4) {
      if (!state.seedQuestAcceptedDay4) {
        openDialogue(
          [
            { speaker: "秦婆婆", text: "今早这场细雨正适合下种，可我偏偏一时想不起把‘雨后铃兰’那包种子收在哪儿了。" },
            { speaker: "秦婆婆", text: "你能替我去药草棚后那只旧木箱里翻一翻吗？纸包边角缝着一点蓝线，我认得那个。" },
            { speaker: "秦婆婆", text: "找到了就拿来给我。花该在春雨里下去，人心也一样，错过了这会儿就得再等。" },
          ],
          () => {
            state.seedQuestAcceptedDay4 = true;
            setTimeSlot("白天");
            setObjective("去药草棚后的旧木箱里找“雨后铃兰”种子。", "seed-box");
            showToast("新委托：替秦婆婆找回雨后铃兰种子");
          },
        );
        return;
      }

      if (!state.seedFoundDay4) {
        openDialogue([
          { speaker: "秦婆婆", text: "旧木箱就在药草棚后头，靠近那只旧篮子。纸包边角有一点蓝线，别认错了。" },
        ]);
        return;
      }

      if (!state.seedReturnedDay4) {
        openDialogue(
          [
            { speaker: "秦婆婆", text: "就是它，边角这点蓝线我一看就认得。" },
            { speaker: "秦婆婆", text: "人一上了年纪，东西还记得，手放过的地方倒容易慢一拍。幸好今天有你替我把这件小事接住了。" },
            { speaker: "秦婆婆", text: "这只铃兰香包你拿着吧。雨天去桥边站一会儿，比闷在屋里更能把心里的褶子放平。" },
          ],
          () => {
            state.seedReturnedDay4 = true;
            addInventory("铃兰香包");
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边听雨声和河水。", "shenyan");
          },
        );
        return;
      }

      if (!state.bridgeDay4Done) {
        openDialogue([
          { speaker: "秦婆婆", text: "去桥边吧。雨天最会把人心里浮着的东西轻轻按回去一点。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "秦婆婆", text: "种子找回来了，雨也下过了。今天算是把该落地的东西都安安稳稳放回去了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 3) {
      if (!state.bellIssueSeenDay3) {
        openDialogue([
          { speaker: "秦婆婆", text: "旧风铃今早只响了半句，像春天说话时先咳了一声。你去桥边看看吧，许槐正在那儿琢磨。" },
        ]);
        return;
      }

      if (!state.bellTestReportedDay3) {
        openDialogue([
          { speaker: "秦婆婆", text: "声音这种东西，看不见，却最会叫人较真。你替他听一听，正合适。" },
        ]);
        return;
      }

      if (!state.bridgeDay3Done) {
        openDialogue([
          { speaker: "秦婆婆", text: "白天先把铃调顺，傍晚再去听那一下落不落得稳。村里准备节日，多半都是这样一点一点来。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "秦婆婆", text: "半句补成了一整句，人的心也会跟着安下来一点。周末又近了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (!state.noticeReadDay2) {
        openDialogue([
          { speaker: "秦婆婆", text: "广场那张新纸一贴上，连花圃边的风都勤快了些。你去看看吧，周末的热闹有眉目了。" },
        ]);
        return;
      }

      if (!state.breadDay2Returned) {
        openDialogue([
          { speaker: "秦婆婆", text: "人一知道有节日，脚步都会轻一点。你替林麦跑这一趟，也算往热闹里添了一把火。" },
        ]);
        return;
      }

      if (!state.bridgeDay2Done) {
        openDialogue([
          { speaker: "秦婆婆", text: "傍晚再去桥边吧。今天的风已经开始替周末试口风了。" },
        ]);
        return;
      }

      openDialogue([
        { speaker: "秦婆婆", text: "有些节日还没到，人心就先亮起来了。今天差不多就是这种时候。" },
      ]);
      return;
    }

    if (!state.metAzhi) {
      openDialogue([
        { speaker: "秦婆婆", text: "今天不必急着认识所有人，先让村子认一认你。" },
      ]);
      return;
    }

    if (!state.breadReturned) {
      openDialogue([
        { speaker: "秦婆婆", text: "林麦若肯把第一炉分出去，说明她已经把你算进村子一点了。" },
      ]);
      return;
    }

    if (!state.bridgeSceneDone) {
      openDialogue([
        { speaker: "秦婆婆", text: "傍晚去桥边吧。雾铃的风，总会替人把心放轻一点。" },
      ]);
      return;
    }

    openDialogue([
      { speaker: "秦婆婆", text: "第一天走下来，脚累一点才好。人走过的地方，第二天才会觉得熟。" },
    ]);
  }

  function inspectNotice() {
    if (state.currentDayIndex === 7) {
      openDialogue([
        { speaker: "公告栏", text: "最上面那张纸已经换成了今天的字：‘春季风铃集会，黄昏开场。若你来到桥边，也请把今天轻轻留在风里。’" },
      ]);
      return;
    }

    if (state.currentDayIndex === 6) {
      openDialogue([
        { speaker: "公告栏", text: "最新贴上的纸写着：‘明日黄昏，春季风铃集会。桥灯会先亮，愿你沿着风和河水慢慢走来。’" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      openDialogue([
        { speaker: "公告栏", text: "集会告示旁边又多了一张手写小纸：‘周末黄昏，桥边见。若你愿意，也可带一句想让风替你记住的话。’" },
      ]);
      return;
    }

    if (state.currentDayIndex === 4) {
      openDialogue([
        { speaker: "公告栏", text: "细雨把告示纸压得更贴了，只有边角还在风里轻轻抖着，像忍着没把周末的热闹提前说出来。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 3) {
      openDialogue([
        { speaker: "公告栏", text: "春季风铃集会的告示还贴在那里。今天风更大了，纸角会比昨天更勤快地轻响。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (!state.noticeReadDay2) {
        openDialogue(
          [
            { speaker: "公告栏", text: "本周末将举行春季风铃集会。桥边会挂起新的风铃与布带，等第一阵黄昏的风从河面上来。" },
            { speaker: "旁白", text: "纸页边缘被风掀起一点，像有人已经提前把周末的声音贴在了广场中央。" },
          ],
          () => {
            state.noticeReadDay2 = true;
            setObjective("去面包房找林麦，她今天像比昨天更忙。", "linmai");
            showToast("新的消息：春季风铃集会要来了");
          },
        );
        return;
      }

      openDialogue([
        { speaker: "公告栏", text: "春季风铃集会的告示安安稳稳贴着。白天风经过时，那张纸会轻轻响一下。" },
      ]);
      return;
    }

    openDialogue([
      { speaker: "公告栏", text: "本周末将举行春季风铃集会。若天气温柔，风会替我们把铃声带过桥去。" },
    ]);
  }

  function inspectTable() {
    if (state.currentDayIndex === 7) {
      openDialogue([
        { speaker: "旁白", text: "白布小桌今天终于摆满了：蜂蜜小卷、热茶、名签、花束，还有留给迟到来客的一小摞空纸签。它看起来已经不是在等待，而是在迎人了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 6) {
      openDialogue([
        { speaker: "旁白", text: "白布小桌上放着包好的小甜卷、客人名签和几段备用灯芯。连桌角也像知道，明天终于真的要热闹起来了。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 5) {
      openDialogue([
        { speaker: "旁白", text: "白布小桌上摆着剪子、麻绳和几段剩下的布条，连空着的地方都像在替周末预留热闹。" },
      ]);
      return;
    }

    if (state.currentDayIndex === 4) {
      openDialogue([{ speaker: "旁白", text: "雨天里广场安静了些，白布小桌也像把热闹先收起来，等天晴了再继续铺开。" }]);
      return;
    }

    if (state.currentDayIndex === 3) {
      openDialogue([{ speaker: "旁白", text: "今天白布小桌空着，像在等周末真正热闹起来时，再摆满点心和花束。" }]);
      return;
    }

    if (state.currentDayIndex === 2) {
      if (state.questBreadDay2Accepted && !state.breadDay2Delivered) {
        openDialogue(
          [
            { speaker: "旁白", text: "你把第二篮点心轻轻放上白布小桌。今天的甜味和新告示站在了一起。" },
            { speaker: "旁白", text: "广场上的风像也停了一瞬，像在替周末先尝一口热闹。" },
          ],
          () => {
            state.breadDay2Delivered = true;
            setObjective("回面包房找林麦。", "linmai");
            showToast("第二篮点心已经送到广场");
          },
        );
        return;
      }

      if (state.breadDay2Delivered) {
        openDialogue([{ speaker: "旁白", text: "白布小桌旁边多了告示和点心，广场看起来像比昨天更像节日一点。" }]);
        return;
      }

      openDialogue([{ speaker: "旁白", text: "桌边已经摆好了地方，像在等今天新的香味和消息一起落下来。" }]);
      return;
    }

    if (state.questBreadAccepted && !state.breadDelivered) {
      openDialogue(
        [
          { speaker: "旁白", text: "你把第一篮还温热着的点心轻轻放在了白布小桌上。" },
          { speaker: "旁白", text: "春莓和奶香开始从广场往四周慢慢散开。" },
        ],
        () => {
          state.breadDelivered = true;
          setObjective("回面包房找林麦。", "linmai");
          showToast("点心已经送到广场");
        },
      );
      return;
    }

    if (state.breadDelivered) {
      openDialogue([{ speaker: "旁白", text: "篮子已经摆稳了，白布上还留着一点暖烘烘的香味。" }]);
      return;
    }

    openDialogue([{ speaker: "旁白", text: "白布铺得很平整，像在等一件热乎乎的事。" }]);
  }

  function inspectGate() {
    if (state.currentDayIndex === 1) {
      if (!state.bridgeSceneDone) {
        openDialogue([{ speaker: "旁白", text: "天还早，先在村里走走。这里的风还没把今天讲完。" }]);
        return;
      }

      state.unlockedDay = Math.max(state.unlockedDay, 2);
      setTimeSlot("夜晚");
      showDayNote(
        "傍晚的风先碰到布条，再轻轻碰到了桥边的铃。",
        "next-day",
        "进入第二天",
      );
      return;
    }

    if (state.currentDayIndex === 2 && !state.bridgeDay2Done) {
      openDialogue([{ speaker: "旁白", text: "今天的告示和风声都还没收好，先别急着回去。" }]);
      return;
    }

    if (state.currentDayIndex === 2) {
      state.unlockedDay = Math.max(state.unlockedDay, 3);
      setTimeSlot("夜晚");
      showDayNote(
        "广场上的新纸已经贴稳了，桥边的风也开始替周末练习第一声铃响。",
        "next-day-3",
        "进入第三天",
      );
      return;
    }

    if (state.currentDayIndex === 3 && !state.bridgeDay3Done) {
      openDialogue([{ speaker: "旁白", text: "旧风铃那一声还没真正收住，先别急着回去。" }]);
      return;
    }

    if (state.currentDayIndex === 3) {
      state.unlockedDay = Math.max(state.unlockedDay, 4);
      setTimeSlot("夜晚");
      showDayNote(
        "旧风铃终于补上了那半句，桥边的声音也第一次像在认真等待周末。",
        "next-day-4",
        "进入第四天",
      );
      return;
    }

    if (state.currentDayIndex === 4 && !state.bridgeDay4Done) {
      openDialogue([{ speaker: "旁白", text: "这场雨还没把今天想说的话讲完，先别急着回去。" }]);
      return;
    }

    if (state.currentDayIndex === 4) {
      state.unlockedDay = Math.max(state.unlockedDay, 5);
      setTimeSlot("夜晚");
      showDayNote(
        "细雨把村里的声音都压低了，却也替明天重新热起来的忙碌腾出了一点空白。",
        "next-day-5",
        "进入第五天",
      );
      return;
    }

    if (state.currentDayIndex === 5 && !state.bridgeDay5Done) {
      openDialogue([{ speaker: "旁白", text: "桥边这阵重新热起来的风还没收住，先别急着回去。" }]);
      return;
    }

    if (state.currentDayIndex === 5) {
      state.unlockedDay = Math.max(state.unlockedDay, 6);
      setTimeSlot("夜晚");
      showDayNote(
        "雨后的安静慢慢退开了，桥边新绑上的布条先替周末亮了起来。明天就是节日前夜。",
        "next-day-6",
        "进入第六天",
      );
      return;
    }

    if (state.currentDayIndex === 6 && !state.bridgeDay6Done) {
      openDialogue([{ speaker: "旁白", text: "桥灯刚刚试亮，今晚这句“快到了”还没真正落稳。" }]);
      return;
    }

    if (state.currentDayIndex === 6) {
      state.unlockedDay = Math.max(state.unlockedDay, 7);
      setTimeSlot("夜晚");
      showDayNote(
        "节日前夜，桥灯先亮了一遍，布条、铃声和风都已经站到明天之前。明天就是风铃集会。",
        "next-day-7",
        "进入第七天",
      );
      return;
    }

    if (!state.bridgeDay7Done) {
      openDialogue([{ speaker: "旁白", text: "集会还在桥边发着亮，先别急着回去。" }]);
      return;
    }

    state.demoFinished = true;
    state.unlockedDay = DAY_TOTAL;
    setTimeSlot("夜晚");
    showDayNote(
      "风铃集会当天，第一声终于真正为人群响起来了。这一周等来的春天，也在桥边完整落下。七天试玩已经完整走完。",
      "show-ending",
      "查看试玩总结",
    );
  }

  function inspectBellPoint(pointId) {
    if (state.currentDayIndex !== 3 || !state.bellIssueSeenDay3 || state.bellTestReportedDay3) {
      return;
    }

    if (pointId === "listen-left") {
      openDialogue(
        [
          { speaker: "旁白", text: "你站到桥左侧木桩边。这里的铃声轻一些，像刚醒过来的第一口气。" },
        ],
        () => {
          state.bellListenLeftDone = true;
          updateBellObjective();
          showToast("已记下左侧的声音");
        },
      );
      return;
    }

    if (pointId === "listen-center") {
      openDialogue(
        [
          { speaker: "旁白", text: "你站到桥中央。这里的声音最稳，像风真的找到了该经过的地方。" },
        ],
        () => {
          state.bellListenCenterDone = true;
          updateBellObjective();
          showToast("已记下桥中央的声音");
        },
      );
      return;
    }

    openDialogue(
      [
        { speaker: "旁白", text: "你站到右侧栏边。这里的尾音拖得更长，却像还差一点才肯落稳。" },
      ],
      () => {
        state.bellListenRightDone = true;
        updateBellObjective();
        showToast("已记下右侧的声音");
      },
    );
  }

  function inspectSeedBox() {
    if (state.currentDayIndex !== 4 || !state.seedQuestAcceptedDay4 || state.seedFoundDay4) {
      return;
    }

    openDialogue(
      [
        { speaker: "旁白", text: "你蹲下翻开药草棚后的旧木箱。里面有干花、旧绳、几包种子和写了字的小纸片。" },
        { speaker: "旁白", text: "其中一包纸边缝着一点蓝线，像专门在等人把它从雨天里认出来。" },
      ],
      () => {
        state.seedFoundDay4 = true;
        setObjective("把“雨后铃兰”种子拿去还给秦婆婆。", "qin");
        showToast("找到：雨后铃兰种子");
      },
    );
  }

  function inspectRibbonPoint(pointId) {
    if (state.currentDayIndex !== 5 || !state.ribbonQuestAcceptedDay5 || state.ribbonTaskReturnedDay5) {
      return;
    }

    if (pointId === "ribbon-blue") {
      openDialogue(
        [
          { speaker: "旁白", text: "你把晴蓝布条系到桥左侧挂绳上。它先碰到一点潮润的风，像把昨天的雨意轻轻翻过去了。" },
        ],
        () => {
          state.ribbonBlueDoneDay5 = true;
          updateRibbonObjective();
          showToast("已系好：晴蓝布条");
        },
      );
      return;
    }

    if (pointId === "ribbon-white") {
      openDialogue(
        [
          { speaker: "旁白", text: "你把米白布条系在桥中央。它垂下来时很安静，可一抬头就已经像在等风先来认领。" },
        ],
        () => {
          state.ribbonWhiteDoneDay5 = true;
          updateRibbonObjective();
          showToast("已系好：米白布条");
        },
      );
      return;
    }

    openDialogue(
      [
        { speaker: "旁白", text: "你把杏黄布条系上右侧木栏。尾端一垂下去，桥边忽然就比刚才更像节日了一点。" },
      ],
      () => {
        state.ribbonGoldDoneDay5 = true;
        updateRibbonObjective();
        showToast("已系好：杏黄布条");
      },
    );
  }

  function inspectLanternPoint(pointId) {
    if (state.currentDayIndex !== 6 || !state.lanternQuestAcceptedDay6 || state.lanternTaskReturnedDay6) {
      return;
    }

    if (pointId === "lantern-left") {
      openDialogue(
        [
          { speaker: "旁白", text: "你点亮左侧桥灯。暖黄的火一下子攀上木柱边缘，像先替今晚说了一句“欢迎回来”。" },
        ],
        () => {
          state.lanternLeftDoneDay6 = true;
          updateLanternObjective();
          showToast("已点亮：左侧桥灯");
        },
      );
      return;
    }

    if (pointId === "lantern-center") {
      openDialogue(
        [
          { speaker: "旁白", text: "桥心提灯亮起来时，光落在木板和水面之间，像先替明晚把路试着照了一遍。" },
        ],
        () => {
          state.lanternCenterDoneDay6 = true;
          updateLanternObjective();
          showToast("已点亮：桥心提灯");
        },
      );
      return;
    }

    openDialogue(
      [
        { speaker: "旁白", text: "右侧桥灯也亮了。整段桥身的影子一下柔和下来，像真的准备好在明晚迎人了。" },
      ],
      () => {
        state.lanternRightDoneDay6 = true;
        updateLanternObjective();
        showToast("已点亮：右侧桥灯");
      },
    );
  }

  function inspectWishPoint(pointId) {
    if (state.currentDayIndex !== 7 || !state.festivalTagsReadyDay7 || allFestivalWishTagsDone()) {
      return;
    }

    if (pointId === "wish-left") {
      openDialogue(
        [
          { speaker: "旁白", text: "你把林麦那句“愿来的人都先闻见甜香，再听见铃响”挂上左侧风记绳。纸签一垂下来，风就先碰了碰它。" },
        ],
        () => {
          state.festivalWishLeftDoneDay7 = true;
          if (allFestivalWishTagsDone()) {
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边，听风铃集会真正响起的第一声。", "shenyan");
            showToast("三张风记签都挂好了");
            return;
          }
          updateFestivalObjective();
          showToast("已挂上：林麦的风记签");
        },
      );
      return;
    }

    if (pointId === "wish-center") {
      openDialogue(
        [
          { speaker: "旁白", text: "你把许槐那句“愿这座桥把每一步都接稳”挂在桥心。纸签轻轻晃了一下，像先替来客试了试脚步。" },
        ],
        () => {
          state.festivalWishCenterDoneDay7 = true;
          if (allFestivalWishTagsDone()) {
            setTimeSlot("傍晚");
            setObjective("傍晚去桥边，听风铃集会真正响起的第一声。", "shenyan");
            showToast("三张风记签都挂好了");
            return;
          }
          updateFestivalObjective();
          showToast("已挂上：许槐的风记签");
        },
      );
      return;
    }

    openDialogue(
      [
        { speaker: "旁白", text: "你把秦婆婆那句“愿春天的好事落在人肩上都轻一点”挂到右侧水边。纸签挨着河风，像一下就知道自己该往哪边看了。" },
      ],
      () => {
        state.festivalWishRightDoneDay7 = true;
        if (allFestivalWishTagsDone()) {
          setTimeSlot("傍晚");
          setObjective("傍晚去桥边，听风铃集会真正响起的第一声。", "shenyan");
          showToast("三张风记签都挂好了");
          return;
        }
        updateFestivalObjective();
        showToast("已挂上：秦婆婆的风记签");
      },
    );
  }

  function handleInteraction() {
    if (isModalOpen()) {
      return;
    }

    if (state.noteOpen) {
      return;
    }

    if (state.dialogueOpen) {
      advanceDialogue();
      return;
    }

    const target = nearestTarget();
    if (!target) {
      return;
    }

    switch (target.id) {
      case "azhi":
        talkAzhi();
        break;
      case "linmai":
        talkLinmai();
        break;
      case "shenyan":
        talkShenyan();
        break;
      case "xuhuai":
        talkXuhuai();
        break;
      case "qin":
        talkQin();
        break;
      case "notice":
        inspectNotice();
        break;
      case "table":
        inspectTable();
        break;
      case "listen-left":
      case "listen-center":
      case "listen-right":
        inspectBellPoint(target.id);
        break;
      case "seed-box":
        inspectSeedBox();
        break;
      case "ribbon-blue":
      case "ribbon-white":
      case "ribbon-gold":
        inspectRibbonPoint(target.id);
        break;
      case "lantern-left":
      case "lantern-center":
      case "lantern-right":
        inspectLanternPoint(target.id);
        break;
      case "wish-left":
      case "wish-center":
      case "wish-right":
        inspectWishPoint(target.id);
        break;
      case "shared-traces":
        openSharedTraceModal(true);
        break;
      case "gate":
        inspectGate();
        break;
      default:
        break;
    }
  }

  function updateMovement(now) {
    if (!player.moving) {
      return;
    }

    const elapsed = now - player.moveStart;
    const t = Math.min(1, elapsed / WALK_MS);
    player.drawX = player.fromX + (player.toX - player.fromX) * t;
    player.drawY = player.fromY + (player.toY - player.fromY) * t;
    if (t >= 1) {
      player.moving = false;
      player.drawX = player.toX;
      player.drawY = player.toY;
      syncSharedTracesUi();
      persistProgress();
    }
  }

  function paletteForTerrain(x, y) {
    const variant = (x * 13 + y * 7) % 3;
    if (variant === 0) {
      return { base: "#9fbf7b", dark: "#7c9d65", light: "#b8d093" };
    }
    if (variant === 1) {
      return { base: "#97b675", dark: "#72935c", light: "#accb88" };
    }
    return { base: "#90b06f", dark: "#6c8d57", light: "#a8c683" };
  }

  function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }

  function drawTerrain(now) {
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const key = tileKey(x, y);
        if (world.water.has(key)) {
          drawTile(x, y, "#5f8bab");
          ctx.fillStyle = "#79a9c3";
          if ((Math.floor(now / 220) + x + y) % 3 === 0) {
            ctx.fillRect(x * TILE + 2, y * TILE + 4, 8, 1);
            ctx.fillRect(x * TILE + 7, y * TILE + 10, 6, 1);
          }
          ctx.fillStyle = "#4b7493";
          ctx.fillRect(x * TILE, y * TILE + 13, TILE, 3);
          continue;
        }

        if (world.square.has(key)) {
          drawTile(x, y, "#cbb89f");
          ctx.fillStyle = "#b1987a";
          ctx.fillRect(x * TILE, y * TILE, TILE, 1);
          ctx.fillRect(x * TILE, y * TILE, 1, TILE);
          ctx.fillRect(x * TILE + 8, y * TILE + 8, 1, 8);
          continue;
        }

        if (world.path.has(key)) {
          drawTile(x, y, "#b78f62");
          ctx.fillStyle = "#a77e57";
          ctx.fillRect(x * TILE, y * TILE + 13, TILE, 3);
          ctx.fillRect(x * TILE + 3, y * TILE + 4, 2, 2);
          ctx.fillRect(x * TILE + 11, y * TILE + 8, 2, 2);
          continue;
        }

        const palette = paletteForTerrain(x, y);
        drawTile(x, y, palette.base);
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x * TILE + 3, y * TILE + 4, 2, 3);
        ctx.fillRect(x * TILE + 11, y * TILE + 9, 2, 2);
        ctx.fillStyle = palette.light;
        ctx.fillRect(x * TILE + 9, y * TILE + 3, 2, 2);
      }
    }

    world.bridge.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      drawTile(x, y, "#906747");
      ctx.fillStyle = "#6f4c32";
      ctx.fillRect(x * TILE, y * TILE, TILE, 2);
      ctx.fillRect(x * TILE, y * TILE + 14, TILE, 2);
      ctx.fillStyle = "#a57b57";
      ctx.fillRect(x * TILE + 2, y * TILE + 4, 12, 2);
      ctx.fillRect(x * TILE + 2, y * TILE + 9, 12, 2);
    });
  }

  function drawTree(x, y, now) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = "#6c513a";
    ctx.fillRect(px + 8, py + 12, 8, 12);
    const sway = Math.sin(now / 550 + x) * 0.4;
    ctx.fillStyle = "#5f8d4f";
    ctx.fillRect(px + 2 + sway, py + 2, 18, 12);
    ctx.fillRect(px, py + 8, 22, 10);
    ctx.fillStyle = "#74a25f";
    ctx.fillRect(px + 4 + sway, py + 4, 12, 4);
    ctx.fillRect(px + 6, py + 10, 10, 4);
  }

  function drawBakery(now) {
    const px = TILE;
    const py = 2 * TILE;
    ctx.fillStyle = "#7c5b42";
    ctx.fillRect(px, py + 18, 64, 30);
    ctx.fillStyle = "#487044";
    ctx.fillRect(px + 2, py + 20, 60, 26);
    ctx.fillStyle = "#a37a58";
    ctx.fillRect(px - 2, py + 2, 68, 20);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#b68f66" : "#8c6448";
      ctx.fillRect(px + i * 14, py + 4, 10, 16);
    }
    ctx.fillStyle = "#5a3f2f";
    ctx.fillRect(px + 28, py + 28, 16, 18);
    ctx.fillStyle = "#d0b48d";
    ctx.fillRect(px + 31, py + 31, 10, 12);
    ctx.fillStyle = "#8d6d4e";
    ctx.fillRect(px + 32, py + 16, 18, 12);
    ctx.fillStyle = "#f1e5cc";
    ctx.fillRect(px + 35, py + 19, 12, 6);
    ctx.fillStyle = "#835d42";
    ctx.fillRect(px + 52, py + 2, 8, 10);
    const smoke = Math.sin(now / 420) * 1.5;
    ctx.fillStyle = "rgba(252, 248, 240, 0.7)";
    ctx.fillRect(px + 55 + smoke, py - 4, 5, 5);
    ctx.fillRect(px + 58 - smoke, py - 10, 4, 4);
    if (state.currentDayIndex >= 2) {
      ctx.fillStyle = "#8e6848";
      ctx.fillRect(px + 48, py + 32, 12, 10);
      ctx.fillStyle = "#ddbb6d";
      ctx.fillRect(px + 50, py + 30, 8, 3);
    }
  }

  function drawHerbShed() {
    if (state.currentDayIndex < 4) {
      return;
    }

    const px = 9 * TILE;
    const py = TILE;
    ctx.fillStyle = "#7c5b42";
    ctx.fillRect(px, py + 10, 30, 20);
    ctx.fillStyle = "#6c8a60";
    ctx.fillRect(px + 2, py + 12, 26, 16);
    ctx.fillStyle = "#9b744f";
    ctx.fillRect(px - 2, py + 4, 34, 10);
    ctx.fillStyle = "#f0e7d4";
    ctx.fillRect(px + 8, py + 15, 12, 7);
    ctx.fillStyle = "#7a5b41";
    ctx.fillRect(px + 14, py + 20, 2, 8);

    const boxX = 10 * TILE;
    const boxY = 2 * TILE;
    ctx.fillStyle = "#7a5b41";
    ctx.fillRect(boxX + 3, boxY + 7, 10, 7);
    ctx.fillStyle = "#9c7650";
    ctx.fillRect(boxX + 2, boxY + 5, 12, 3);
    if (!state.seedFoundDay4) {
      ctx.fillStyle = "#cfd8c6";
      ctx.fillRect(boxX + 6, boxY + 4, 4, 2);
    }
  }

  function drawNoticeBoard() {
    const px = 8 * TILE;
    const py = 4 * TILE;
    ctx.fillStyle = "#6c513a";
    ctx.fillRect(px + 4, py + 8, 3, 12);
    ctx.fillRect(px + 10, py + 8, 3, 12);
    ctx.fillStyle = "#9b744f";
    ctx.fillRect(px + 1, py + 2, 14, 10);
    ctx.fillStyle = "#f0e7d4";
    ctx.fillRect(px + 3, py + 4, 10, 6);
    if (state.currentDayIndex >= 2) {
      ctx.fillStyle = "#f5edd7";
      ctx.fillRect(px + 6, py + 1, 8, 5);
      ctx.fillStyle = "#cf7c60";
      ctx.fillRect(px + 10, py + 1, 2, 2);
      if (state.noticeReadDay2) {
        ctx.fillStyle = "#7b9b72";
        ctx.fillRect(px + 2, py + 1, 3, 8);
      }
    }
    if (state.currentDayIndex >= 5) {
      ctx.fillStyle = "#efe3c3";
      ctx.fillRect(px + 1, py + 10, 13, 4);
      ctx.fillStyle = "#7aa091";
      ctx.fillRect(px + 11, py + 10, 2, 2);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 3, py + 10, 2, 2);
    }
    if (state.currentDayIndex >= 6) {
      ctx.fillStyle = "#f6efd8";
      ctx.fillRect(px + 2, py - 3, 11, 3);
      ctx.fillStyle = "#d58f73";
      ctx.fillRect(px + 3, py - 2, 2, 2);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 9, py - 2, 2, 2);
    }
    if (state.currentDayIndex >= 7) {
      ctx.fillStyle = "#fff5de";
      ctx.fillRect(px, py - 6, 16, 3);
      ctx.fillStyle = "#cf7c60";
      ctx.fillRect(px + 1, py - 5, 3, 1);
      ctx.fillStyle = "#7aa091";
      ctx.fillRect(px + 6, py - 5, 3, 1);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 11, py - 5, 3, 1);
    }
  }

  function drawTable() {
    const px = 9 * TILE;
    const py = 7 * TILE;
    const tableFilled =
      (state.currentDayIndex === 1 && state.breadDelivered) ||
      (state.currentDayIndex === 2 && state.breadDay2Delivered);
    const tableEmptyGlow =
      (state.currentDayIndex === 1 && !state.breadDelivered) ||
      (state.currentDayIndex === 2 && !state.breadDay2Delivered);

    ctx.fillStyle = "#7a573d";
    ctx.fillRect(px + 3, py + 9, 2, 7);
    ctx.fillRect(px + 11, py + 9, 2, 7);
    ctx.fillStyle = "#eadfc9";
    ctx.fillRect(px + 1, py + 5, 14, 6);
    if (tableEmptyGlow) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
      ctx.fillRect(px + 5, py + 6, 6, 4);
    }
    if (tableFilled) {
      ctx.fillStyle = "#8d6846";
      ctx.fillRect(px + 5, py + 4, 7, 5);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 6, py + 3, 5, 3);
      if (state.currentDayIndex === 2) {
        ctx.fillStyle = "#cf7c60";
        ctx.fillRect(px + 2, py + 4, 2, 5);
      }
    }
    if (state.currentDayIndex >= 5) {
      ctx.fillStyle = "#8d6846";
      ctx.fillRect(px + 4, py + 4, 4, 4);
      ctx.fillStyle = "#d58f73";
      ctx.fillRect(px + 5, py + 3, 2, 3);
      ctx.fillStyle = "#7aa091";
      ctx.fillRect(px + 9, py + 4, 3, 2);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 10, py + 3, 2, 3);
      ctx.strokeStyle = "#6f523a";
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 5);
      ctx.lineTo(px + 14, py + 7);
      ctx.moveTo(px + 14, py + 5);
      ctx.lineTo(px + 12, py + 7);
      ctx.stroke();
    }
    if (state.currentDayIndex === 6) {
      ctx.fillStyle = "#a77955";
      ctx.fillRect(px + 8, py + 3, 4, 4);
      ctx.fillStyle = "#f0e3c7";
      ctx.fillRect(px + 9, py + 2, 2, 2);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 3, py + 8, 2, 2);
      ctx.fillRect(px + 6, py + 8, 2, 2);
      ctx.fillRect(px + 9, py + 8, 2, 2);
    }
    if (state.currentDayIndex === 7) {
      ctx.fillStyle = "#8d6846";
      ctx.fillRect(px + 3, py + 2, 10, 4);
      ctx.fillStyle = "#f0e3c7";
      ctx.fillRect(px + 4, py + 1, 2, 2);
      ctx.fillRect(px + 7, py + 1, 2, 2);
      ctx.fillRect(px + 10, py + 1, 2, 2);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 3, py + 7, 2, 2);
      ctx.fillRect(px + 6, py + 7, 2, 2);
      ctx.fillRect(px + 9, py + 7, 2, 2);
      ctx.fillStyle = "#d58f73";
      ctx.fillRect(px + 12, py + 7, 2, 2);
    }
  }

  function drawGate() {
    const px = TILE;
    const py = 12 * TILE;
    ctx.fillStyle = "#6b523b";
    ctx.fillRect(px + 3, py + 3, 10, 10);
    ctx.fillStyle = "#f1e7d3";
    ctx.fillRect(px + 4, py + 5, 8, 5);
  }

  function drawFlowers() {
    world.flowers.forEach((flower) => {
      const px = flower.x * TILE;
      const py = flower.y * TILE;
      ctx.fillStyle = "#60874e";
      ctx.fillRect(px + 7, py + 9, 2, 5);
      ctx.fillStyle = flower.color;
      ctx.fillRect(px + 5, py + 6, 2, 2);
      ctx.fillRect(px + 9, py + 6, 2, 2);
      ctx.fillRect(px + 7, py + 4, 2, 2);
    });
  }

  function drawReeds() {
    world.reeds.forEach((reed) => {
      const px = reed.x * TILE;
      const py = reed.y * TILE;
      ctx.fillStyle = "#6b8e59";
      ctx.fillRect(px + 5, py + 6, 1, 7);
      ctx.fillRect(px + 8, py + 4, 1, 9);
      ctx.fillRect(px + 11, py + 7, 1, 6);
    });
  }

  function drawLamps(now) {
    world.lamps.forEach((lamp) => {
      const px = lamp.x * TILE;
      const py = lamp.y * TILE;
      const daySixLit =
        state.currentDayIndex === 6 &&
        ((lamp.x === 11 && state.lanternLeftDoneDay6) || (lamp.x === 14 && state.lanternRightDoneDay6));
      if (state.timeSlot === "傍晚" || state.timeSlot === "夜晚" || daySixLit) {
        const glow = 7 + Math.sin(now / 300 + lamp.x) * 1.5;
        ctx.fillStyle =
          state.timeSlot === "傍晚" || state.timeSlot === "夜晚"
            ? "rgba(241, 191, 109, 0.12)"
            : "rgba(241, 191, 109, 0.08)";
        ctx.beginPath();
        ctx.arc(px + 8, py + 4, glow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#6f523a";
      ctx.fillRect(px + 7, py + 7, 2, 9);
      ctx.fillStyle = "#f0bf6d";
      ctx.fillRect(px + 6, py + 3, 4, 4);
    });
  }

  function drawFestivalPrep(now) {
    if (state.currentDayIndex < 2) {
      return;
    }

    const px = 11 * TILE;
    const py = 9 * TILE;
    const sway = Math.sin(now / 280) * 1.5;
    ctx.fillStyle = "#7a5b41";
    ctx.fillRect(px + 4, py - 10, 1, 12);
    ctx.fillRect(px + 18, py - 10, 1, 12);
    ctx.strokeStyle = "#8f6c53";
    ctx.beginPath();
    ctx.moveTo(px + 4, py - 9);
    ctx.lineTo(px + 18, py - 9);
    ctx.stroke();

    ctx.fillStyle = "#d58f73";
    ctx.fillRect(px + 7, py - 8 + sway, 3, 4);
    ctx.fillStyle = "#f0e3c7";
    ctx.fillRect(px + 11, py - 7 - sway * 0.4, 3, 4);
    ctx.fillStyle = "#7aa091";
    ctx.fillRect(px + 15, py - 8 + sway * 0.7, 3, 4);

    if (state.currentDayIndex >= 3) {
      ctx.fillStyle = "#7a5b41";
      ctx.fillRect(px + 12, py - 2, 1, 8);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 11, py + 4, 3, 3);
      ctx.fillStyle = state.bellTestReportedDay3 ? "#f0bf6d" : "#c98b6c";
      ctx.fillRect(px + 11, py + 6, 3, 2);

      if (state.currentDayIndex === 3 && state.bellIssueSeenDay3 && !state.bellTestReportedDay3) {
        const markers = [
          { x: 10, y: 10, done: state.bellListenLeftDone },
          { x: 12, y: 10, done: state.bellListenCenterDone },
          { x: 14, y: 10, done: state.bellListenRightDone },
        ];
        markers.forEach((marker) => {
          const markerX = marker.x * TILE + 7;
          const markerY = marker.y * TILE + 13;
          ctx.fillStyle = marker.done ? "#7aa091" : "#f0e3c7";
          ctx.fillRect(markerX, markerY, 2, 2);
        });
      }
    }

    if (state.currentDayIndex >= 5) {
      const ribbonStates = [
        {
          active: state.currentDayIndex === 5 ? state.ribbonQuestAcceptedDay5 : state.ribbonBlueDoneDay5,
          done: state.ribbonBlueDoneDay5,
          knotX: 10 * TILE + 8,
          knotY: 10 * TILE + 7,
          color: "#7aa8c3",
          sway: Math.sin(now / 240) * 1.8,
        },
        {
          active: state.currentDayIndex === 5 ? state.ribbonQuestAcceptedDay5 : state.ribbonWhiteDoneDay5,
          done: state.ribbonWhiteDoneDay5,
          knotX: 12 * TILE + 8,
          knotY: 9 * TILE + 12,
          color: "#efe7d7",
          sway: Math.sin(now / 260 + 0.7) * 1.5,
        },
        {
          active: state.currentDayIndex === 5 ? state.ribbonQuestAcceptedDay5 : state.ribbonGoldDoneDay5,
          done: state.ribbonGoldDoneDay5,
          knotX: 15 * TILE + 2,
          knotY: 10 * TILE + 8,
          color: "#d9ae66",
          sway: Math.sin(now / 230 + 1.2) * 2.1,
        },
      ];

      ribbonStates.forEach((ribbon) => {
        ctx.fillStyle = ribbon.done ? "#7a5b41" : "#a48769";
        ctx.fillRect(ribbon.knotX, ribbon.knotY, 2, 2);
        if (!ribbon.active && !ribbon.done) {
          return;
        }
        ctx.fillStyle = ribbon.done ? ribbon.color : "#ddcfb7";
        ctx.fillRect(ribbon.knotX + 2, ribbon.knotY + 1, 2, 5);
        ctx.fillRect(ribbon.knotX + 4 + ribbon.sway, ribbon.knotY + 3, 2, 4);
      });

      if (state.ribbonTaskReturnedDay5) {
        ctx.fillStyle = "#d58f73";
        ctx.fillRect(px + 5, py - 12, 2, 4);
        ctx.fillStyle = "#efe7d7";
        ctx.fillRect(px + 9, py - 11, 2, 4);
        ctx.fillStyle = "#d9ae66";
        ctx.fillRect(px + 13, py - 12, 2, 4);
      }
    }

    if (state.currentDayIndex >= 6) {
      const lanternStates = [
        {
          active: state.currentDayIndex === 6 ? state.lanternQuestAcceptedDay6 : state.lanternLeftDoneDay6,
          done: state.lanternLeftDoneDay6,
          x: 11 * TILE + 7,
          y: 9 * TILE + 2,
        },
        {
          active: state.currentDayIndex === 6 ? state.lanternQuestAcceptedDay6 : state.lanternCenterDoneDay6,
          done: state.lanternCenterDoneDay6,
          x: 12 * TILE + 7,
          y: 10 * TILE + 2,
        },
        {
          active: state.currentDayIndex === 6 ? state.lanternQuestAcceptedDay6 : state.lanternRightDoneDay6,
          done: state.lanternRightDoneDay6,
          x: 14 * TILE + 7,
          y: 9 * TILE + 2,
        },
      ];

      lanternStates.forEach((lantern, index) => {
        ctx.fillStyle = "#6f523a";
        ctx.fillRect(lantern.x, lantern.y, 3, 5);
        ctx.fillStyle = lantern.done ? "#f0bf6d" : lantern.active ? "#d7c5a3" : "#8b715a";
        ctx.fillRect(lantern.x + 1, lantern.y + 1, 1, 3);

        const lanternLit =
          state.timeSlot === "傍晚" ||
          state.timeSlot === "夜晚" ||
          (state.currentDayIndex === 6 && lantern.done);

        if (lantern.done && lanternLit) {
          const glow = 5 + Math.sin(now / 260 + index) * 1.2;
          const glowOpacity = state.timeSlot === "傍晚" ? 0.16 : 0.08;
          ctx.fillStyle = `rgba(241, 191, 109, ${glowOpacity})`;
          ctx.beginPath();
          ctx.ellipse(lantern.x + 1.5, lantern.y + 2.5, glow, glow - 1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (state.lanternTaskReturnedDay6) {
        ctx.fillStyle = "#f0e3c7";
        ctx.fillRect(px + 6, py - 14, 2, 3);
        ctx.fillRect(px + 10, py - 13, 2, 3);
        ctx.fillRect(px + 14, py - 14, 2, 3);
      }
    }

    if (state.currentDayIndex >= 7) {
      ctx.strokeStyle = "#b88f73";
      ctx.beginPath();
      ctx.moveTo(px + 2, py - 13);
      ctx.lineTo(px + 20, py - 13);
      ctx.stroke();

      const wishStates = [
        {
          active: state.festivalTagsReadyDay7,
          done: state.festivalWishLeftDoneDay7,
          x: 10 * TILE + 7,
          y: 10 * TILE + 5,
          color: "#d58f73",
        },
        {
          active: state.festivalTagsReadyDay7,
          done: state.festivalWishCenterDoneDay7,
          x: 12 * TILE + 7,
          y: 10 * TILE + 5,
          color: "#f0e3c7",
        },
        {
          active: state.festivalTagsReadyDay7,
          done: state.festivalWishRightDoneDay7,
          x: 14 * TILE + 7,
          y: 10 * TILE + 5,
          color: "#9ab7a0",
        },
      ];

      wishStates.forEach((wish) => {
        ctx.fillStyle = "#7a5b41";
        ctx.fillRect(wish.x + 1, wish.y - 4, 1, 4);
        if (!wish.active && !wish.done) {
          return;
        }
        ctx.fillStyle = wish.done ? wish.color : "#e7dcc7";
        ctx.fillRect(wish.x, wish.y, 3, 4);
        ctx.fillStyle = "#a87a5a";
        ctx.fillRect(wish.x + 1, wish.y - 1, 1, 1);
      });

      if (state.timeSlot === "傍晚") {
        ctx.fillStyle = "rgba(250, 217, 156, 0.08)";
        ctx.beginPath();
        ctx.ellipse(px + 12, py + 2, 30, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function sharedTraceColorHex(name) {
    switch (name) {
      case "晴蓝":
        return "#7aa8c3";
      case "米白":
        return "#efe7d7";
      case "杏黄":
        return "#d9ae66";
      case "苔绿":
        return "#87a26f";
      case "晚霞粉":
        return "#d58f73";
      default:
        return "#efe7d7";
    }
  }

  function drawSharedBridgeTraces(now) {
    if (!sharedTracesUnlocked() || !sharedWorldState.traces.length) {
      return;
    }

    const anchorY = 9 * TILE - 17;
    const anchorXs = [10 * TILE + 6, 11 * TILE + 3, 12 * TILE + 8, 13 * TILE + 5, 14 * TILE + 2, 15 * TILE - 2];
    ctx.strokeStyle = "rgba(122, 91, 65, 0.78)";
    ctx.beginPath();
    ctx.moveTo(anchorXs[0] - 3, anchorY);
    ctx.lineTo(anchorXs[Math.min(anchorXs.length - 1, sharedWorldState.traces.length)] + 6, anchorY + 1);
    ctx.stroke();

    sharedWorldState.traces.slice(0, anchorXs.length).forEach((trace, index) => {
      const sway = Math.sin(now / 260 + index * 0.8) * 1.4;
      const x = anchorXs[index];
      const y = anchorY + 3 + (index % 2 === 0 ? 0 : 1);
      ctx.fillStyle = "#7a5b41";
      ctx.fillRect(x + 1, y - 3, 1, 4);
      ctx.fillStyle = sharedTraceColorHex(trace.ribbonColor);
      ctx.fillRect(x + sway, y, 3, 4);
      ctx.fillStyle = "rgba(255, 249, 239, 0.72)";
      ctx.fillRect(x + 1 + sway, y + 1, 1, 1);
    });
  }

  function drawFestivalAtmosphere(now) {
    if (state.currentDayIndex !== 7) {
      return;
    }

    ctx.fillStyle = "rgba(247, 220, 164, 0.08)";
    ctx.beginPath();
    ctx.ellipse(8 * TILE + 8, 6 * TILE + 18, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(247, 220, 164, 0.07)";
    ctx.beginPath();
    ctx.ellipse(12 * TILE + 10, 10 * TILE + 4, 42, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a77955";
    ctx.fillRect(6 * TILE + 3, 7 * TILE + 12, 22, 3);
    ctx.fillStyle = "#cf7c60";
    ctx.fillRect(6 * TILE + 5, 7 * TILE + 11, 4, 2);
    ctx.fillStyle = "#7aa091";
    ctx.fillRect(6 * TILE + 11, 7 * TILE + 11, 4, 2);
    ctx.fillStyle = "#d9ae66";
    ctx.fillRect(6 * TILE + 17, 7 * TILE + 11, 4, 2);

    const bits = [
      { speed: 72, offset: 12, baseY: 18, color: "#f0e3c7" },
      { speed: 68, offset: 44, baseY: 32, color: "#d58f73" },
      { speed: 80, offset: 76, baseY: 48, color: "#d9ae66" },
      { speed: 74, offset: 108, baseY: 26, color: "#9ab7a0" },
      { speed: 66, offset: 138, baseY: 56, color: "#f0e3c7" },
      { speed: 82, offset: 168, baseY: 42, color: "#d58f73" },
    ];

    bits.forEach((bit, index) => {
      const x = ((now / bit.speed) + bit.offset) % (MAP_W * TILE + 24) - 12;
      const y = bit.baseY + Math.sin(now / 620 + index) * 6;
      ctx.fillStyle = bit.color;
      ctx.fillRect(x, y, 2, 2);
      ctx.fillRect(x + 1, y + 2, 1, 2);
    });
  }

  function drawObjectiveSpark(now) {
    if (!state.objectiveTarget) {
      return;
    }

    const target =
      state.objectiveTarget === "table"
        ? { x: 9, y: 7 }
        : state.objectiveTarget === "notice"
          ? { x: 8, y: 4 }
        : state.objectiveTarget === "gate"
            ? { x: 1, y: 12 }
            : state.objectiveTarget === "seed-box"
              ? { x: 10, y: 2 }
            : state.objectiveTarget === "ribbon-blue"
              ? { x: 10, y: 10 }
              : state.objectiveTarget === "ribbon-white"
                ? { x: 12, y: 9 }
                : state.objectiveTarget === "ribbon-gold"
                  ? { x: 15, y: 10 }
            : state.objectiveTarget === "lantern-left"
              ? { x: 11, y: 9 }
              : state.objectiveTarget === "lantern-center"
                ? { x: 12, y: 10 }
                : state.objectiveTarget === "lantern-right"
                  ? { x: 14, y: 9 }
            : state.objectiveTarget === "wish-left"
              ? { x: 10, y: 10 }
              : state.objectiveTarget === "wish-center"
                ? { x: 12, y: 10 }
                : state.objectiveTarget === "wish-right"
                  ? { x: 14, y: 10 }
            : state.objectiveTarget === "listen-left"
              ? { x: 10, y: 10 }
              : state.objectiveTarget === "listen-center"
                ? { x: 12, y: 10 }
                : state.objectiveTarget === "listen-right"
                  ? { x: 14, y: 10 }
            : state.objectiveTarget === "linmai"
              ? npcs.linmai
              : state.objectiveTarget === "azhi"
                ? npcs.azhi
                : state.objectiveTarget === "xuhuai"
                  ? npcs.xuhuai
                  : state.objectiveTarget === "qin"
                    ? npcs.qin
                : state.objectiveTarget === "shenyan"
                  ? npcs.shenyan
                  : null;

    if (!target) {
      return;
    }

    const pulse = Math.sin(now / 220) * 2;
    const px = target.x * TILE + 8;
    const py = target.y * TILE + 3;
    ctx.fillStyle = "#fff1b2";
    ctx.beginPath();
    ctx.moveTo(px, py - 5 - pulse);
    ctx.lineTo(px + 3, py);
    ctx.lineTo(px, py + 5 - pulse * 0.4);
    ctx.lineTo(px - 3, py);
    ctx.closePath();
    ctx.fill();
  }

  function characterColors(kind) {
    switch (kind) {
      case "player":
        return { hair: "#d9be77", body: "#2f7d6c", accent: "#d9a15f", skin: "#f0d2b5" };
      case "azhi":
        return { hair: "#7b4a8f", body: "#db916f", accent: "#f0c26e", skin: "#f2cfb0" };
      case "linmai":
        return { hair: "#6d513e", body: "#f0ebe0", accent: "#c76458", skin: "#f2d1b1" };
      case "shenyan":
        return { hair: "#c8b06d", body: "#365f7a", accent: "#5a88a9", skin: "#dcb796" };
      case "xuhuai":
        return { hair: "#5e4636", body: "#b1906f", accent: "#6b523b", skin: "#e3c19d" };
      case "qin":
        return { hair: "#d6d0cb", body: "#617d63", accent: "#9ab7a0", skin: "#eed1b8" };
      case "crowd1":
        return { hair: "#6a4d41", body: "#c56e61", accent: "#f0c26e", skin: "#efcfb3" };
      case "crowd2":
        return { hair: "#556446", body: "#7f9b72", accent: "#cfd8c6", skin: "#e9c7a8" };
      case "crowd3":
        return { hair: "#4d4f67", body: "#6f88a7", accent: "#f0e3c7", skin: "#ecccad" };
      case "crowd4":
        return { hair: "#7b5a39", body: "#d0b067", accent: "#8f6c53", skin: "#edcfb1" };
      case "crowd5":
        return { hair: "#5b4a5b", body: "#a77aa0", accent: "#f0c26e", skin: "#f0d2b5" };
      default:
        return { hair: "#6d513e", body: "#758d6e", accent: "#d9a15f", skin: "#f0d2b5" };
    }
  }

  function drawCharacter(entity, now) {
    const colors = characterColors(entity.palette || "player");
    const drawX = entity.drawX !== undefined ? entity.drawX : entity.x;
    const drawY = entity.drawY !== undefined ? entity.drawY : entity.y;
    const bob = Math.sin(now / 360 + drawX * 0.6 + drawY * 0.4) * 0.45;
    const px = drawX * TILE + 2;
    const py = drawY * TILE + 2 + bob;

    ctx.fillStyle = "rgba(35, 25, 18, 0.16)";
    ctx.fillRect(px + 2, py + 12, 10, 3);

    ctx.fillStyle = colors.skin;
    ctx.fillRect(px + 4, py + 2, 6, 4);
    ctx.fillStyle = colors.body;
    ctx.fillRect(px + 3, py + 6, 8, 6);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(px + 4, py + 8, 6, 2);
    ctx.fillStyle = colors.hair;
    ctx.fillRect(px + 3, py, 8, 3);

    if (entity.palette === "player" || entity.palette === "shenyan") {
      ctx.fillStyle = "#d2b160";
      ctx.fillRect(px + 2, py + 1, 10, 2);
    }

    if (entity.palette === "linmai") {
      ctx.fillStyle = "#f0d0b6";
      ctx.fillRect(px + 3, py + 7, 8, 1);
    }

    if (entity.palette === "azhi") {
      ctx.fillStyle = "#f0c26e";
      ctx.fillRect(px + 2, py + 7, 2, 4);
      ctx.fillRect(px + 10, py + 7, 2, 4);
    }

    if (entity.palette === "qin") {
      ctx.fillStyle = "#9ab7a0";
      ctx.fillRect(px + 2, py + 6, 10, 2);
    }

    if (entity.palette === "crowd4") {
      ctx.fillStyle = "#8f6c53";
      ctx.fillRect(px + 2, py + 2, 10, 1);
    }

    ctx.fillStyle = "#4a3425";
    ctx.fillRect(px + 4, py + 12, 2, 3);
    ctx.fillRect(px + 8, py + 12, 2, 3);

    if (entity.palette === "player" && carryingBread()) {
      ctx.fillStyle = "#8d6846";
      ctx.fillRect(px + 2, py - 4, 8, 4);
      ctx.fillStyle = "#d9ae66";
      ctx.fillRect(px + 3, py - 5, 6, 2);
    }
  }

  function festivalCrowdCharacters() {
    if (state.currentDayIndex !== 7) {
      return [];
    }

    return [
      { palette: "crowd1", drawX: 6.1, drawY: 5.9 },
      { palette: "crowd2", drawX: 7.3, drawY: 6.8 },
      { palette: "crowd3", drawX: 9.7, drawY: 6.2 },
      { palette: "crowd4", drawX: 10.4, drawY: 8.8 },
      { palette: "crowd5", drawX: 13.4, drawY: 10.0 },
    ];
  }

  function drawMist(now) {
    const opacity =
      state.currentDayIndex === 4 ? 0.18 : state.timeSlot === "傍晚" ? 0.05 : 0.12;
    ctx.fillStyle = `rgba(255, 251, 242, ${opacity})`;
    for (let i = 0; i < 4; i += 1) {
      const x = ((now / 80) + i * 55) % (MAP_W * TILE + 80) - 40;
      const y = 20 + i * 34 + Math.sin(now / 900 + i) * 6;
      ctx.beginPath();
      ctx.ellipse(x, y, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRain(now) {
    if (state.currentDayIndex !== 4) {
      return;
    }

    ctx.strokeStyle = "rgba(203, 220, 230, 0.44)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 23 + Math.floor(now / 5)) % (MAP_W * TILE + 24) - 12;
      const y = (i * 17 + Math.floor(now / 3)) % (MAP_H * TILE + 20) - 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 6);
      ctx.stroke();
    }
  }

  function drawEveningTint() {
    if (state.timeSlot === "傍晚") {
      if (state.currentDayIndex === 7) {
        ctx.fillStyle = "rgba(244, 184, 108, 0.14)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(83, 61, 84, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (state.currentDayIndex === 6) {
        ctx.fillStyle = "rgba(228, 171, 112, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(54, 64, 90, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "rgba(239, 186, 134, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    if (state.timeSlot === "夜晚") {
      ctx.fillStyle = "rgba(68, 53, 45, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawWorld(now) {
    drawTerrain(now);
    drawFlowers();
    drawReeds();
    drawTree(0, 9, now);
    drawBakery(now);
    drawHerbShed();
    drawNoticeBoard();
    drawTable();
    drawGate();
    drawLamps(now);
    drawFestivalPrep(now);
    drawSharedBridgeTraces(now);
    drawFestivalAtmosphere(now);
    drawObjectiveSpark(now);

    const nearby = nearestTarget();
    if (nearby) {
      const pulse = Math.sin(now / 180) * 1.2;
      ctx.strokeStyle = "rgba(255, 245, 202, 0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        nearby.x * TILE - pulse,
        nearby.y * TILE - pulse,
        TILE + pulse * 2,
        TILE + pulse * 2,
      );
    }

    const characters = [
      ...festivalCrowdCharacters(),
      { ...npcs.qin, drawX: npcs.qin.x, drawY: npcs.qin.y },
      { ...npcs.linmai, drawX: npcs.linmai.x, drawY: npcs.linmai.y },
      { ...npcs.xuhuai, drawX: npcs.xuhuai.x, drawY: npcs.xuhuai.y },
      { ...npcs.shenyan, drawX: npcs.shenyan.x, drawY: npcs.shenyan.y },
      { ...npcs.azhi, drawX: npcs.azhi.x, drawY: npcs.azhi.y },
      { palette: "player", drawX: player.drawX, drawY: player.drawY },
    ];

    characters.sort((a, b) => a.drawY - b.drawY);
    characters.forEach((character) => drawCharacter(character, now));
    drawMist(now);
    drawRain(now);
    drawEveningTint();
  }

  function loop(now) {
    updateMovement(now);
    updateHint();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld(now);
    window.requestAnimationFrame(loop);
  }

  const moveKeys = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0],
  };

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isMove = Object.prototype.hasOwnProperty.call(moveKeys, key);
    const isInteract = key === "e" || key === " " || key === "enter";

    if (sharedWorldState.modalOpen) {
      if (key === "escape") {
        event.preventDefault();
        closeSharedTraceModal();
      } else if ((event.metaKey || event.ctrlKey) && key === "enter") {
        event.preventDefault();
        submitSharedTrace();
      }
      return;
    }

    if (isMove || isInteract) {
      event.preventDefault();
      unlockGameAudio("键盘操作");
    }

    if (isModalOpen()) {
      return;
    }

    if (state.noteOpen) {
      if (isInteract) {
        handleDayNoteAction();
      }
      return;
    }

    if (state.dialogueOpen) {
      if (isInteract) {
        advanceDialogue();
      }
      return;
    }

    if (isMove) {
      const [dx, dy] = moveKeys[key];
      attemptMove(dx, dy);
      return;
    }

    if (isInteract) {
      handleInteraction();
    }
  });

  refs.dialogueNext.addEventListener("click", advanceDialogue);
  refs.restartDay.addEventListener("click", handleDayNoteAction);
  refs.sharedTracesRefresh.addEventListener("click", () => {
    loadSharedTraces(true);
  });
  refs.sharedTracesCompose.addEventListener("click", () => {
    openSharedTraceModal(false);
  });
  refs.sharedTraceSubmit.addEventListener("click", submitSharedTrace);
  refs.sharedTraceCancel.addEventListener("click", closeSharedTraceModal);
  refs.sharedTraceModal.addEventListener("click", (event) => {
    if (event.target === refs.sharedTraceModal) {
      closeSharedTraceModal();
    }
  });
  refs.touchInteract.addEventListener("click", () => {
    unlockGameAudio("触屏交互");
    handleInteraction();
  });
  refs.resetDemo.addEventListener("click", () => {
    unlockGameAudio("重新开始");
    hideTitleScreen();
    resetGame();
    showToast("已重新开始这一周");
  });
  refs.titleStart.addEventListener("click", () => {
    unlockGameAudio("开始试玩");
    hideTitleScreen();
    resetGame();
  });
  refs.titleContinue.addEventListener("click", () => {
    unlockGameAudio("继续试玩");
    if (loadSavedProgress()) {
      hideTitleScreen();
      hideEnding();
      showToast("已继续上次进度");
      return;
    }

    hideTitleScreen();
    startDayOne(1);
  });
  refs.endingRestart.addEventListener("click", () => {
    unlockGameAudio("重新开始");
    hideEnding();
    resetGame();
    showToast("已从第一天重新开始");
  });
  refs.endingContinue.addEventListener("click", () => {
    unlockGameAudio("继续试玩");
    hideEnding();
    persistProgress();
  });
  if (refs.gameAudioToggle) {
    refs.gameAudioToggle.addEventListener("click", toggleGameAudioEnabled);
  }
  if (refs.gameAudioMute) {
    refs.gameAudioMute.addEventListener("click", toggleGameAudioMute);
  }
  if (refs.audioBell) {
    refs.audioBell.addEventListener("click", playBellPreview);
  }
  if (refs.audioRain) {
    refs.audioRain.addEventListener("click", playRainPreview);
  }
  if (refs.audioFestival) {
    refs.audioFestival.addEventListener("click", playFestivalPreview);
  }
  if (refs.audioStop) {
    refs.audioStop.addEventListener("click", () => {
      stopAudioPreview(true);
    });
  }

  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isModalOpen() || state.noteOpen) {
        return;
      }

      unlockGameAudio("触屏移动");

      const dir = button.getAttribute("data-move");
      if (dir === "up") {
        attemptMove(0, -1);
      } else if (dir === "down") {
        attemptMove(0, 1);
      } else if (dir === "left") {
        attemptMove(-1, 0);
      } else if (dir === "right") {
        attemptMove(1, 0);
      }
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAudioPreview(false);
      setAudioStatus("试玩页面已切到后台，试听已自动停止。");
    }
  });

  syncGameAudioButtons();
  refreshTitleScreen();
  startDayOne(1, false);
  window.requestAnimationFrame(loop);
})();
