package server.service.core.popup;

import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ImageContractMigrationTest {
    @Test void convertsModesAndDimensionsWithoutChangingOtherOptions() {
        var fill = ImageContractMigration.convert(Map.of("imageSizeMode", "FILL", "descriptionPosition", "RIGHT", "showDescription", false), 600, 400);
        assertEquals("ADAPTIVE", fill.get("imageSizeMode"));
        assertEquals(600, fill.get("width"));
        assertEquals(false, fill.get("showDescription"));
        assertFalse(fill.containsKey("descriptionPosition"));
        var fit = ImageContractMigration.convert(Map.of("imageSizeMode", "FIT_TO_IMAGE", "imageWidth", 600, "imageHeight", 0), 900, 600);
        assertEquals(600, fit.get("width"));
        assertNull(fit.get("height"));
        assertEquals(true, fit.get("keepAspectRatio"));
        assertEquals(fit, ImageContractMigration.convert(fit, 900, 600), "Plan is idempotent");
        var original = ImageContractMigration.convert(Map.of("imageSizeMode", "ORIGINAL", "imageWidth", 1), 900, 600);
        assertEquals(Map.of("imageSizeMode", "ORIGINAL"), original);
    }

    @Test void sqlEscapesQuotesAndChecksSnapshotBeforeMutation() {
        String sql = ImageContractMigration.updateSql("POPUP.POPUP_CONTENT", "A'B", "{\"title\":\"O'Brien\"}", "{}");
        assertTrue(sql.contains("POPUP_ID='A''B'"));
        assertTrue(sql.contains("O''Brien"));
        assertTrue(sql.contains("FOR UPDATE"));
        assertTrue(sql.contains("DBMS_LOB.COMPARE"));
        assertTrue(sql.contains("RAISE_APPLICATION_ERROR"));
        assertFalse(sql.contains("COMMIT"));
        assertTrue(ImageContractMigration.clobLiteral("한글".repeat(1000)).contains(" || "));
        assertTrue(ImageContractMigration.clobLiteral("a".repeat(499) + "😀" + "b").contains("😀"), "UTF-16 surrogate pairs must stay in one SQL literal");
    }
}
