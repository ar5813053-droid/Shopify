#!/usr/bin/env python3
from pathlib import Path
import re

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

app_gradle = Path("android/app/build.gradle")
if app_gradle.exists():
    t = app_gradle.read_text()
    # Force release to use debug signing + no minify (prevents R8 strip crashes)
    if "signingConfig signingConfigs.debug" not in t:
        t = t.replace(
            "release {",
            "release {\n            signingConfig signingConfigs.debug",
            1,
        )
    # minifyEnabled false
    t = re.sub(
        r"(release\s*\{[^}]*?)minifyEnabled\s+true",
        r"\1minifyEnabled false",
        t,
        flags=re.S,
    )
    if "minifyEnabled" not in t.split("release {")[1].split("}")[0] if "release {" in t else "":
        t = t.replace(
            "release {\n            signingConfig signingConfigs.debug",
            "release {\n            signingConfig signingConfigs.debug\n            minifyEnabled false\n            shrinkResources false",
            1,
        )
    # also ensure enableProguardInReleaseBuilds false patterns
    t = t.replace("enableProguardInReleaseBuilds = true", "enableProguardInReleaseBuilds = false")
    app_gradle.write_text(t)
    print("app/build.gradle release: debug sign, minify off")

print("patch done")
