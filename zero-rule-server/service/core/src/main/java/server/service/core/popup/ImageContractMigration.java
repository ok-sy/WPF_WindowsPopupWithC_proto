package server.service.core.popup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Oracle 11g compatible migration planner. Reads DB; emits reviewable forward/rollback SQL, never executes DML. */
public final class ImageContractMigration {
    private ImageContractMigration() { }

    static Map<String, Object> convert(Map<String, Object> old, Number windowWidth, Number windowHeight) {
        var next = new LinkedHashMap<>(old);
        String mode = String.valueOf(next.getOrDefault("imageSizeMode", "ADAPTIVE")).trim().toUpperCase(java.util.Locale.ROOT);
        if ("FILL".equals(mode)) mode = "ADAPTIVE";
        if (!List.of("ADAPTIVE", "FIT_TO_IMAGE", "ORIGINAL").contains(mode))
            throw new IllegalArgumentException("Unknown IMAGE mode: " + mode);
        next.put("imageSizeMode", mode);
        if (!"ORIGINAL".equals(mode)) {
            if (!next.containsKey("width")) next.put("width", "FIT_TO_IMAGE".equals(mode) ? positive(next.get("imageWidth")) : windowWidth);
            if (!next.containsKey("height")) next.put("height", "FIT_TO_IMAGE".equals(mode) ? positive(next.get("imageHeight")) : windowHeight);
            if ("FIT_TO_IMAGE".equals(mode)) next.putIfAbsent("keepAspectRatio", true);
        } else { next.remove("width"); next.remove("height"); }
        if (!"FIT_TO_IMAGE".equals(mode)) next.remove("keepAspectRatio");
        List.of("imageWidth", "imageHeight", "descriptionPosition", "imageAreaRatio").forEach(next::remove);
        return next;
    }

    private static Object positive(Object value) {
        return value instanceof Number n && Double.isFinite(n.doubleValue()) && n.doubleValue() > 0 ? value : null;
    }

    // Small chunks stay below the Oracle 11g SQL literal limit, including multibyte Korean text.
    static String clobLiteral(String value) {
        if (value == null) return "NULL";
        if (value.isEmpty()) return "EMPTY_CLOB()";
        var parts = new java.util.ArrayList<String>();
        for (int start = 0; start < value.length();) {
            int end = Math.min(value.length(), start + 500);
            if (end < value.length() && Character.isHighSurrogate(value.charAt(end - 1))) end--;
            parts.add("TO_CLOB('" + value.substring(start, end).replace("'", "''") + "')");
            start = end;
        }
        return String.join(" || ", parts);
    }

    static String updateSql(String table, String id, String expected, String replacement) {
        String quotedId = "'" + id.replace("'", "''") + "'";
        String condition = expected == null ? "v IS NULL" : "v IS NOT NULL AND DBMS_LOB.COMPARE(v, " + clobLiteral(expected) + ") = 0";
        return "DECLARE v CLOB; BEGIN\n  SELECT CONTENT_OPTIONS INTO v FROM " + table + " WHERE POPUP_ID=" + quotedId
                + " FOR UPDATE;\n  IF " + condition + " THEN\n    UPDATE " + table + " SET CONTENT_OPTIONS=" + clobLiteral(replacement)
                + " WHERE POPUP_ID=" + quotedId + ";\n  ELSE RAISE_APPLICATION_ERROR(-20023, 'IMAGE migration source changed'); END IF;\nEND;\n/\n";
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("Arguments: schema-prefix (POPUP. or empty) output-directory");
        String schema = "-".equals(args[0]) ? "" : args[0];
        if (!schema.matches("(?:[A-Za-z][A-Za-z0-9_]*\\.)?")) throw new IllegalArgumentException("Invalid schema prefix");
        Path directory = Path.of(args[1]);
        Files.createDirectories(directory);
        String table = schema + "POPUP_CONTENT";
        String header = "SET DEFINE OFF\nWHENEVER SQLERROR EXIT FAILURE ROLLBACK\n-- Review first; COMMIT is deliberately omitted.\n";
        var forward = new StringBuilder(header);
        var rollback = new StringBuilder(header);
        var backups = new java.util.ArrayList<Map<String, Object>>();
        var mapper = new ObjectMapper();
        try (var connection = DriverManager.getConnection(required("POPUP_MIGRATION_JDBC_URL"), required("POPUP_MIGRATION_USER"), required("POPUP_MIGRATION_PASSWORD"));
             var statement = connection.createStatement();
             var rows = statement.executeQuery("SELECT n.POPUP_ID, n.POPUP_WIDTH, n.POPUP_HEIGHT, c.CONTENT_OPTIONS FROM "
                     + schema + "POPUP_NOTICE n JOIN " + table + " c ON c.POPUP_ID=n.POPUP_ID WHERE n.POPUP_TYPE='IMAGE' ORDER BY n.POPUP_ID")) {
            while (rows.next()) {
                String id = rows.getString(1), before = rows.getString(4);
                Map<String, Object> old = before == null || before.isBlank() ? Map.of()
                        : mapper.readValue(before, new TypeReference<Map<String, Object>>() { });
                var next = convert(old, rows.getBigDecimal(2), rows.getBigDecimal(3));
                if (next.equals(old)) continue;
                String after = mapper.writeValueAsString(next);
                forward.append(updateSql(table, id, before, after));
                rollback.append(updateSql(table, id, after, before));
                var backup = new LinkedHashMap<String, Object>();
                backup.put("popupId", id); backup.put("before", before); backup.put("after", after);
                backup.put("warning", "FILL becomes contain with possible whitespace; RIGHT/AUTO becomes BOTTOM; FIT_TO_IMAGE stops automatic downscaling and may clip; locked size normalizes height using original ratio at client load.");
                backups.add(backup);
            }
        }
        Files.writeString(directory.resolve("11_image_contract_forward.sql"), forward, StandardCharsets.UTF_8);
        Files.writeString(directory.resolve("11_image_contract_rollback.sql"), rollback, StandardCharsets.UTF_8);
        mapper.writerWithDefaultPrettyPrinter().writeValue(directory.resolve("image-contract-backup.json").toFile(), backups);
        System.out.println("Migration plan generated: " + backups.size() + " IMAGE rows; no DB changes executed.");
    }

    private static String required(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing environment variable: " + key);
        return value;
    }
}
