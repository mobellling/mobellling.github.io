package com.mobellsite.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * MobellSite Android 主界面（APP-SPEC 4、5、6、8 节）：
 * - 顶部原生工具条（应用名 + 在线/离线状态 + 刷新 + ⋮ 菜单），下方全屏 WebView
 * - 默认加载远程站点；主文档失败（网络/DNS/20s 超时）自动回退内置快照服务器
 * - 网站更新轮询：前台 60s / 后台 300s / 启动+onResume+手动立即
 * - 返回键历史回退，到底后双击退出
 */
public class MainActivity extends Activity implements SiteUpdateChecker.Listener {

    private static final int REQ_NOTIFICATIONS = 100;
    private static final long DOUBLE_BACK_INTERVAL_MS = 2000L;

    private static final String COLOR_BG = "#ffffff";
    private static final String COLOR_TOOLBAR = "#0f172a";
    private static final String COLOR_TEXT = "#ffffff";
    private static final String COLOR_MUTED = "#94a3b8";
    private static final String COLOR_OFFLINE = "#fbbf24";
    private static final String COLOR_ACCENT = "#014ecb";

    private WebView webView;
    private TextView statusView;
    private ProgressBar progressBar;
    private LinearLayout toolbar;
    private int toolbarPadLeft;
    private int toolbarPadTop;
    private int toolbarPadRight;
    private int toolbarPadBottom;

    private OfflineServer offlineServer;
    private SiteUpdateChecker siteChecker;
    private final Handler ui = new Handler(Looper.getMainLooper());

    private boolean offlineMode = false;
    private boolean offlineStarting = false;
    private boolean updateBannerPending = false;
    private boolean pageTimeoutArmed = false;
    private long lastBackPressedAt = 0L;
    private Runnable pageTimeoutRunnable;
    private Runnable foregroundPoll;
    private Runnable backgroundPoll;
    private boolean resumed = false;
    private boolean webViewConfigured = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Notifications.ensureChannels(this);

        buildUi();
        configureWebView();

        siteChecker = new SiteUpdateChecker(this);
        siteChecker.setListener(this);

        UpdateJobService.schedule(this);
        AppUpdateChecker.checkOnStartup(this);
        requestNotificationPermissionIfNeeded();

