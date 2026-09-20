// Gradle 플러그인을 정의합니다.
plugins {
	val springbootVersion = "3.4.1"
//
//	// Spring IO Platform의 Gradle Plugin인 dependency-management를 사용합니다.
	id("org.springframework.boot") version springbootVersion apply false
	id("io.spring.dependency-management") version "1.1.7"

	//java용 웹 프로젝트를 생성합니다.
	id("java")
	//intellij용  프로젝트를 생성합니다.
	id("idea")
}

// 프로젝트의 그룹을 정의합니다.
group = "server"

// 프로젝트의 버전을 정의합니다.
version = "1.0.0"

// 애플리케이션 이름을 정의합니다.
val appName = "server"

//애플리케이션 버전을 정의합니다.
val appVer by lazy { "0.0.1+${gitRev()}" }

//  Java 소스와 호환되는 Java 버전을 정의합니다.
val javaVersion = JavaVersion.VERSION_17
java.sourceCompatibility = javaVersion
java.targetCompatibility = javaVersion

//  Gradle 구성을 정의합니다.
configurations { compileOnly { extendsFrom(configurations.annotationProcessor.get()) } }

// 모든 프로젝트에 대한 설정을 정의합니다.
allprojects {
	// Gradle 리포지토리를 정의합니다.
	repositories {

		mavenCentral()
		mavenLocal()

		val profile = if (project.hasProperty("profile")) {
			project.property("profile").toString()
		} else {
			"local"
		}

		if(profile.equals("local")) {
			maven {
				url = uri("https://repo.labcl.net/repository/maven-snapshots/")
				//url = uri("file://D:/cloverfw3/repository")
				//url = uri("file://${System.getProperty("user.home")}/.m2/repository")
			}
		} else {
			maven {
				url = uri("https://repo.labcl.net/repository/maven-snapshots/")
				//url = uri("file:///home/diyadm/cloverfw/repository")
				//url = uri("file://${System.getProperty("user.home")}/cloverfw/repository")
			}
		}


	}
}

// 하위 프로젝트에 대한 설정을 정의합니다.
subprojects {
	if (project.childProjects.isEmpty()) {
		val profile = if (project.hasProperty("profile")) {
			project.property("profile").toString()
		} else {
			"local"
		}

		//  Gradle 프로젝트의 환경 변수에서 profile 값을 가져와서 extra 객체에 저장합니다.
		extra.set("profile", profile)

		// Spring Boot 의존성 관리 플러그인을 적용합니다.
		apply(plugin = rootProject.libs.plugins.spring.dependencyManagement.get().pluginId)
		apply(plugin = "java")
		// apply(plugin = "checkstyle")

		version = "1.0.0"

		// Gradle 소스 세트를 정의합니다.
		sourceSets {
			main {
				resources.srcDirs(
					"src/main/resources",
					"src/main/resources-$profile"
				)
			}
		}

		//  Gradle 의존성 관리를 정의합니다.
		dependencyManagement {
			imports {
				mavenBom(org.springframework.boot.gradle.plugin.SpringBootPlugin.BOM_COORDINATES)
			}
		}

		// 프로젝트에서 사용할 디펜던시 모듈을 정의합니다.
		dependencies {

			//compile → 먼저 compile 시점에 필요한 디펜던시 라이브러리들을 compile로 정의합니다.
			//runtime → 런타임 시에 참조할 라이브러리를 정의합니다. 기본적으로 compile 라이브러리를 포함합니다.
			//compileOnly → 컴파일 시점에만 사용하고 런타임에는 필요없는 라이브러리를 정의합니다.
			//testCompile → 프로젝트의 테스트를 위한 디펜던시 라이브러리를 정의합니다.
			//              기본적으로 Compile된 클래스와 compile 라이브러리를 포함합니다.
			implementation(rootProject.libs.jsr305)
			implementation(rootProject.libs.guava.jre)
			implementation(platform(rootProject.libs.cloverframework.bom))
			implementation(rootProject.libs.cloverframework.core)
			implementation(rootProject.libs.cloverframework.impl)
			implementation(rootProject.libs.cloverframework.task)

			compileOnly(rootProject.libs.lombok)
			annotationProcessor(rootProject.libs.lombok)
			implementation(rootProject.libs.springboot.starter)
			implementation(rootProject.libs.commons.io)

			testImplementation(rootProject.libs.springboot.starter.test) {
				exclude(group = "org.junit.vintage", module = "junit-vintage-engine")
			}
			testImplementation(rootProject.libs.junit.jupiter.api)
			testRuntimeOnly(rootProject.libs.junit.jupiter.engine)
			testImplementation(rootProject.libs.junit.platform.engine)
			testImplementation(rootProject.libs.junit.platform.commons)

		}

		tasks {
			processResources { duplicatesStrategy = DuplicatesStrategy.INCLUDE }

			jar {
				// example)
				// result = server-service-core-1.0.0-plain.jar
				archiveBaseName.set("server${project.path.replace(':', '-')}")
			}

			withType<Test> { useJUnitPlatform() }
		}
	}
}

//  Git 리비전을 가져오는 함수입니다.
fun gitRev() =
	ProcessBuilder("git", "rev-parse", "--short", "HEAD").start().let { p ->
		p.waitFor(100, TimeUnit.MILLISECONDS)
		p.inputStream.bufferedReader().readLine() ?: "none"
	}

// Gradle 플러그인을 적용합니다.
apply {
	from("gradle/dependencyGraph.gradle")
}
