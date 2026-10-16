#!/usr/bin/env python3
"""Patch Android project after expo prebuild for sideloadable release APK."""
from pathlib import Path

props = Path("android/gradle.properties")
if props.exists():
    t = props.read_text()
    t = t.replace("newArchEnabled=true", "newArchEnabled=false")
    if "newArchEnabled" not in t:
        t += "\nnewArchEnabled=false\n"
    if "kotlin.jvm.target.validation.mode" not in t:
        t += "\nkotlin.jvm.target.validation.mode=warning\n"
    if "org.gradle.jvmargs" not in t:
        t += "\norg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m\n"
    # Ensure JS is bundled (not loaded from Metro)
    if "EX_DEV_CLIENT_NETWORK_INSPECTOR" in t:
        t = t.replace("EX_DEV_CLIENT_NETWORK_INSPECTOR=true", "EX_DEV_CLIENT_NETWORK_INSPECTOR=false")
    props.write_text(t)
    print("gradle.properties patched")

root = Path("android/build.gradle")
if root.exists():
    t = root.read_text()
    if "jvmTarget" not in t:
        t += '''
subprojects { sub ->
  sub.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions { jvmTarget = "17" }
  }
}
'''
        root.write_text(t)
        print("root build.gradle patched")

# Use debug keystore for release so APK is sideloadable without secrets
app_gradle = Path("android/app/build.gradle")
if app_gradle.exists():
    t = app_gradle.read_text()
    if "signingConfigs.release" not in t:
        # inject release signing = debug
        needle = "buildTypes {"
        inject = """signingConfigs {
        release {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
"""
        if needle in t and "signingConfigs {" in t:
            # replace release buildType to use debug signing
            import re
            t2 = re.sub(
                r"(release\s*\{[^}]*)(signingConfig\s+signingConfigs\.\w+)?",
                lambda m: m.group(0) if "signingConfig" in m.group(0) else m.group(1) + "\n            signingConfig signingConfigs.debug\n",
                t,
                count=1,
            )
            # simpler: force all release to debug signing
            if "signingConfig signingConfigs.debug" not in t2 and "release {" in t2:
                t2 = t2.replace(
                    "release {",
                    "release {\n            signingConfig signingConfigs.debug",
                    1,
                )
            t = t2
        else:
            t = t.replace(needle, inject)
        app_gradle.write_text(t)
        print("app/build.gradle release signing -> debug")
    else:
        print("signing already present")

# Copy debug keystore path note - gradle uses android/app/debug.keystore from AGP defaults
print("patch done")
