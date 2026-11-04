package com.mobellsite.app;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 进程内静态资源服务器（APP-SPEC 4.2 节 Android 实现）：
 * - 只绑定 127.0.0.1，随机端口，只读
 * - 从 APK assets/www/ 读取内置站点快照
 * - URL 解码后按段规范化，任何越过根的 ".." 直接拒绝（防路径穿越）
 * - 目录请求补 index.html，未找到返回 404
 */
public final class OfflineServer {

    private final AssetManager assets;
    private final Object lock = new Object();
    private ServerSocket server;
    private Thread thread;
    private int port = -1;
    private volatile boolean running;

    public OfflineServer(Context context) {
        this.assets = context.getApplicationContext().getAssets();
    }

    /** 启动服务器并返回本地端口；重复调用返回同一端口。 */
    public int start() throws IOException {
        synchronized (lock) {
            if (running && port > 0) {
                return port;
            }
            ServerSocket ss = new ServerSocket(0, 64, InetAddress.getByName("127.0.0.1"));
            server = ss;
            port = ss.getLocalPort();
            running = true;
            Thread t = new Thread(this::loop, "mobellsite-offline-server");
            t.setDaemon(true);
            thread = t;
            t.start();
            return port;
        }
    }

    public boolean isRunning() {
        return running;
    }

    public int getPort() {
        return port;
    }

    /** 关闭服务器（幂等）。 */
    public void stop() {
        synchronized (lock) {
            running = false;
            ServerSocket ss = server;
            server = null;
            if (ss != null) {
                try {
                    ss.close();
                } catch (IOException ignored) {
                }
            }
            Thread t = thread;
            thread = null;
            if (t != null) {
                t.interrupt();
            }
            port = -1;
        }
    }

    private void loop() {
        while (running) {
            try {
                Socket socket = server.accept();
                if (socket == null) {
                    continue;
                }
                Thread worker = new Thread(() -> handle(socket), "mobellsite-http");
                worker.setDaemon(true);
                worker.start();
            } catch (IOException e) {
                if (running) {
                    // accept 失败（服务器已关闭等），退避后继续
                    try {
                        Thread.sleep(50L);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                } else {
                    return;
                }
            }
        }
    }

    private void handle(Socket socket) {
        try {
            socket.setSoTimeout(10000);
            InputStream raw = socket.getInputStream();
            OutputStream out = new BufferedOutputStream(socket.getOutputStream());

            // 读取请求行与头部（只读请求头，不读 body）
            ByteArrayOutputStream headerBuf = new ByteArrayOutputStream(1024);
            int prev3 = -1;
            int prev2 = -1;
            int prev1 = -1;
            int b;
            while ((b = raw.read()) != -1) {
                headerBuf.write(b);
                if (prev3 == '\r' && prev2 == '\n' && prev1 == '\r' && b == '\n') {
                    break;
                }
                prev3 = prev2;
                prev2 = prev1;
                prev1 = b;
                if (headerBuf.size() > 65536) {
                    break;
                }
            }
            String headers = headerBuf.toString(StandardCharsets.ISO_8859_1.name());
            String requestLine = headers;
            int nl = headers.indexOf("\r\n");
            if (nl >= 0) {
                requestLine = headers.substring(0, nl);
            }
            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                writeSimple(out, 400, "Bad Request", "text/plain; charset=utf-8", "400 Bad Request");
                return;
            }
            String method = parts[0].toUpperCase(Locale.US);
            String target = parts[1];
            if (!"GET".equals(method) && !"HEAD".equals(method)) {
                writeSimple(out, 405, "Method Not Allowed", "text/plain; charset=utf-8",
                        "405 Method Not Allowed");
                return;
            }

            String path = normalizePath(target);
            if (path == null) {
                writeSimple(out, 403, "Forbidden", "text/plain; charset=utf-8", "403 Forbidden");
                return;
            }

            List<String> candidates = resolveCandidates(path);
            for (String candidate : candidates) {
                String assetPath = Config.ASSET_WWW + candidate;
                if (assetPath.endsWith("/")) {
                    continue;
                }
                try {
                    InputStream in = assets.open(assetPath);
                    if (in == null) {
                        continue;
                    }
                    try {
                        byte[] body = readAll(in);
                        String contentType = contentTypeFor(candidate);
                        String head = "HTTP/1.1 200 OK\r\n"
                                + "Content-Type: " + contentType + "\r\n"
                                + "Content-Length: " + body.length + "\r\n"
                                + "Cache-Control: no-cache\r\n"
                                + "X-Content-Type-Options: nosniff\r\n"
                                + "Connection: close\r\n\r\n";
                        out.write(head.getBytes(StandardCharsets.ISO_8859_1));
                        if (!"HEAD".equals(method)) {
                            out.write(body);
                        }
                        out.flush();
                        return;
                    } finally {
                        try {
                            in.close();
                        } catch (IOException ignored) {
                        }
                    }
                } catch (IOException e) {
                    // 该候选不存在，尝试下一个
                }
            }
            writeSimple(out, 404, "Not Found", "text/plain; charset=utf-8", "404 Not Found");
        } catch (Throwable ignored) {
            // 单连接异常不影响服务器
        } finally {
            try {
                socket.close();
            } catch (IOException ignored) {
            }
        }
    }

