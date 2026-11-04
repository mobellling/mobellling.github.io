package com.mobellsite.app;

/** 全局常量与协议参数（见 docs/apps/APP-SPEC.md 第 1、4、5、6 节）。 */
public final class Config {
    private Config() {}

    /** 站点根，末尾必须带 /。 */
    public static final String SITE_URL = "https://mobellling.github.io/";
    /** 站点版本清单（纯文本，每次部署变化）。 */
    public static final String HASH_URL = SITE_URL + "_hash";
    /** 软件更新清单。 */
    public static final String LATEST_JSON_URL = SITE_URL + "app/latest.json";

    public static final String APP_ID = "com.mobellsite.app";
    public static final String VERSION_NAME = "1.0.0";
    public static final int VERSION_CODE = 1;

    /** 单次 HTTP 超时（5.1 / 6 节：15s）。 */
    public static final int HTTP_TIMEOUT_MS = 15000;

    /** 前台轮询间隔 60s。 */
    public static final long POLL_FOREGROUND_MS = 60_000L;
    /** 后台（Activity paused）轮询间隔 300s。 */
    public static final long POLL_BACKGROUND_MS = 300_000L;
    /** 软件更新检查间隔（启动 + 每 6 小时 + 手动）。 */
    public static final long APP_CHECK_INTERVAL_MS = 6L * 60L * 60L * 1000L;
    /** JobScheduler 周期（系统最小值 15min）。 */
    public static final long JOB_PERIOD_MS = 15L * 60L * 1000L;
    public static final int JOB_ID = 4242;

    /** 主文档远程加载超时（4.2 节：20s）。 */
    public static final long PAGE_TIMEOUT_MS = 20_000L;

    public static final String CHANNEL_SITE = "site_updates";
    public static final String CHANNEL_APP = "app_updates";

    public static final String EXTRA_RELOAD = "com.mobellsite.app.EXTRA_RELOAD";
    public static final String PREF_NAME = "mobellsite_state";

    /** 内置快照在 APK assets 中的目录。 */
    public static final String ASSET_WWW = "www";
}
