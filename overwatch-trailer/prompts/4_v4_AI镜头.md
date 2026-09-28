# 提示词 4：v4.1 剧本需要 AI 生成的镜头

适用：可灵、即梦、海螺、Runway、Midjourney、豆包等。
对应剧本：`SCRIPT_v4.md`（《第一场雨》v4.1）。

## AI 在 v4.1 里负责什么

- **人物的连续表演全部用游戏录屏**，AI 很难让同一个角色在不同镜头里长得一样。
- **AI 只做三类镜头**：
  - 不露脸的特写：手、靴子、护盾、城门、拉杆；
  - 没有人物的场景：天空、远景、运输机；
  - 录屏拍不到的机关：城门开合。
- **画风**：要贴近《守望先锋 2》的游戏画面，而不是 CG 短片，否则和录屏接在一起会跳。所以这版的风格后缀和前几版不一样。
- **不要让 AI 生成的艾兴瓦尔德和录屏里的同一个角度前后相接**，两者的建筑结构对不上。AI 远景只用在转场。

## 先粘贴给 AI 的说明

```
我在做一部非商业的《守望先锋》粉丝短片，需要你按下面的描述逐个生成镜头。要求：
1. 画风贴近《守望先锋2》游戏内画面：风格化写实3D，手绘质感贴图，色彩饱和但不过曝。
2. 视频每段5秒，16:9，1080p，镜头缓慢平滑，一段里不切镜头；只能出图就出16:9、至少2560×1440。
3. 画面里不要出现任何文字、字幕、logo、水印、游戏界面。
4. 特写镜头里只出现手、脚或物体，不要出现人脸。
5. 每个镜头生成2–4个版本。
```

## 风格后缀（每条提示词后面都加上）

**中文**
```
，守望先锋2游戏画面风格，风格化写实3D，手绘质感贴图，电影感布光，浅景深，镜头缓慢平滑移动，超高细节，16:9
```
**English**
```
, Overwatch 2 in-game graphics style, stylized realistic 3D, hand-painted textures, cinematic lighting, shallow depth of field, smooth slow camera movement, highly detailed, 16:9
```
**反向提示词 / Negative prompt**
```
文字, 字幕, logo, 水印, 游戏界面, 人脸, 手部畸形, 多余手指, 模糊, 低清, 真人实拍, 卡通, 动漫
text, subtitles, logo, watermark, UI, HUD, faces, deformed hands, extra fingers, blurry, low resolution, live-action photo, cartoon, anime
```

## 镜头

优先级：★★★ 必须要；★★ 最好有；★ 录屏拍不到时的备用。

### 第一幕

**A01 雨打能量盾 ★★★**（1-01，全片的第一个画面）
```
慢动作极近景，夜晚的斜雨打在一面竖直的蓝色半透明六边形能量护盾上，每一滴雨撞上去都溅开一圈蓝色微光，护盾表面有细细的水流，背景是虚化的暖黄色路灯
```
```
Extreme slow-motion close-up, slanted night rain hitting a vertical translucent blue hexagonal energy shield, every raindrop bursting into a small ring of blue light on impact, thin streams of water running down its surface, background of blurred warm yellow street lights
```

**A02 手心接雨 ★★★**（1-03）
```
特写，一只戴白色和粉色太空服手套的手从画面边缘慢慢伸出，手心朝上，雨滴落在掌心溅开，背景是虚化的伦敦雨夜街道和暖黄色窗户
```
```
Close-up, a hand in a white-and-pink spacesuit glove slowly reaching out from the edge of frame, palm up, raindrops landing and splashing in the palm, background of a blurred rainy London night street with warm yellow windows
```

**A03a 孔明灯特写 ★★★**（1-08）。灯上不要写字，字由我在后期加。
```
特写，一盏空白的纸质孔明灯被点亮，暖橙色光透过纸面，缓缓离开画面下方升起，周围是虚化的红灯笼和夜市灯光
```
```
Close-up, a blank paper sky lantern glowing warm orange from within, slowly lifting up and away from the bottom of frame, surrounded by blurred red lanterns and night market lights
```

**A03b 灯升上夜空 ★★★**（1-08）
```
一盏孔明灯缓缓升入深蓝色夜空，镜头跟着它向上摇，城市灯光在画面下方渐渐远去，满天星星里有一颗明显的小红星
```
```
A single sky lantern slowly rising into a deep blue night sky, camera tilting up to follow it, city lights falling away at the bottom of frame, among the stars one distinct small red star
```

### 第二幕

**A04 Talon 运输机 ★★**（2-01）
```
暴雨中的黄昏，一架黑色的军用运输机悬停在德国中世纪城堡村庄上空，机身有暗红色灯光，两道白色探照灯光柱穿过雨幕扫向地面，远处电闪雷鸣
```
```
Stormy dusk, a black military dropship with dark red lights hovering over a medieval German castle village, two white searchlight beams cutting through the rain and sweeping the ground, lightning in the distance
```

