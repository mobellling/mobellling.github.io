package com.mobellsite.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 网站更新检查（APP-SPEC 5.1–5.5 节，Android 实现）：
 * - GET /_hash?_t=... Cache-Control: no-cache，15s 超时，失败静默
 * - fingerprint = SHA-256(body) 小写 hex
 * - 首次成功只建立基线不通知；之后变化才通知，siteLastNotified 去重
 * - 同一时刻最多 1 个请求在飞（实例级 AtomicBoolean 防重入，runCheck 静态锁防并发重复通知）
 */
public final class SiteUpdateChecker {

    public static final int RESULT_FAILED = 0;
    public static final int RESULT_BASELINE = 1;
    public static final int RESULT_UP_TO_DATE = 2;
    public static final int RESULT_UPDATED = 3;
    public static final int RESULT_UPDATED_ALREADY_NOTIFIED = 4;

    /** 检查结果（不可变）。 */
    public static final class Result {
        public final int status;
        public final String fingerprint;

        public Result(int status, String fingerprint) {
            this.status = status;
            this.fingerprint = fingerprint;
        }

        public boolean isFailure() {
            return status == RESULT_FAILED;
        }

        public boolean isUpdate() {
            return status == RESULT_UPDATED || status == RESULT_UPDATED_ALREADY_NOTIFIED;
        }
    }

    /** 检查完成回调（主线程）。 */
    public interface Listener {
        void onCheckFinished(Result result);
    }

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "mobellsite-site-check");
        t.setDaemon(true);
        return t;
    });

    /** 串行化所有检查（Activity 轮询 + JobService 可能并发）。 */
    private static final Object CHECK_LOCK = new Object();

    private final Context appContext;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean inFlight = new AtomicBoolean(false);
    private volatile Listener listener;

    public SiteUpdateChecker(Context context) {
        this.appContext = context.getApplicationContext();
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    /**
     * 异步检查。
     *
     * @param manual true 表示用户手动触发，完成后用 Toast 给出反馈（5.5 节）
     */
    public void check(boolean manual) {
        if (!inFlight.compareAndSet(false, true)) {
            if (manual) {
                toast(appContext, "正在检查，请稍候");
            }
            return;
        }
        EXECUTOR.execute(() -> {
            Result result;
            try {
                result = runCheck(appContext);
            } catch (Throwable t) {
                result = new Result(RESULT_FAILED, null);
            } finally {
                inFlight.set(false);
            }
            final Result finalResult = result;
            mainHandler.post(() -> {
                Listener l = listener;
                if (l != null) {
                    l.onCheckFinished(finalResult);
                }
                if (manual) {
                    toast(appContext, manualMessage(finalResult.status));
                }
            });
        });
    }

    /** 手动检查的短反馈文案（5.5 节）。 */
    private static String manualMessage(int status) {
        switch (status) {
            case RESULT_UPDATED:
            case RESULT_UPDATED_ALREADY_NOTIFIED:
                return "发现网站更新";
            case RESULT_FAILED:
                return "检查失败，请检查网络";
            case RESULT_BASELINE:
            case RESULT_UP_TO_DATE:
            default:
                return "网站已是最新版本";
        }
    }

    private static void toast(Context context, String message) {
        try {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        } catch (Throwable ignored) {
        }
    }

    /**
     * 同步执行一次检查（供 JobService 与异步包装复用）。
     * 返回不可变结果；不会抛出异常。
     */
    public static Result runCheck(Context context) {
        synchronized (CHECK_LOCK) {
            byte[] body = Http.getBytes(Config.HASH_URL, Config.HTTP_TIMEOUT_MS);
            if (body == null || body.length == 0) {
                return new Result(RESULT_FAILED, null);
            }
            String fingerprint = Http.sha256Hex(body);
            if (fingerprint == null || fingerprint.isEmpty()) {
                return new Result(RESULT_FAILED, null);
            }
            State state = new State(context);
            long now = System.currentTimeMillis();
            String baseline = state.siteBaseline();
            if (baseline == null || baseline.isEmpty()) {
                // 第一次成功：只建立基线，不通知
                state.setSiteBaseline(fingerprint, now);
                return new Result(RESULT_BASELINE, fingerprint);
            }
            if (baseline.equals(fingerprint)) {
                state.setSiteLastCheckAt(now);
                return new Result(RESULT_UP_TO_DATE, fingerprint);
            }
            // 站点已变化：先推进基线
            state.setSiteBaseline(fingerprint, now);
            String lastNotified = state.siteLastNotified();
            if (fingerprint.equals(lastNotified)) {
                // 同一次变更已经提醒过（去重）
                return new Result(RESULT_UPDATED_ALREADY_NOTIFIED, fingerprint);
            }
            state.setSiteLastNotified(fingerprint);
            Notifications.notifySiteUpdated(context);
            return new Result(RESULT_UPDATED, fingerprint);
        }
    }
}
