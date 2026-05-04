javac -encoding UTF-8 -cp "./src/main/java/;./lib/pinyin4j-2.5.0.jar" -d ./target ./src/main/java/lvw/*.java
java -cp "./target/;./lib/pinyin4j-2.5.0.jar" lvw.Yun "./yun.txt"
