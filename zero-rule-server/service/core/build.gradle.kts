plugins {
    id("java-library")
}

// Reads IMAGE rows and writes forward/rollback SQL only. Credentials are environment variables.
tasks.register<JavaExec>("planImageContractMigration") {
    workingDir(rootProject.projectDir)
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("server.service.core.popup.ImageContractMigration")
}


dependencies {
    implementation(projects.base)
    implementation(projects.util)
    implementation(projects.domain)
    implementation(projects.service.support)
    implementation(projects.repo.support)
    implementation(projects.repo.core)

    implementation(libs.springboot.starter)
    implementation(libs.springboot.starter.security)
    implementation(libs.mybatis.springboot.starter)

    // common utils
    implementation(libs.apache.commons.lang3)
    implementation(libs.slf4j.api)
    implementation(libs.json.simple)
    // [WPF 팝업 — 추가] PopupContentAssembler·PopupService가 팝업 content JSON(CLOB) 조립·파싱에 Jackson ObjectMapper를 직접 사용한다.
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation(libs.oracle.ojdbc)
    implementation(libs.oracle.ojdbc6)
}
