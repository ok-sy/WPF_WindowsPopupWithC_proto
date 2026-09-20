plugins {
    id("java-library")
}



dependencies {
    implementation(projects.util)
    implementation(projects.domain)
    implementation(projects.base)

    implementation(libs.springboot.starter)
    implementation(libs.mybatis.springboot.starter)

    // common utils
    implementation(libs.apache.commons.lang3)
}
