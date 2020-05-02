package lvw;

import net.sourceforge.pinyin4j.PinyinHelper;
import net.sourceforge.pinyin4j.format.HanyuPinyinCaseType;
import net.sourceforge.pinyin4j.format.HanyuPinyinOutputFormat;
import net.sourceforge.pinyin4j.format.HanyuPinyinToneType;
import net.sourceforge.pinyin4j.format.HanyuPinyinVCharType;
import net.sourceforge.pinyin4j.format.exception.BadHanyuPinyinOutputFormatCombination;
import java.io.FileReader;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.channels.FileChannel;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;


public class Yun {

	static final String[] RHYME_CH = {
		"麻",
		"波",
		"皆",
		"开",
		"微",
		"豪",
		"尤",
		"寒",
		"文",
		"唐",
		"庚",
		"齐",
		"支",
		"姑"
	};
	
	static final String[][] RHYME = {
		{"ua", "a", "ia"}, 
		{"uo", "o", "e"}, 
		{"ie", "u:e"},
		{"uai", "ai"}, 
		{"uei", "ei", "ui"}, 
		{"iao", "ao"}, 
		{"iou", "ou", "iu"}, 
		{"ian", "uan", "u:an", "an"}, 
		{"ien", "uen", "u:en", "en", "in", "un", "u:n"}, 
		{"iang", "uang", "ang"}, 
		{"ieng", "ueng", "iong",  "eng", "ing", "ong"},
		{"i", "er", "u:"},
		{"zhi", "chi", "shi"},
		{"u"}
		};
	
	public static void main(String[] args) throws Exception {
		Yun yun = new Yun();

		// read file 
		List<String> lines = Files.readAllLines(Paths.get("C:\\projects\\yun\\word.txt"), StandardCharsets.UTF_8);

		StringBuffer outLine;
		StringBuffer pinyin = new StringBuffer();   //  拼音
		StringBuffer rhyme = new StringBuffer();   // 平仄
		String lastRhyme = ""; // 最后一个平仄
		String lastPinyin = ""; // 最后一个拼音
		String lastYun = "";    // 最后一个字的韵
		String lastYunCh = "";  //  最后一个字的韵（中文）

		FileChannel outFileChannel = new FileOutputStream("C:\\projects\\yun\\result.txt", false).getChannel();
		ByteBuffer byteBuffer = null;


		char[] c = null;
		String[] tPys = null;
		String tTone = "";
		for (String word : lines) {
			
			outLine = new StringBuffer();
			pinyin = new StringBuffer();
			rhyme = new StringBuffer();
			lastRhyme = "";
			lastPinyin = "";
			lastYun = "";
			lastYunCh = "";
			
			word = word.trim();
			c = word.toCharArray();
			for (int i = 0; i < c.length; i++) {
				tPys = PinyinHelper.toHanyuPinyinStringArray(c[i]);
				
				if (null == tPys) {
					continue;
				}
				
				lastPinyin = tPys[0];
				pinyin.append(lastPinyin );
				tTone = lastPinyin.substring(lastPinyin.length()-1);
				lastRhyme = Integer.valueOf(tTone)>2 ? "仄" : "平";
				rhyme.append( lastRhyme );
				
			}
				
		
			outLine.append(word);
			outLine.append( " "  );
			outLine.append( pinyin  );
			outLine.append( " "  );
			outLine.append( rhyme   );
			outLine.append( " "  );
			outLine.append( lastPinyin  );
			outLine.append( " "  );
			outLine.append( lastRhyme  );
			outLine.append( " "  );
			
			
			
			
			// 处理押韵
			//lastPinyin
			lastPinyin = lastPinyin.substring(0,lastPinyin.length()-1);
			
			String[] yuns = null;
			matchyun:
			for (int i = 0; i < RHYME_CH.length; i++) {
				yuns = RHYME[i];
				
				for (int j = 0; j < RHYME[i].length; j++) {
					
					if (lastPinyin.endsWith(RHYME[i][j])) {
						lastYun = RHYME[i][j];    // 最后一个字的韵
						lastYunCh = RHYME_CH[i];  //  最后一个字的韵（中文）
						break matchyun;
					}
				}
				
			}
			
			outLine.append( lastYun  );
			outLine.append( " "  );
			outLine.append( lastYunCh  );
			outLine.append( "\r\n"  );

			byteBuffer = Charset.forName("utf8").encode(outLine.toString());
			outFileChannel.write(byteBuffer);
			
			//System.out.println(outLine.toString());
		}
		
	}



                /**
                 * @param pinyinArray
                 * @return
                 */
                private String concatPinyinStringArray(String[] pinyinArray)
                {
                    StringBuffer pinyinStrBuf = new StringBuffer();

                    if ((null != pinyinArray) && (pinyinArray.length > 0))
                    {
                        for (int i = 0; i < pinyinArray.length; i++)
                        {
                            pinyinStrBuf.append(pinyinArray[i]);
                            pinyinStrBuf.append(System.getProperty("line.separator"));
                        }
                    }
                    String outputString = pinyinStrBuf.toString();
                    return outputString;
                }
}

