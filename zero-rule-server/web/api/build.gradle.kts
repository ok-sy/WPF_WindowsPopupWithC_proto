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
    // 장애별 분기 처리 결과 예시 테스트(WpfErrorBranchExamplesTest)가 실제 WpfPopupService에 mock 매퍼를 넣는다. 운영 classpath에는 영향 없음.
    testImplementation(projects.repo.core)

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
