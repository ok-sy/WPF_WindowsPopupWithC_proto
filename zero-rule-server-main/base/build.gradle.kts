plugins {
	id("java-library")
}


val profile = extra["profile"]

dependencies {
	implementation(projects.util)

	implementation(libs.springboot.starter)
	implementation(libs.springsecurity.core)
	annotationProcessor(libs.springboot.configuration.processor)

	implementation(libs.gson)
	implementation(libs.okhttp.okhttp)

	implementation(libs.springdoc.openapi.starter.webmvc.ui)
	// implementation(libs.springdoc.openapi.security)

	// computer info
	implementation(libs.oshi.core)

	// common utils
	implementation(libs.apache.commons.lang3)
}