    /** 未找到路径时依次尝试的候选（目录补 index.html）。 */
    private static List<String> resolveCandidates(String path) {
        List<String> list = new ArrayList<>(3);
        if ("/".equals(path)) {
            list.add("/index.html");
            return list;
        }
        if (path.endsWith("/")) {
            list.add(path + "index.html");
            return list;
        }
        list.add(path);
        list.add(path + "/index.html");
        if (path.endsWith(".html")) {
            // 不额外尝试
        } else {
            list.add(path + ".html");
        }
        return list;
    }

    /**
     * 规范化请求路径：URL 解码 → 拒绝 NUL/反斜杠 → 按 "/" 分段 → 处理 . 与 ..
     * 任何试图越过站点根的 ".." 返回 null（触发 403）。
     */
    static String normalizePath(String target) {
        String p = target;
        int q = p.indexOf('?');
        if (q >= 0) {
            p = p.substring(0, q);
        }
        int h = p.indexOf('#');
        if (h >= 0) {
            p = p.substring(0, h);
        }
        try {
            p = URLDecoder.decode(p, "UTF-8");
        } catch (Exception e) {
            return null;
        }
        if (p.indexOf('\0') >= 0 || p.indexOf('\\') >= 0) {
            return null;
        }
        if (!p.startsWith("/")) {
            p = "/" + p;
        }
        List<String> stack = new ArrayList<>();
        for (String seg : p.split("/")) {
            if (seg.isEmpty() || ".".equals(seg)) {
                continue;
            }
            if ("..".equals(seg)) {
                if (stack.isEmpty()) {
                    return null; // 越过站点根，拒绝
                }
                stack.remove(stack.size() - 1);
                continue;
            }
            stack.add(seg);
        }
        StringBuilder sb = new StringBuilder();
        for (String seg : stack) {
            sb.append('/').append(seg);
        }
        if (sb.length() == 0) {
            return "/";
        }
        if (p.endsWith("/")) {
            sb.append('/');
        }
        return sb.toString();
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(16384);
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) != -1) {
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }

    private static void writeSimple(OutputStream out, int code, String reason,
                                    String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        String head = "HTTP/1.1 " + code + " " + reason + "\r\n"
                + "Content-Type: " + contentType + "\r\n"
                + "Content-Length: " + bytes.length + "\r\n"
                + "Cache-Control: no-cache\r\n"
                + "Connection: close\r\n\r\n";
        out.write(head.getBytes(StandardCharsets.ISO_8859_1));
        out.write(bytes);
        out.flush();
    }

    /** Content-Type 映射（APP-SPEC 4 节要求的最小集合 + pagefind 扩展名）。 */
    static String contentTypeFor(String path) {
        String lower = path.toLowerCase(Locale.US);
        int dot = lower.lastIndexOf('.');
        String ext = dot >= 0 ? lower.substring(dot + 1) : "";
        switch (ext) {
            case "html":
            case "htm":
                return "text/html; charset=utf-8";
            case "css":
                return "text/css; charset=utf-8";
            case "js":
            case "mjs":
                return "text/javascript; charset=utf-8";
            case "json":
                return "application/json; charset=utf-8";
            case "svg":
                return "image/svg+xml";
            case "png":
                return "image/png";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "webp":
                return "image/webp";
            case "gif":
                return "image/gif";
            case "ico":
                return "image/x-icon";
            case "woff2":
                return "font/woff2";
            case "woff":
                return "font/woff";
            case "ttf":
                return "font/ttf";
            case "otf":
                return "font/otf";
            case "txt":
                return "text/plain; charset=utf-8";
            case "xml":
                return "application/xml; charset=utf-8";
            case "webmanifest":
                return "application/manifest+json";
            case "map":
                return "application/json; charset=utf-8";
            case "wasm":
            case "pagefind":
                return "application/wasm";
            case "pf_fragment":
            case "pf_index":
            case "pf_meta":
            case "pagefind-entry":
                return "application/octet-stream";
            default:
                return "application/octet-stream";
        }
    }
}
