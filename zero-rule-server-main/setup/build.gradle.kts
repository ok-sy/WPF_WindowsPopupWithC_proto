plugins {
    id("java-library")
}


dependencies {
    implementation(projects.base)
    implementation(projects.util)
    implementation(projects.service.core)
    implementation(projects.repo.core)
    implementation(projects.domain)

    implementation(libs.springboot.starter)
    implementation(libs.springsecurity.core)
    implementation(libs.springboot.starter.security)
    implementation(libs.spring.tx)

    implementation(libs.gson)
    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // common utils
    implementation(libs.apache.commons.lang3)
}
