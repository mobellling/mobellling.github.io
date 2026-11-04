package com.mobellsite.app;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * 极简 HTTP GET 工具（APP-SPEC 5.1 / 6 节）：
 * - 追加随机 _t 参数绕 CDN 缓存
 * - 头部 Cache-Control: no-cache
 * - 15s 超时，失败返回 null（静默）
 */
public final class Http {
    private Http() {}

    /** 拉取 URL 原始字节；非 200 或异常返回 null。 */
    public static byte[] getBytes(String baseUrl, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            String url = withCacheBuster(baseUrl);
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setUseCaches(false);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("Cache-Control", "no-cache, no-store");
            conn.setRequestProperty("Pragma", "no-cache");
            conn.setRequestProperty("User-Agent", "MobellSite/" + Config.VERSION_NAME + " (Android)");
            int code = conn.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) {
                return null;
            }
            InputStream in = conn.getInputStream();
            if (in == null) {
                return null;
            }
            try {
                ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(256, conn.getContentLength()));
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) != -1) {
                    out.write(buf, 0, n);
                }
                return out.toByteArray();
            } finally {
                try {
                    in.close();
                } catch (Exception ignored) {
                }
            }
        } catch (Throwable t) {
            return null;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    /** 追加 _t=<毫秒时间戳> 参数。 */
    public static String withCacheBuster(String url) {
        String sep = url.indexOf('?') >= 0 ? "&" : "?";
        return url + sep + "_t=" + System.currentTimeMillis();
    }

    /** SHA-256 小写 hex；失败返回 null。 */
    public static String sha256Hex(byte[] data) {
        if (data == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    /** 拉取文本（UTF-8）；失败返回 null。 */
    public static String getText(String url, int timeoutMs) {
        byte[] body = getBytes(url, timeoutMs);
        if (body == null) {
            return null;
        }
        return new String(body, StandardCharsets.UTF_8);
    }
}
