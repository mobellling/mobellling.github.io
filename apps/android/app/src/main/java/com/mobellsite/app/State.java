package com.mobellsite.app;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * SharedPreferences 状态存储（mobellsite_state），字段对应 APP-SPEC.md 5.2 / 6 节。
 * 所有读写都在主线程或检查线程中调用，SharedPreferences 自身线程安全。
 */
public final class State {
    private static final String K_SITE_BASELINE = "siteBaseline";
    private static final String K_SITE_BASELINE_AT = "siteBaselineAt";
    private static final String K_SITE_LAST_NOTIFIED = "siteLastNotified";
    private static final String K_SITE_LAST_CHECK_AT = "siteLastCheckAt";
    private static final String K_APP_LAST_NOTIFIED = "appLastNotifiedVersion";
    private static final String K_APP_LAST_CHECK_AT = "appLastCheckAt";

    private final SharedPreferences sp;

    public State(Context context) {
        this.sp = context.getApplicationContext()
                .getSharedPreferences(Config.PREF_NAME, Context.MODE_PRIVATE);
    }

    public String siteBaseline() {
        return sp.getString(K_SITE_BASELINE, null);
    }

    public long siteBaselineAt() {
        return sp.getLong(K_SITE_BASELINE_AT, 0L);
    }

    public String siteLastNotified() {
        return sp.getString(K_SITE_LAST_NOTIFIED, null);
    }

    public long siteLastCheckAt() {
        return sp.getLong(K_SITE_LAST_CHECK_AT, 0L);
    }

    /** 确认新基线（同时写 siteBaselineAt 与 siteLastCheckAt）。 */
    public void setSiteBaseline(String fingerprint, long atMillis) {
        sp.edit()
                .putString(K_SITE_BASELINE, fingerprint)
                .putLong(K_SITE_BASELINE_AT, atMillis)
                .putLong(K_SITE_LAST_CHECK_AT, atMillis)
                .apply();
    }

    public void setSiteLastCheckAt(long atMillis) {
        sp.edit().putLong(K_SITE_LAST_CHECK_AT, atMillis).apply();
    }

    public void setSiteLastNotified(String fingerprint) {
        sp.edit().putString(K_SITE_LAST_NOTIFIED, fingerprint).apply();
    }

    public String appLastNotifiedVersion() {
        return sp.getString(K_APP_LAST_NOTIFIED, null);
    }

    public long appLastCheckAt() {
        return sp.getLong(K_APP_LAST_CHECK_AT, 0L);
    }

    public void setAppLastNotifiedVersion(String version) {
        sp.edit().putString(K_APP_LAST_NOTIFIED, version).apply();
    }

    public void setAppLastCheckAt(long atMillis) {
        sp.edit().putLong(K_APP_LAST_CHECK_AT, atMillis).apply();
    }
}
