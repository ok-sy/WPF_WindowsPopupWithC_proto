rootProject.name = "server"

// 저장공간을 사용하기 위해 gradle repository 정의
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

// 접근경로 설정을 편리하게 할수 있다.
// project(":client") -> project.client 로 사용가능하게해줌
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

//멀티모듈설정
val projectList = listOf(
    ":app",
    ":base",
    ":domain",
    ":util",
    ":repo:core",
    ":repo:support",
    ":service:core",
    ":service:support",
    ":web:support",
    ":web:auth",
    ":web:api",
    ":security",
    ":setup",
    ":task:core",
    ":task:support"
)

projectList.forEach {
    include(it)
}
