#!/usr/bin/env python3
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
