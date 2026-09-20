plugins {
    id("java-library")
}


dependencies {
    implementation(projects.base)
    implementation(projects.util)

    implementation(libs.springboot.starter)
    implementation(libs.springsecurity.core)

    implementation(libs.gson)
    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // common utils
    implementation(libs.apache.commons.lang3)
}
