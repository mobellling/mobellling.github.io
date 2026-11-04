package com.mobellsite.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;

/**
 * 系统通知封装（APP-SPEC 5.3 / 6 / 8 节）：
 * - 两个 NotificationChannel：site_updates / app_updates（重要性 DEFAULT）
 * - Android 13+ 未授予 POST_NOTIFICATIONS 或用户关闭通知时静默降级（返回 false，不抛异常）
 */
public final class Notifications {
    public static final int ID_SITE = 1001;
    public static final int ID_APP = 1002;

    private static volatile Bitmap largeIconCache;

    private Notifications() {}

    /** 创建通知渠道（幂等，可重复调用）。 */
    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm == null) {
                return;
            }
            NotificationChannel site = new NotificationChannel(
                    Config.CHANNEL_SITE, "网站更新", NotificationManager.IMPORTANCE_DEFAULT);
            site.setDescription("站点内容更新提醒");
            NotificationChannel app = new NotificationChannel(
                    Config.CHANNEL_APP, "软件更新", NotificationManager.IMPORTANCE_DEFAULT);
            app.setDescription("MobellSite 新版本提醒");
            nm.createNotificationChannel(site);
            nm.createNotificationChannel(app);
        }
    }

    /** 通知权限是否可用：Android 13+ 需要 POST_NOTIFICATIONS，且系统总开关打开。 */
    public static boolean canNotify(Context context) {
        if (Build.VERSION.SDK_INT >= 33
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        // areNotificationsEnabled() 需要 API 24（minSdk 24），直接可用。
        return nm != null && nm.areNotificationsEnabled();
    }

    private static Notification.Builder builder(Context context, String channel) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Notification.Builder(context, channel);
        }
        return new Notification.Builder(context);
    }

    private static Bitmap largeIcon(Context context) {
        if (largeIconCache == null) {
            try {
                largeIconCache = BitmapFactory.decodeResource(
                        context.getResources(), R.drawable.ic_notification_large);
            } catch (Throwable ignored) {
                largeIconCache = null;
            }
        }
        return largeIconCache;
    }

    private static PendingIntent activityIntent(Context context, int requestCode, boolean reload) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra(Config.EXTRA_RELOAD, reload);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    /** 网站更新通知：标题/正文按 5.3 节固定文案，点击打开应用并刷新。 */
    public static boolean notifySiteUpdated(Context context) {
        if (!canNotify(context)) {
            return false;
        }
        try {
            NotificationManager nm =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) {
                return false;
            }
            String body = "MobellSite 有新内容，点击查看最新内容。";
            Notification.Builder b = builder(context, Config.CHANNEL_SITE)
                    .setSmallIcon(R.drawable.ic_stat_update)
                    .setContentTitle("网站已更新")
                    .setContentText(body)
                    .setStyle(new Notification.BigTextStyle().bigText(body))
                    .setAutoCancel(true)
                    .setContentIntent(activityIntent(context, ID_SITE, true));
            Bitmap large = largeIcon(context);
            if (large != null) {
                b.setLargeIcon(large);
            }
            nm.notify(ID_SITE, b.build());
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    /** 软件更新通知：标题「软件有新版本 vX」，点击用系统浏览器打开 url。 */
    public static boolean notifyAppUpdated(Context context, String remoteVersion, String url) {
        if (!canNotify(context)) {
            return false;
        }
        try {
            NotificationManager nm =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) {
                return false;
            }
            Intent open = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url));
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getActivity(context, ID_APP, open, flags);
            String body = "点击下载更新（在浏览器中打开）";
            Notification.Builder b = builder(context, Config.CHANNEL_APP)
                    .setSmallIcon(R.drawable.ic_stat_update)
                    .setContentTitle("软件有新版本 v" + remoteVersion)
                    .setContentText(body)
                    .setStyle(new Notification.BigTextStyle().bigText(body))
                    .setAutoCancel(true)
                    .setContentIntent(pi);
            Bitmap large = largeIcon(context);
            if (large != null) {
                b.setLargeIcon(large);
            }
            nm.notify(ID_APP, b.build());
            return true;
        } catch (Throwable t) {
            return false;
        }
    }
}
