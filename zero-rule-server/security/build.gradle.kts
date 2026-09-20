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
    implementation(libs.springboot.starter.web)
    implementation(libs.springboot.starter.security)
    api(libs.springsecurity.oauth2.client)
    implementation(libs.springsecurity.core)
    implementation(libs.springsecurity.messaging)
    api(libs.springsecurity.oauth2.client)
    implementation(libs.spring.tx)

    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    implementation(libs.gson)
    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // common utils
    implementation(libs.apache.commons.lang3)
}
