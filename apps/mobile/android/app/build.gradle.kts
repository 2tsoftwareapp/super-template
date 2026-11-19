plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

// Release signing reads android/key.properties (Flutter's documented format:
// storeFile, storePassword, keyAlias, keyPassword). The file is gitignored
// because it holds the keystore passwords.
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = java.util.Properties()
if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
}

android {
    namespace = "com.example.mobile_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Both `namespace` and `applicationId` are rebranded by
        // `node scripts/rename.mjs "<Project Name>"` (com.<project-name>.app);
        // edit them by hand only if you need a different identifier.
        applicationId = "com.example.mobile_app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            // Null when key.properties is absent; the task-graph check below
            // then fails the release build instead of silently using debug keys.
            signingConfig = signingConfigs.findByName("release")
        }
    }
}

// A release build must never be signed with the debug keystore, and AGP would
// happily assemble an unsigned APK when no signing config is set. Fail loudly
// only when a release task is actually requested, so debug builds still work.
gradle.taskGraph.whenReady {
    val releaseRequested = allTasks.any { it.name.contains("Release") }
    if (!keystorePropertiesFile.exists() && releaseRequested) {
        throw GradleException(
            "Release signing is not configured. Create apps/mobile/android/key.properties " +
                "with storeFile, storePassword, keyAlias and keyPassword " +
                "(see apps/mobile/README.md -> \"Release signing\")."
        )
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
