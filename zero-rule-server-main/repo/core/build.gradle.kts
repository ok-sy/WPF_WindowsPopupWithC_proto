plugins {
    id("java-library")
}


dependencies {
    implementation(projects.base)
    implementation(projects.util)
    implementation(projects.domain)
    implementation(projects.repo.support)

    implementation(libs.springboot.starter)
    implementation(libs.mybatis.springboot.starter)
    implementation(libs.log4jdbc.log4j2Jdbc41)

    // common utils
    implementation(libs.apache.commons.lang3)
}
