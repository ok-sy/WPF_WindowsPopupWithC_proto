plugins {
    id("java-library")
}


dependencies {
    // [Oracle 전환 — 기준 5] 실DB 테스트 드라이버를 Oracle로 교체 (ojdbc는 implementation으로 이미 포함)
    //testRuntimeOnly("org.postgresql:postgresql")
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
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation(libs.oracle.ojdbc)
    implementation(libs.oracle.ojdbc6)
}
