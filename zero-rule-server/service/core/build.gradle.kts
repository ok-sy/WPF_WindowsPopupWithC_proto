plugins {
    id("java-library")
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
    implementation(libs.oracle.ojdbc)
    implementation(libs.oracle.ojdbc6)
}
