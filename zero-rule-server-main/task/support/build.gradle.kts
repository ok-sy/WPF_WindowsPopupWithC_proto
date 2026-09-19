plugins {
    id("java-library")
}


dependencies {
    implementation(projects.base)
    implementation(projects.util)
    implementation(projects.domain)
    implementation(projects.service.support)
    implementation(projects.service.core)
    implementation(projects.security)

    implementation(libs.springboot.starter)
    implementation(libs.springboot.starter.web)

    // common utils
    implementation(libs.apache.commons.lang3)
}
