package server.util;

import com.google.common.collect.Sets;

import java.util.Set;

public abstract class BbsUtils {

    /**
     * 업로드가 제한된 파일 확장자인지 체크
     *
     * @param fileName 체크할 파일 이름
     * @return 업로드가 제한되었으면 true를 리턴
     */
    public static boolean isBlockedAttachFileName(String fileName) {
        if (fileName == null || fileName.isEmpty()) return false;
        int idx = fileName.lastIndexOf(".");
        if (idx <= 0) return false;
        String ext = fileName.substring(idx + 1);
        return BLOCKED_EXT.contains(ext.toLowerCase());
    }

    /**
     * 업로드 할 수 없는 파일 확장자
     */
    private static final Set<String> BLOCKED_EXT = Sets.newHashSet(
        "ade", "adp", "app", "asp", "aspx", "asx", "bas", "bat", "cer", "chm", "cmd", "cnt", "com",
        "cpl", "crt", "csh", "der", "diagcab", "dll", "dmg", "docm", "exe", "fxp", "gadget", "grp",
        "hlp", "hpj", "hta", "htc", "html", "inf", "ins", "isp", "its", "jar", "jnlp", "js", "jse",
        "jsp", "ksh", "lnk", "mad", "maf", "mag", "mam", "maq", "mar", "mas", "mat", "mau", "mav",
        "maw", "mcf", "mda", "mdb", "mde", "mdt", "mdw", "mdz", "msc", "msh", "msh1", "msh1xml",
        "msh2", "msh2xml", "mshxml", "msi", "msp", "mst", "msu", "ops", "osd", "pcd", "pif", "pl",
        "plg", "prf", "prg", "printerexport", "ps1", "ps1xml", "ps2", "ps2xml", "psc1", "psc2",
        "psd1", "psdm1", "pst", "py", "pyc", "pyo", "pyw", "pyz", "pyzw", "reg", "scf", "scr", "sct",
        "sh", "shb", "shs", "theme", "tmp", "url", "vb", "vbe", "vbp", "vbs", "vhd", "vhdx", "vsmacros",
        "webpnp", "website", "ws", "wsc", "wsf", "wsh", "xbap", "xll", "xml", "xnk", "xps"
    );
}
