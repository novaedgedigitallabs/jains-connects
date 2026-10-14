plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

fun configuredReleaseValue(name: String): String? {
    return providers.gradleProperty(name).orNull?.takeIf { it.isNotBlank() }
        ?: providers.environmentVariable(name).orNull?.takeIf { it.isNotBlank() }
}

val releaseStoreFilePath = configuredReleaseValue("JAINCONNECT_RELEASE_STORE_FILE")
val releaseStorePassword = configuredReleaseValue("JAINCONNECT_RELEASE_STORE_PASSWORD")
val releaseKeyAlias = configuredReleaseValue("JAINCONNECT_RELEASE_KEY_ALIAS")
val releaseKeyPassword = configuredReleaseValue("JAINCONNECT_RELEASE_KEY_PASSWORD")
val hasCompleteReleaseSigning = listOf(
    releaseStoreFilePath,
    releaseStorePassword,
    releaseKeyAlias,
    releaseKeyPassword,
).all { it != null }

android {
    namespace = "com.novaedge.jainconnect"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.novaedge.jainconnect"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    if (hasCompleteReleaseSigning) {
        signingConfigs {
            create("release") {
                storeFile = rootProject.file(releaseStoreFilePath!!)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            if (hasCompleteReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

gradle.taskGraph.whenReady {
    val releaseTaskRequested = allTasks.any { task ->
        task.name.contains("Release", ignoreCase = true)
    }
    if (!releaseTaskRequested) return@whenReady

    if (!hasCompleteReleaseSigning) {
        throw GradleException(
            "Release signing is not configured. Set JAINCONNECT_RELEASE_STORE_FILE, " +
                "JAINCONNECT_RELEASE_STORE_PASSWORD, JAINCONNECT_RELEASE_KEY_ALIAS, " +
                "and JAINCONNECT_RELEASE_KEY_PASSWORD via Gradle properties or the " +
                "environment before building a release. Debug signing is not allowed.",
        )
    }

    val storeFile = rootProject.file(releaseStoreFilePath!!)
    if (!storeFile.isFile) {
        throw GradleException(
            "The configured JainConnect release keystore does not exist: ${storeFile.path}",
        )
    }
}

flutter {
    source = "../.."
}