**A05 石桥爆炸 ★**（2-05）
```
暴雨黄昏，通往城堡的古老石桥中段发生爆炸，碎石和火光飞起，雨水在火光中闪亮，远处是城堡大门
```
```
Stormy dusk, an explosion in the middle of an old stone bridge leading to a castle, stone debris and fire flying up, rain glittering in the firelight, the castle gate in the distance
```

**A06 拉下铁闸拉杆 ★★★**（2-08 关门、3-07 开门）
```
特写，城堡门楼里一根沉重的铁制拉杆，一只戴绿黄色装甲手套的手握住它，停顿一下，然后用力拉下，墙上的红灯亮起，火花溅出
```
```
Close-up, a heavy iron lever inside a castle gatehouse, a hand in a green-and-yellow armored glove grips it, hesitates for a moment, then pulls it down hard, a red lamp on the wall lights up, sparks fly
```
开门那一次，我把这段倒放或者换色使用，也可以单独再生成一条“往上推，灯变绿”。

**A07a 城门合上 ★★★**（2-09）
```
从城门内侧看，巨大的铁钉木质城门两扇缓缓合拢，门缝越来越窄，门外是暴雨和一团越来越小的蓝色光芒，最后完全合上，画面变暗
```
```
View from inside a castle, two huge iron-studded wooden gate doors slowly closing, the gap narrowing, outside is heavy rain and a blue glow that grows smaller, until the gate shuts completely and the frame goes dark
```

**A07b 城门开缝 ★★★**（3-07）
```
从城门内侧看，巨大的铁钉木质城门在暴雨中裂开一道缝，一道金色的光从门缝里照进来，照亮飞溅的雨水
```
```
View from inside a castle, a huge iron-studded wooden gate cracks open in the storm, a beam of golden light pouring in through the gap, lighting up the flying rain
```

### 第三幕

**A08 护盾碎裂 ★**（3-01。游戏里有原生的碎裂动画，这条是备用）
```
暴雨中，一面蓝色六边形能量护盾在密集的子弹下出现蛛网状裂纹，然后碎成无数蓝色光片，被雨水打散
```
```
In heavy rain, a blue hexagonal energy shield cracks in a spiderweb pattern under a hail of bullets, then shatters into countless blue light shards scattered by the rain
```

**A09 靴子推进器 ★★**（3-03）
```
低角度特写，一双白色和粉色的太空靴站在湿漉漉的城墙石边上，靴底推进器亮起蓝绿色光，雨水被气流吹开，墙下十米是战场的火光
```
```
Low-angle close-up, a pair of white-and-pink space boots standing on the wet stone edge of a castle wall, the boot thrusters igniting with teal light, rain blown away by the thrust, battlefield fire ten meters below
```

### 第四幕

**A10 两只手接雨 ★★★**（4-02，全片最后一个情绪镜头）
```
特写，两只手并排、手心朝上，左边是一只戴白色和粉色太空手套的小手，右边是一只巨大的银灰色装甲铁手套，两只手之间隔着一点距离，没有碰到，零星的雨滴落在手心，背后是雨后金色的夕阳逆光
```
```
Close-up, two hands side by side, palms up: on the left a small hand in a white-and-pink spacesuit glove, on the right a huge silver-gray armored gauntlet, a small gap between them, not touching, a few raindrops landing in both palms, golden sunset backlight after the rain
```

**A11a 城堡暴雨远景 ★**（转场用）
```
暴雨黄昏，森林山丘上的德国中世纪城堡远景，石桥通向城门，乌云压顶，闪电照亮城堡轮廓
```
```
Stormy dusk, wide shot of a medieval German castle on a forested hill, a stone bridge leading to its gate, heavy dark clouds, lightning illuminating the castle silhouette
```

**A11b 城堡雨过天晴 ★★**（4-01）
```
同一座德国中世纪城堡，暴雨刚停，云层裂开，金色阳光一束束落下来，湿漉漉的石墙和屋顶反着金光，森林里升起薄雾，还飘着零星的雨
```
```
The same medieval German castle just after a storm, clouds breaking apart, shafts of golden sunlight falling through, wet stone walls and roofs glowing gold, mist rising from the forest, a few last raindrops falling
```

## 之前生成的素材还能用哪些

| 旧编号 | 内容 | 在 v4.1 里的用法 |
|---|---|---|
| S04 | 伦敦雨夜街道 | 1-02 的开场远景或背景 |
| S08 | 希腊海岛 | 1-05 的海景插入 |
| S05 | 花村黄昏樱花 | 1-06 的开场远景 |
| S07 | 釜山霓虹夜景 | 1-07 的开场远景 |
| S10 | 漓江塔节日夜晚、孔明灯 | 1-08（可以代替 A03b） |
| S15b | 护盾破碎 | 3-01 的备用（同 A08） |
| 其他（太空、直布罗陀、努巴尼、尼泊尔、月球、火星、巴黎、废墟、日出悬崖、英雄亮相、握手、小鸟） | | v4.1 不再使用 |

## 交付

- 文件名用编号，比如 `A07a_城门合上_v2.mp4`。
- 每个文件小于 30 MB，太大就剪短，或者转成 H.264、8 Mbps。
- 优先做这 7 条：**A01、A02、A03a、A03b、A06、A07a、A10**。
