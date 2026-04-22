(function () {
  const LOCAL_TRACES_KEY = "wuling-demo-shared-traces-v1";
  const LOCAL_VISITOR_KEY = "wuling-demo-shared-visitor-v1";
  const PLACEHOLDER_VALUES = new Set([
    "",
    "YOUR_SUPABASE_URL",
    "YOUR_SUPABASE_ANON_KEY",
    "YOUR_SUPABASE_PUBLISHABLE_KEY",
  ]);
  const RIBBON_COLORS = ["晴蓝", "米白", "杏黄", "苔绿", "晚霞粉"];
  const WEATHER_TAGS = ["薄雾", "晴和有风", "风更明显了", "细雨", "雨后初晴", "晴朗，晚风将近", "晴暖有风"];

  function hasLocalStorage() {
    try {
      const probe = `${LOCAL_TRACES_KEY}:probe`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `trace-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function ensureVisitorId() {
    if (!hasLocalStorage()) {
      return randomId();
    }

    const existing = window.localStorage.getItem(LOCAL_VISITOR_KEY);
    if (existing) {
      return existing;
    }

    const created = randomId();
    window.localStorage.setItem(LOCAL_VISITOR_KEY, created);
    return created;
  }

  function readLocalTraces() {
    if (!hasLocalStorage()) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(LOCAL_TRACES_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeLocalTraces(traces) {
    if (!hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(LOCAL_TRACES_KEY, JSON.stringify(traces.slice(0, 24)));
  }

  function normalizeTrace(row) {
    return {
      id: row.id || randomId(),
      message: typeof row.message === "string" ? row.message.trim() : "",
      ribbonColor: row.ribbon_color || row.ribbonColor || "米白",
      weatherTag: row.weather_tag || row.weatherTag || "薄雾",
      storyDay: Number(row.story_day || row.storyDay || 5),
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      visitorId: row.visitor_id || row.visitorId || "",
      authorLabel: row.author_label || row.authorLabel || "桥边来客",
      source: row.source || "local",
    };
  }

  function getConfig() {
    return window.SHARED_WORLD_CONFIG || {};
  }

  function isConfigured(config) {
    return (
      config.enableRemote === true &&
      !PLACEHOLDER_VALUES.has(config.supabaseUrl || "") &&
      !PLACEHOLDER_VALUES.has(config.supabaseAnonKey || "")
    );
  }

  async function requestJson(url, options) {
    const response = await window.fetch(url, options);
    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && payload.message
          ? payload.message
          : `Shared world request failed with ${response.status}.`;
      throw new Error(message);
    }

    return payload;
  }

  function createClient() {
    const config = getConfig();
    const remoteEnabled = isConfigured(config);
    const visitorId = ensureVisitorId();
    const tableName = config.tracesTable || "bridge_traces";

    async function loadRecent(limit) {
      const normalizedLimit = Math.max(1, Math.min(12, Number(limit) || 8));
      const localTraces = readLocalTraces().map(normalizeTrace);

      if (!remoteEnabled) {
        return {
          ok: true,
          mode: "local",
          traces: localTraces.slice(0, normalizedLimit),
          warning: "当前还没有接入 Supabase，先以本机风痕模式运行。",
        };
      }

      try {
        const params = new URLSearchParams({
          select: "id,message,ribbon_color,weather_tag,story_day,created_at,visitor_id,author_label,source",
          is_visible: "eq.true",
          order: "created_at.desc",
          limit: String(normalizedLimit),
        });
        const data = await requestJson(
          `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${tableName}?${params.toString()}`,
          {
            method: "GET",
            headers: {
              apikey: config.supabaseAnonKey,
              Authorization: `Bearer ${config.supabaseAnonKey}`,
            },
          },
        );

        return {
          ok: true,
          mode: "supabase",
          traces: Array.isArray(data) ? data.map(normalizeTrace) : [],
        };
      } catch (error) {
        return {
          ok: true,
          mode: "local-fallback",
          traces: localTraces.slice(0, normalizedLimit),
          warning: "远端风痕暂时没连上，先显示本机保存的桥边痕迹。",
        };
      }
    }

    async function submitTrace(input) {
      const localPayload = normalizeTrace({
        id: randomId(),
        message: input.message,
        ribbon_color: input.ribbonColor,
        weather_tag: input.weatherTag,
        story_day: input.storyDay,
        visitor_id: visitorId,
        author_label: input.authorLabel || "桥边来客",
        created_at: new Date().toISOString(),
        source: remoteEnabled ? "supabase-pending" : "local",
      });

      if (!remoteEnabled) {
        const next = [localPayload, ...readLocalTraces().map(normalizeTrace)];
        writeLocalTraces(next);
        return {
          ok: true,
          mode: "local",
          trace: localPayload,
          warning: "当前还没有接入 Supabase，这条风痕先保存在本机浏览器里。",
        };
      }

      try {
        const data = await requestJson(
          `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${tableName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: config.supabaseAnonKey,
              Authorization: `Bearer ${config.supabaseAnonKey}`,
              Prefer: "return=representation",
            },
            body: JSON.stringify([
              {
                message: localPayload.message,
                ribbon_color: localPayload.ribbonColor,
                weather_tag: localPayload.weatherTag,
                story_day: localPayload.storyDay,
                visitor_id: localPayload.visitorId,
                author_label: localPayload.authorLabel,
                is_visible: true,
                source: "misty-bells-web",
              },
            ]),
          },
        );

        return {
          ok: true,
          mode: "supabase",
          trace: Array.isArray(data) && data[0] ? normalizeTrace(data[0]) : localPayload,
        };
      } catch (error) {
        const next = [normalizeTrace({ ...localPayload, source: "local-fallback" }), ...readLocalTraces().map(normalizeTrace)];
        writeLocalTraces(next);
        return {
          ok: true,
          mode: "local-fallback",
          trace: localPayload,
          warning: "远端暂时没收住这条风痕，我先替你保存在本机里了。",
        };
      }
    }

    return {
      remoteEnabled,
      visitorId,
      ribbonColors: RIBBON_COLORS.slice(),
      weatherTags: WEATHER_TAGS.slice(),
      async loadRecent(limit) {
        return loadRecent(limit);
      },
      async submitTrace(input) {
        return submitTrace(input);
      },
    };
  }

  window.MistyBellsSharedWorld = {
    createClient,
    ribbonColors: RIBBON_COLORS.slice(),
    weatherTags: WEATHER_TAGS.slice(),
  };
})();
