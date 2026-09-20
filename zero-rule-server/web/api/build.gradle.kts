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
    implementation(projects.web.support)

    implementation(rootProject.libs.cloverframework.core)
    implementation(libs.springboot.starter)
    implementation(libs.springboot.starter.web)
    implementation(libs.springboot.starter.security)
    api(libs.springsecurity.oauth2.client)
    implementation(libs.springsecurity.core)
    implementation(libs.springsecurity.messaging)
    api(libs.springsecurity.oauth2.client)
    implementation(libs.hibernate.validator.validator)

    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // common utils
    implementation(libs.apache.commons.lang3)
}
