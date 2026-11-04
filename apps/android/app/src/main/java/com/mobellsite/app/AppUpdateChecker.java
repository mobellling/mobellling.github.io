package com.mobellsite.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 软件更新检查（APP-SPEC 6 节）：
 * - GET /app/latest.json?_t=... no-cache，15s 超时
 * - 版本号按 "." 拆数字比较（1.0.10 > 1.0.9）
 * - 远端 > 本机才提示；同版本只提示一次（appLastNotifiedVersion）
 * - 频率：启动一次 + 每 6 小时 + 手动；清单缺失/解析失败静默忽略
 */
public final class AppUpdateChecker {

    public static final int RESULT_FAILED = 0;
    public static final int RESULT_UP_TO_DATE = 1;
    public static final int RESULT_UPDATED = 2;
    public static final int RESULT_ALREADY_NOTIFIED = 3;

    /** 检查完成回调（主线程）。 */
    public interface Listener {
        void onCheckFinished(int status, String remoteVersion);
    }

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "mobellsite-app-check");
        t.setDaemon(true);
        return t;
    });
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static final Object CHECK_LOCK = new Object();

    /** 本次进程是否已做过启动检查（启动一次即可）。 */
    private static volatile boolean startupChecked = false;

    private AppUpdateChecker() {}

    /** 启动检查（每个进程只执行一次）。 */
    public static void checkOnStartup(Context context) {
        if (startupChecked) {
            return;
        }
        startupChecked = true;
        checkAsync(context, false, null);
    }

    /** 到期检查：距上次检查不足 6 小时则跳过。 */
    public static void checkIfDue(Context context, Listener listener) {
        State state = new State(context);
        long last = state.appLastCheckAt();
        if (last > 0 && System.currentTimeMillis() - last < Config.APP_CHECK_INTERVAL_MS) {
            return;
        }
        checkAsync(context, false, listener);
    }

    /** 手动检查：始终执行，并给出 Toast 反馈。 */
    public static void checkNow(Context context, Listener listener) {
        checkAsync(context, true, listener);
    }

    private static void checkAsync(Context context, boolean manual, Listener listener) {
        final Context app = context.getApplicationContext();
        EXECUTOR.execute(() -> {
            final int status;
            String version = "";
            try {
                version = peekRemoteVersion(app);
                status = runCheck(app, true);
            } catch (Throwable t) {
                MAIN.post(() -> {
                    Listener l = listener;
                    if (l != null) {
                        l.onCheckFinished(RESULT_FAILED, "");
                    }
                    if (manual) {
                        toast(app, "检查失败，请检查网络");
                    }
                });
                return;
            }
            final String finalVersion = version;
            MAIN.post(() -> {
                Listener l = listener;
                if (l != null) {
                    l.onCheckFinished(status, finalVersion);
                }
                if (manual) {
                    toast(app, manualMessage(status, finalVersion));
                }
            });
        });
    }

    private static String manualMessage(int status, String remoteVersion) {
        switch (status) {
            case RESULT_UPDATED:
                return "发现新版本 v" + remoteVersion;
            case RESULT_FAILED:
                return "检查失败，请检查网络";
            case RESULT_UP_TO_DATE:
            case RESULT_ALREADY_NOTIFIED:
            default:
                return "软件已是最新版本";
        }
    }

    private static void toast(Context context, String message) {
        try {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        } catch (Throwable ignored) {
        }
    }

    /**
     * 同步执行检查。供 JobService 直接调用。
     *
     * @param notify 是否允许发系统通知
     * @return RESULT_* 之一
     */
    public static int runCheck(Context context, boolean notify) {
        synchronized (CHECK_LOCK) {
            byte[] body = Http.getBytes(Config.LATEST_JSON_URL, Config.HTTP_TIMEOUT_MS);
            if (body == null) {
                return RESULT_FAILED;
            }
            JSONObject android;
            try {
                JSONObject root = new JSONObject(new String(body, StandardCharsets.UTF_8));
                JSONObject apps = root.optJSONObject("apps");
                android = apps == null ? null : apps.optJSONObject("android");
            } catch (Throwable t) {
                return RESULT_FAILED;
            }
            if (android == null) {
                return RESULT_FAILED;
            }
            String remoteVersion = android.optString("version", "").trim();
            if (remoteVersion.isEmpty()) {
                return RESULT_FAILED;
            }
            String url = android.optString("url", "").trim();
            if (url.isEmpty()) {
                url = Config.SITE_URL;
            }
            State state = new State(context);
            long now = System.currentTimeMillis();
            if (!isNewer(remoteVersion, Config.VERSION_NAME)) {
                state.setAppLastCheckAt(now);
                return RESULT_UP_TO_DATE;
            }
            state.setAppLastCheckAt(now);
            String lastNotified = state.appLastNotifiedVersion();
            if (remoteVersion.equals(lastNotified)) {
                return RESULT_ALREADY_NOTIFIED;
            }
            // 先记录再通知：保证同版本只提示一次（即使通知权限被拒也不重复打扰）
            state.setAppLastNotifiedVersion(remoteVersion);
            if (notify) {
                Notifications.notifyAppUpdated(context, remoteVersion, url);
            }
            return RESULT_UPDATED;
        }
    }

    /** 只读解析远端版本号（用于手动反馈文案），失败返回空串。 */
    private static String peekRemoteVersion(Context context) {
        byte[] body = Http.getBytes(Config.LATEST_JSON_URL, Config.HTTP_TIMEOUT_MS);
        if (body == null) {
            return "";
        }
        try {
            JSONObject root = new JSONObject(new String(body, StandardCharsets.UTF_8));
            JSONObject apps = root.optJSONObject("apps");
            JSONObject android = apps == null ? null : apps.optJSONObject("android");
            if (android == null) {
                return "";
            }
            return android.optString("version", "").trim();
        } catch (Throwable t) {
            return "";
        }
    }

    /** 版本号比较：按 "." 拆成数字，逐段比较；1.0.10 > 1.0.9。 */
    public static boolean isNewer(String remote, String local) {
        if (remote == null || remote.isEmpty()) {
            return false;
        }
        String[] r = remote.split("\\.");
        String[] l = (local == null ? "" : local).split("\\.");
        int n = Math.max(r.length, l.length);
        for (int i = 0; i < n; i++) {
            int rv = i < r.length ? parseIntSafe(r[i]) : 0;
            int lv = i < l.length ? parseIntSafe(l[i]) : 0;
            if (rv != lv) {
                return rv > lv;
            }
        }
        return false;
    }

    private static int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Throwable t) {
            return 0;
        }
    }
}
