plugins {
    id("java-library")
}


dependencies {
    implementation(projects.base)
    implementation(projects.util)
    implementation(projects.domain)
    implementation(projects.security)
    implementation(projects.service.support)
    implementation(projects.service.core)

    implementation(libs.springboot.starter)
    implementation(libs.springboot.starter.web)
    implementation(libs.hibernate.validator.validator)

    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // common utils
    implementation(libs.apache.commons.lang3)
}
