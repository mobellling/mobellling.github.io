/*
 * PackApk —— MobellSite Android 手工构建的 ZIP 打包器。
 *
 * 为什么不用 aapt2 -A / .NET ZipArchive：
 *   1) build-tools 36 的 aapt2 link 不接受 --ignore-assets，且 aapt2 在 Windows
 *      下打不开中文文件名的 asset（本站快照有 images/故事.jpg 等中文图片）。
 *   2) .NET Framework 的 ZipArchive(CompressionLevel.NoCompression) 实际写入的仍是
 *      method 8（deflate level 0），而 targetSdk >= 30 要求 resources.arsc 必须是
 *      method 0（STORED），否则安装校验会失败。
 *
 * 用法：
 *   java PackApk.java <stageDir> <outApk>
 *
 * 规则：
 *   - resources.arsc：STORED（必须）
 *   - 已是压缩格式的资源（png/jpg/webp/gif/ico/woff2/ttf/otf/mp4/zip/gz/br）：STORED，省 CPU
 *   - 其他（html/css/js/json/xml/txt/svg/map/wasm/dex...）：DEFLATED level 9
 *   - entry name 使用 UTF-8（Java ZipOutputStream 默认行为，非 ASCII 名字会置 EFS 标志）
 */
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public final class PackApk {

    private static final Set<String> ALWAYS_STORED = Collections.singleton("resources.arsc");

    private static boolean isAlreadyCompressed(String lower) {
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".webp") || lower.endsWith(".gif") || lower.endsWith(".ico")
                || lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf")
                || lower.endsWith(".otf") || lower.endsWith(".mp4") || lower.endsWith(".zip")
                || lower.endsWith(".gz") || lower.endsWith(".br");
    }

    private static byte[] readAll(Path file) throws IOException {
        long size = Files.size(file);
        if (size > Integer.MAX_VALUE - 8) {
            throw new IOException("file too large for single entry: " + file);
        }
        return Files.readAllBytes(file);
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("usage: java PackApk.java <stageDir> <outApk>");
            System.exit(2);
        }
        Path root = Paths.get(args[0]).toAbsolutePath().normalize();
        Path out = Paths.get(args[1]).toAbsolutePath().normalize();
        if (!Files.isDirectory(root)) {
            throw new IOException("stage dir not found: " + root);
        }
        Path parent = out.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        List<Path> files = new ArrayList<>();
        try (java.util.stream.Stream<Path> walk = Files.walk(root)) {
            walk.filter(Files::isRegularFile).forEach(files::add);
        }
        Collections.sort(files, (a, b) -> a.toString().compareTo(b.toString()));

        long totalBytes = 0;
        int stored = 0;
        int deflated = 0;
        try (OutputStream fos = Files.newOutputStream(out);
             ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(fos, 1 << 20))) {
            zos.setLevel(9);
            for (Path file : files) {
                String rel = root.relativize(file).toString().replace(File.separatorChar, '/');
                String lower = rel.toLowerCase(Locale.ROOT);
                byte[] data = readAll(file);
                totalBytes += data.length;

                ZipEntry entry = new ZipEntry(rel);
                entry.setTime(Files.getLastModifiedTime(file).toMillis());
                if (ALWAYS_STORED.contains(lower) || isAlreadyCompressed(lower)) {
                    CRC32 crc = new CRC32();
                    crc.update(data);
                    entry.setMethod(ZipEntry.STORED);
                    entry.setSize(data.length);
                    entry.setCompressedSize(data.length);
                    entry.setCrc(crc.getValue());
                    stored++;
                } else {
                    entry.setMethod(ZipEntry.DEFLATED);
                    deflated++;
                }
                zos.putNextEntry(entry);
                zos.write(data);
                zos.closeEntry();
            }
        }
        long outSize = Files.size(out);
        System.out.printf(Locale.ROOT,
                "PackApk: %d entries (%d stored, %d deflated), %d bytes -> %d bytes (%.2f MB)%n",
                files.size(), stored, deflated, totalBytes, outSize, outSize / 1048576.0);
        if (Files.size(out) == 0) {
            throw new IOException("empty output");
        }
    }
}
