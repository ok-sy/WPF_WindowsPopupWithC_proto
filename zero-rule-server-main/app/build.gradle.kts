//Gradle 플러그인을 정의합니다.
plugins {
	// alias(libs.plugins.springboot)
	id("org.springframework.boot")
	id("java")
	idea
}

// Gradle 구성을 정의합니다.
configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

// profile 이라는 변수를 정의하고, Gradle 프로젝트의 환경 변수에서 값을 가져옵니다.
val profile = extra["profile"]

//  Gradle 소스 세트를 정의합니다.
sourceSets {
	// 서브 모듈의 resources 폴더를 메인 모듈의 resources 폴더로 머지
	// app 모듈에서 다른 모든 모듈의 resources 모듈을 포함한다.
	val resourcesDirs = rootProject.subprojects
		.flatMap {
			listOf(
				File(it.projectDir, "src/main/resources"),
				File(it.projectDir, "src/main/resources-${profile}"),
			)
		}
		.toTypedArray()
	// println(resourcesDirs)
	main {
		resources.srcDirs(*resourcesDirs)
	}
}

//  Spring Boot 플러그인을 구성합니다.
springBoot {
	mainClass.set("server.app.App")
}

//  Gradle 작업을 정의합니다.
tasks {
	bootRun {
		// systemProperties = System.getProperties().toMap() as Map<String, *>
		systemProperties["spring.profiles.active"] = profile
		environment["SPRING_PROFILES_ACTIVE"] = profile
	}
}

// Gradle 종속성을 정의합니다.
dependencies {
	implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar"))))
	implementation(projects.base)
	implementation(projects.util)
	implementation(projects.service.support)
	implementation(projects.service.core)
	implementation(projects.repo.core)
	implementation(projects.repo.support)
	implementation(projects.web.api)
	implementation(projects.web.auth)
	implementation(projects.web.support)
	implementation(projects.security)
	implementation(projects.domain)
	implementation(projects.setup)
	implementation(projects.task.core)
	implementation(projects.task.support)

	developmentOnly(libs.springboot.devtools)
	implementation(libs.springboot.starter.web)
	implementation(libs.springboot.starter.security)
	implementation(libs.springboot.starter.validation)
	annotationProcessor(libs.springboot.configuration.processor)
	implementation(libs.mybatis.springboot.starter)

	implementation(libs.spring.session.core)

	//runtimeOnly(libs.oracle.ojdbc)
	//runtimeOnly(libs.oracle.ojdbc6)
	runtimeOnly("org.postgresql:postgresql")

	// okhttp3
	implementation(libs.okhttp.okhttp)
	implementation(libs.okhttp.loggingInterceptor)

	// security
	implementation(libs.springsecurity.oauth2.client)
	implementation(libs.springsecurity.oauth2.jose)

	implementation(libs.jjwt.api)
	runtimeOnly(libs.jjwt.impl)
	runtimeOnly(libs.jjwt.jackson)

	implementation(libs.hibernate.validator.validator)

	implementation(libs.spring.messaging)
	implementation(libs.springsecurity.messaging)

	// common utils
	implementation(libs.apache.commons.lang3)
	implementation(libs.apache.commons.codec)
	implementation(libs.apache.commons.compress)
	implementation(libs.apache.commons.dbcp2)

	// system node info
	implementation(libs.oshi.core)
	implementation(libs.uap.java)

	implementation(libs.jna.jna)
	implementation(libs.jna.platform)

	implementation(libs.json.simple)
	implementation(libs.zxcvbn)

	implementation(libs.springdoc.openapi.starter.webmvc.ui)

	implementation(libs.jsoup)

	// logger
	implementation(libs.logback.core)
	implementation(libs.logback.classic)
	implementation(libs.slf4j.api)

	testImplementation(libs.springsecurity.test)
	testImplementation(libs.restAssured)
}

// Git 리비전을 가져오는 함수입니다.
fun gitRev() = ProcessBuilder("git", "rev-parse", "--short", "HEAD").start().let { p ->
	p.waitFor(100, TimeUnit.MILLISECONDS)
	p.inputStream.bufferedReader().readLine() ?: "none"
}
