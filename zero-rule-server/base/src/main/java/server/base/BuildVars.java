package server.base;

import java.security.Permission;

public class BuildVars {

    public static final Long MASTER_USER_ID = 1L;
    public static final String MASTER_LOGIN_ID = "master";



    public static class Package {
        public static final String base = "server.base";
        public static final String domain = "server.domain";
        public static final String web = "server.web";
        public static final String service = "server.service";
        public static final String repo = "server.repo";
        public static final String security = "server.security";
        public static final String setup = "server.setup";
        public static final String task = "server.task";
    }

    public static class FrameworkPackage {
        public static final String web = "cl.cloverframework.web";
        public static final String impl = "cl.cloverframework.impl";
    }

    public static class ApiUrls {
        public static final String pwChange = "/api/user/update-pwd";
        public static final String profileMe = "/api/auth/profile-me";
        public static final String pswdMustChangeError = "/p/api/pwd-must-change-error";

        // 접근 권한이 없습니다 에러 처리 URL
        public static final String permissionDenied = "/permission-denied";

        public static final String logoutError = "/api/auth/logout";

    }
}