        webView.loadUrl(Config.SITE_URL);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra(Config.EXTRA_RELOAD, false)) {
            loadRemote();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        // Activity onResume：立即检查一次，并开始前台 60s 轮询
        if (siteChecker != null) {
            siteChecker.check(false);
        }
        startForegroundPolling();
        AppUpdateChecker.checkIfDue(this, null);
        updateStatusView();
    }

    @Override
    protected void onPause() {
        resumed = false;
        stopPolling();
        // 进入后台：改用 300s 轮询（进程仍存活时）；系统级后台检查由 JobScheduler 负责
        startBackgroundPolling();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        stopPolling();
        if (siteChecker != null) {
            siteChecker.setListener(null);
            siteChecker = null;
        }
        if (offlineServer != null) {
            offlineServer.stop();
            offlineServer = null;
        }
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    // ---------------------------------------------------------------- UI 构建

    private int dp(float value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics()));
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor(COLOR_BG));
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // 顶部工具条
        toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setBackgroundColor(Color.parseColor(COLOR_TOOLBAR));
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbarPadLeft = dp(10);
        toolbarPadTop = dp(4);
        toolbarPadRight = dp(4);
        toolbarPadBottom = dp(4);
        toolbar.setPadding(toolbarPadLeft, toolbarPadTop, toolbarPadRight, toolbarPadBottom);
        toolbar.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));

        TextView title = new TextView(this);
        title.setText(R.string.app_name);
        title.setTextColor(Color.parseColor(COLOR_TEXT));
        title.setTextSize(17);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        toolbar.addView(title);

        statusView = new TextView(this);
        statusView.setTextSize(11);
        statusView.setTextColor(Color.parseColor(COLOR_MUTED));
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        statusParams.leftMargin = dp(8);
        toolbar.addView(statusView, statusParams);

        View spacer = new View(this);
        toolbar.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1f));

        TextView refreshButton = toolbarButton(getString(R.string.action_refresh));
        refreshButton.setOnClickListener(v -> {
            if (webView != null) {
                webView.reload();
            }
        });
        toolbar.addView(refreshButton);

        TextView menuButton = toolbarButton("⋮");
        menuButton.setTextSize(24);
        menuButton.setOnClickListener(this::showMenu);
        toolbar.addView(menuButton);

        root.addView(toolbar);

        // 加载进度条
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        root.addView(progressBar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(2)));

        // WebView
        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(webView);

        setContentView(root);
        updateStatusView();

        // Android 15+ 强制 edge-to-edge：按系统栏 insets 给根布局加内边距
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int top;
            int left;
            int right;
            int bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                top = bars.top;
                left = bars.left;
                right = bars.right;
                bottom = bars.bottom;
            } else {
                top = insets.getSystemWindowInsetTop();
                left = insets.getSystemWindowInsetLeft();
                right = insets.getSystemWindowInsetRight();
                bottom = insets.getSystemWindowInsetBottom();
            }
            toolbar.setPadding(toolbarPadLeft, toolbarPadTop, toolbarPadRight, toolbarPadBottom);
            v.setPadding(left, top, right, bottom);
            return insets;
        });
    }

    private TextView toolbarButton(String text) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(Color.parseColor("#e2e8f0"));
        tv.setTextSize(14);
        tv.setPadding(dp(10), dp(8), dp(10), dp(8));
        tv.setClickable(true);
        tv.setFocusable(true);
        tv.setGravity(Gravity.CENTER);
        return tv;
    }

    private void updateStatusView() {
        if (statusView == null) {
            return;
        }
        statusView.setText(offlineMode ? R.string.status_offline : R.string.status_online);
        statusView.setTextColor(Color.parseColor(offlineMode ? COLOR_OFFLINE : COLOR_MUTED));
    }

    private void configureWebView() {
        if (webViewConfigured) {
            return;
        }
        webViewConfigured = true;
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        try {
            settings.setUserAgentString(settings.getUserAgentString()
                    + " MobellSite/" + Config.VERSION_NAME);
        } catch (Throwable ignored) {
        }

        webView.setBackgroundColor(Color.WHITE);
        webView.addJavascriptInterface(new Bridge(), "MobellBridge");
        webView.setWebViewClient(new AppWebViewClient());
        webView.setWebChromeClient(new AppChromeClient());
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                openExternal(Uri.parse(url)));
    }

    // ---------------------------------------------------------------- 菜单

    private void showMenu(View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        popup.getMenu().add(0, 1, 0, getString(R.string.action_refresh));
        popup.getMenu().add(0, 2, 1, getString(R.string.action_reconnect));
        popup.getMenu().add(0, 3, 2, getString(R.string.action_check_site));
        popup.getMenu().add(0, 4, 3, getString(R.string.action_check_app));
        popup.getMenu().add(0, 5, 4, getString(R.string.action_about));
        popup.setOnMenuItemClickListener(item -> {
            switch (item.getItemId()) {
                case 1:
                    if (webView != null) {
                        webView.reload();
                    }
                    return true;
                case 2:
                    loadRemote();
                    return true;
                case 3:
                    if (siteChecker != null) {
                        siteChecker.check(true);
                    }
                    return true;
                case 4:
                    AppUpdateChecker.checkNow(this, null);
                    Toast.makeText(this, "正在检查软件更新…", Toast.LENGTH_SHORT).show();
                    return true;
                case 5:
                    showAbout();
                    return true;
                default:
                    return false;
            }
        });
        popup.show();
    }

    private void showAbout() {
        State state = new State(this);
        String baselineAt = formatTime(state.siteBaselineAt());
        String lastCheck = formatTime(state.siteLastCheckAt());
        String snapshotFiles = getString(R.string.snapshot_files);
        String snapshotBuilt = getString(R.string.snapshot_built);
        String message = "软件版本：" + Config.VERSION_NAME + " (" + Config.VERSION_CODE + ")\n"
                + "内置网站快照：" + snapshotFiles + " 个文件\n"
                + "快照生成时间：" + snapshotBuilt + "\n"
                + "站点基线时间：" + baselineAt + "\n"
                + "最近检查时间：" + lastCheck + "\n"
                + "站点地址：" + Config.SITE_URL;
        new AlertDialog.Builder(this)
                .setTitle(R.string.title_about)
                .setMessage(message)
                .setPositiveButton("打开网站", (dialog, which) -> openExternal(Uri.parse(Config.SITE_URL)))
                .setNegativeButton("关闭", null)
                .show();
    }

    private static String formatTime(long millis) {
        if (millis <= 0) {
            return "尚未检查";
        }
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.CHINA);
        return fmt.format(new Date(millis));
    }

    // ---------------------------------------------------------------- 在线 / 离线

    /** 重新加载远程站点（在线模式）。 */
    private void loadRemote() {
        cancelPageTimeout();
        if (webView != null) {
            webView.loadUrl(Config.SITE_URL);
        }
    }

    private boolean isRemoteSite(String url) {
        if (url == null) {
            return false;
        }
        return url.startsWith("https://mobellling.github.io")
                || url.startsWith("http://mobellling.github.io");
    }

    private boolean isLocalServer(String url) {
        if (url == null) {
            return false;
        }
        return url.startsWith("http://127.0.0.1:") || url.startsWith("http://localhost:");
    }

    /** 远程主文档失败：启动进程内静态服务器并加载内置快照。 */
    private void fallbackToOffline(String reason) {
        if (offlineMode || offlineStarting) {
            return;
        }
        offlineStarting = true;
        cancelPageTimeout();
        Toast.makeText(this, "网络不可用，已切换到内置网站快照", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            try {
                if (offlineServer == null) {
                    offlineServer = new OfflineServer(MainActivity.this);
                }
                int port = offlineServer.start();
                final String url = "http://127.0.0.1:" + port + "/";
                ui.post(() -> {
                    offlineStarting = false;
                    offlineMode = true;
                    updateStatusView();
                    if (webView != null) {
                        webView.loadUrl(url);
                    }
                });
            } catch (Throwable t) {
                ui.post(() -> {
                    offlineStarting = false;
                    Toast.makeText(MainActivity.this,
                            "内置快照加载失败，请检查网络后重试", Toast.LENGTH_LONG).show();
                });
            }
        }, "mobellsite-offline-start").start();
    }

    private void armPageTimeout() {
        cancelPageTimeout();
        pageTimeoutArmed = true;
        pageTimeoutRunnable = () -> {
            if (pageTimeoutArmed) {
                pageTimeoutArmed = false;
                fallbackToOffline("timeout");
            }
        };
        ui.postDelayed(pageTimeoutRunnable, Config.PAGE_TIMEOUT_MS);
    }

    private void cancelPageTimeout() {
        pageTimeoutArmed = false;
        if (pageTimeoutRunnable != null) {
            ui.removeCallbacks(pageTimeoutRunnable);
            pageTimeoutRunnable = null;
        }
    }

    // ---------------------------------------------------------------- 轮询

    private void startForegroundPolling() {
        stopPolling();
        foregroundPoll = new Runnable() {
            @Override
            public void run() {
                if (siteChecker != null) {
                    siteChecker.check(false);
                }
                ui.postDelayed(foregroundPoll, Config.POLL_FOREGROUND_MS);
            }
        };
        ui.postDelayed(foregroundPoll, Config.POLL_FOREGROUND_MS);
    }

    private void startBackgroundPolling() {
        stopPolling();
        backgroundPoll = new Runnable() {
            @Override
            public void run() {
                if (siteChecker != null) {
                    siteChecker.check(false);
                }
                ui.postDelayed(backgroundPoll, Config.POLL_BACKGROUND_MS);
            }
        };
        ui.postDelayed(backgroundPoll, Config.POLL_BACKGROUND_MS);
    }

    private void stopPolling() {
        if (foregroundPoll != null) {
            ui.removeCallbacks(foregroundPoll);
            foregroundPoll = null;
        }
        if (backgroundPoll != null) {
            ui.removeCallbacks(backgroundPoll);
            backgroundPoll = null;
        }
    }

    // ---------------------------------------------------------------- 站点更新回调

    @Override
    public void onCheckFinished(SiteUpdateChecker.Result result) {
        if (result.status == SiteUpdateChecker.RESULT_UPDATED) {
            updateBannerPending = true;
            if (webView != null && webView.getUrl() != null) {
                injectUpdateBanner(offlineMode ? 48 : 0);
            }
        }
    }

    // ---------------------------------------------------------------- JS 注入

    private void injectUpdateBanner(int topOffsetDp) {
        if (webView == null) {
            return;
        }
        String js = "(function(){"
                + "if(document.getElementById('__mobell_update_banner'))return;"
                + "var bar=document.createElement('div');"
                + "bar.id='__mobell_update_banner';"
                + "bar.setAttribute('style','position:fixed;top:" + topOffsetDp + "px;left:0;right:0;"
                + "z-index:2147483646;background:" + COLOR_ACCENT + ";color:#fff;"
                + "font:14px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;"
                + "padding:10px 12px;display:flex;align-items:center;gap:10px;"
                + "box-shadow:0 2px 10px rgba(0,0,0,.3)');"
                + "var span=document.createElement('span');span.style.flex='1';"
                + "span.textContent='网站已更新';"
                + "var btn=document.createElement('button');btn.textContent='点击刷新';"
                + "btn.setAttribute('style','background:#fff;color:" + COLOR_ACCENT + ";border:0;"
                + "border-radius:6px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer');"
                + "btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();"
                + "if(window.MobellBridge&&window.MobellBridge.onSiteBannerRefresh){"
                + "window.MobellBridge.onSiteBannerRefresh();}else{location.reload();}});"
                + "var close=document.createElement('span');close.textContent='\\u00d7';"
                + "close.setAttribute('style','cursor:pointer;font-size:20px;line-height:1;padding:0 4px');"
                + "close.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();"
                + "if(bar.parentNode)bar.parentNode.removeChild(bar);"
                + "if(window.MobellBridge&&window.MobellBridge.onSiteBannerDismissed){"
                + "window.MobellBridge.onSiteBannerDismissed();}});"
                + "bar.appendChild(span);bar.appendChild(btn);bar.appendChild(close);"
                + "document.body.appendChild(bar);"
                + "})();";
        evaluate(js);
    }

    private void injectOfflineBanner() {
        if (webView == null) {
            return;
        }
        String js = "(function(){"
                + "if(document.getElementById('__mobell_offline_banner'))return;"
                + "var bar=document.createElement('div');"
                + "bar.id='__mobell_offline_banner';"
                + "bar.setAttribute('style','position:fixed;top:0;left:0;right:0;z-index:2147483647;"
                + "background:#b45309;color:#fff;"
                + "font:14px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;"
                + "padding:10px 12px;display:flex;align-items:center;gap:10px;"
                + "box-shadow:0 2px 10px rgba(0,0,0,.35)');"
                + "var span=document.createElement('span');span.style.flex='1';"
                + "span.textContent='离线模式 · 正在显示内置网站快照';"
                + "var btn=document.createElement('button');btn.textContent='重新连接';"
                + "btn.setAttribute('style','background:#fff;color:#b45309;border:0;border-radius:6px;"
                + "padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer');"
                + "btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();"
                + "if(window.MobellBridge&&window.MobellBridge.reconnect){window.MobellBridge.reconnect();}"
                + "else{window.location.href='https://mobellling.github.io/';}});"
                + "bar.appendChild(span);bar.appendChild(btn);"
                + "document.body.appendChild(bar);"
                + "})();";
        evaluate(js);
    }

    private void evaluate(String js) {
        try {
            webView.evaluateJavascript(js, null);
        } catch (Throwable ignored) {
        }
    }

    // ---------------------------------------------------------------- WebView 客户端

    private class AppWebViewClient extends WebViewClient {

        private boolean handleUrl(Uri uri) {
            if (uri == null) {
                return true;
            }
            String scheme = uri.getScheme();
            if (scheme == null) {
                return true;
            }
            String lower = scheme.toLowerCase(Locale.US);
            if ("http".equals(lower) || "https".equals(lower)) {
                String host = uri.getHost();
                if (host == null) {
                    openExternal(uri);
                    return true;
                }
                String h = host.toLowerCase(Locale.US);
                if ("mobellling.github.io".equals(h) || "127.0.0.1".equals(h)
                        || "localhost".equals(h)) {
                    return false; // 站内链接在 WebView 内打开
                }
                openExternal(uri);
                return true;
            }
            // mailto / tel / intent 等交给系统
            openExternal(uri);
            return true;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleUrl(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUrl(Uri.parse(url));
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            if (isRemoteSite(url)) {
                armPageTimeout();
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            cancelPageTimeout();
            progressBar.setVisibility(View.GONE);
            if (isLocalServer(url)) {
                offlineMode = true;
                updateStatusView();
                injectOfflineBanner();
                if (updateBannerPending) {
                    injectUpdateBanner(48);
                }
            } else if (isRemoteSite(url)) {
                // 远程主文档加载成功：退出离线模式
                if (offlineMode) {
                    offlineMode = false;
                    updateStatusView();
                }
                if (updateBannerPending) {
                    injectUpdateBanner(0);
                }
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request,
                                    WebResourceError error) {
            if (request != null && request.isForMainFrame()) {
                fallbackToOffline("error");
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request,
                                        WebResourceResponse response) {
            // 主文档 5xx 视为加载失败，回退快照
            if (request != null && request.isForMainFrame() && response != null
                    && response.getStatusCode() >= 500) {
                fallbackToOffline("http-" + response.getStatusCode());
            }
        }
    }

    private class AppChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (progressBar == null) {
                return;
            }
            if (newProgress >= 100) {
                progressBar.setVisibility(View.GONE);
            } else {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(newProgress);
            }
        }
    }

    /** 注入 DOM 与原生交互的桥（仅暴露固定方法，页面为自有站点）。 */
    private class Bridge {
        @JavascriptInterface
        public void reconnect() {
            ui.post(MainActivity.this::loadRemote);
        }

        @JavascriptInterface
        public void onSiteBannerDismissed() {
            updateBannerPending = false;
        }

        @JavascriptInterface
        public void onSiteBannerRefresh() {
            updateBannerPending = false;
            ui.post(() -> {
                if (offlineMode) {
                    loadRemote();
                } else if (webView != null) {
                    webView.reload();
                }
            });
        }
    }

    // ---------------------------------------------------------------- 系统交互

    private void openExternal(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "没有可打开此链接的应用", Toast.LENGTH_SHORT).show();
        } catch (Throwable t) {
            // 忽略
        }
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            try {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQ_NOTIFICATIONS);
            } catch (Throwable ignored) {
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_NOTIFICATIONS) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (!granted) {
                // 静默降级：更新提醒仅显示应用内提示条
                Toast.makeText(this, "通知权限未开启，更新提醒将仅在应用内显示",
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastBackPressedAt < DOUBLE_BACK_INTERVAL_MS) {
            super.onBackPressed();
            return;
        }
        lastBackPressedAt = now;
        Toast.makeText(this, "再按一次退出", Toast.LENGTH_SHORT).show();
    }
}
