# 交给其他 AI 的提示词

一共三部分：
- **一、生成 AI 用**：按宣传片的镜头顺序排好，每个镜头都有中文和英文提示词，用哪个工具都能直接复制。
- **二、找素材 AI 用**：让能上网的 AI 去找官方公开素材。
- **三、交付要求**：发给我之前看一下，免得白做。

---

## 零、每条提示词后面都要加的“统一风格”

所有镜头都在后面接上这一段，画风才会统一：

**中文风格后缀**
```
，暴雪CG动画短片风格，风格化3D，守望先锋美术风格，手绘质感贴图，体积光，色彩饱和，电影宽银幕构图，浅景深，镜头缓慢平滑移动，超高细节，16:9
```
**English style suffix**
```
, cinematic shot from a Blizzard-style animated short film, stylized 3D, Overwatch art style, hand-painted textures, volumetric lighting, rich saturated colors, anamorphic widescreen composition, shallow depth of field, smooth slow camera movement, highly detailed, 16:9
```
**反向提示词 / Negative prompt**（工具有这一栏就填）
```
文字, 字幕, logo, 水印, 游戏界面, 准星, 模糊, 低清, 手部畸形, 多余手指, 面部扭曲, 真人实拍
text, subtitles, logo, watermark, UI, HUD, crosshair, blurry, low resolution, deformed hands, extra fingers, distorted face, live-action photo
```

> **如果工具拦截英雄名字**（有些平台不让写“守望先锋”“猎空”这类名字）：把提示词里的英雄名删掉，换成第四部分「英雄外观描述」里对应的那一段就行。

---

## 一、生成 AI 用：按镜头顺序

每个镜头要 **5–10 秒视频**。只能出图的工具就出 **16:9、至少 2560×1440 的图**，推拉、视差、光效我来加。每个镜头多生成 2–4 个版本，挑最好的发我。

### 开场

**S01 太空 · 地球日出**
```
从太空轨道俯瞰夜晚的地球，城市灯光像金色网络，太阳从地球边缘缓缓升起，蓝色大气层发光，镜头缓慢下降推近地球
```
```
Earth seen from orbit at night, golden city lights across the continents, the sun slowly rising over the curved horizon, glowing blue atmosphere, camera slowly descending toward Earth
```

**S02 温斯顿的实验室**
```
深夜的科幻实验室，巨大弧形屏幕显示发光的世界地图和“RECALL”信号，一只戴圆眼镜、穿白蓝色盔甲的大猩猩科学家背对镜头站在屏幕前，按下按钮，屏幕从蓝色变成橙色
```
```
A sci-fi laboratory at night, huge curved monitors showing a glowing world map and a RECALL signal, a giant gorilla scientist in white-and-blue armor with round glasses seen from behind, pressing a button, screens turning from blue to orange
```

**S03 监测站：直布罗陀**
```
黎明时分海边悬崖上的科幻基地，发射塔上立着一枚白色火箭，巨大的卫星天线向天空射出一道金色光柱，光环一圈圈扩散到整个天空，一只黄色的小机械鸟从天线上起飞飞向朝阳
```
```
A futuristic military base on a seaside cliff at dawn, a white rocket on its launch tower, a giant satellite dish firing a golden beam of light into the sky, rings of light expanding across the sky, a small yellow robot bird taking off from the dish toward the rising sun
```

### 世界各地（每张地图一个温暖的小故事）

**S04 国王大道 · 伦敦雨夜**
```
雨夜的伦敦街道，哥特式联排房屋亮着暖黄色窗户，维多利亚路灯，湿漉漉的石板路倒映灯光，远处雾中的钟楼；一个身形修长的人形机器人为一个小女孩撑起雨伞，小女孩抬头看它
```
```
A rainy night street in London, gothic townhouses with warm glowing windows, Victorian street lamps, wet cobblestones reflecting the lights, a clock tower in the fog; a slender humanoid robot holds an umbrella over a little girl, who looks up at it
```
**S04b 猎空闪现**
```
[猎空，守望先锋]在雨夜街道上闪现穿梭，身后拖出蓝色光带，落地后对镜头微笑
```
```
[Tracer from Overwatch] blinking across a rainy night street, leaving blue light trails behind her, landing and smiling at the camera
```

**S05 花村 · 樱花与双龙**
```
黄昏的日本古城，粉紫色天空，远处富士山，多层天守阁城堡，满开的樱花树，红色鸟居，石灯笼亮起；[半藏]和[源氏]两兄弟背靠背站在屋顶上，然后一蓝一绿两条发光的神龙缠绕着冲上天空，樱花花瓣漫天飞舞
```
```
A Japanese castle town at dusk, pink and purple sky, Mount Fuji in the distance, a tiered castle keep, cherry trees in full bloom, a red torii gate, stone lanterns glowing; the brothers [Hanzo] and [Genji] stand back to back on a rooftop, then a blue and a green glowing spirit dragon spiral together into the sky, cherry petals swirling everywhere
```

**S06 努巴尼 · 黄金时刻**
```
黄金时刻的非洲未来城市，弧形流线型高楼，空中花园，悬浮列车，彩色旗帜飘扬；一个戴头巾的11岁天才女孩骑在一台绿黄色四足守护机器人[奥丽莎]背上走过广场，市民向她们挥手
```
```
A futuristic African city at golden hour, curved streamlined towers, hanging gardens, a hover train, colorful flags; an 11-year-old genius girl in a headscarf rides on the back of a green-and-yellow four-legged guardian robot [Orisa] across a plaza as citizens wave
```

**S07 釜山 · 霓虹夜**
```
釜山海边的霓虹夜景，彩虹灯光的跨海大桥，山上的寺庙灯笼；一台粉白色的机甲[D.Va]从天而降落在海滨大道，张开粉色六边形能量护罩挡住飞来的红色导弹，身后市民得救，天空炸开烟花
```
```
Busan waterfront at night, neon lights, a suspension bridge lit in rainbow colors, a temple with lanterns on the hill; a pink-and-white mech [D.Va] lands on the promenade, projecting a pink hexagonal energy field that blocks incoming red missiles, citizens safe behind her, fireworks bursting in the sky
```

**S08 伊利奥斯 · 从天而降**
```
阳光明媚的希腊海岛，蓝顶白墙的房子层层叠叠，山顶古神庙遗迹，深蓝色大海闪闪发光；[天使]展开金色光翼从天空缓缓降下，用金色光芒复活一个倒在地上的年轻英雄
```
```
A sunny Greek island, white houses with blue domes stacked down the cliff, an ancient temple ruin on the hilltop, a sparkling deep blue sea; [Mercy] descends from the sky with glowing golden wings and revives a fallen young hero with a beam of golden light
```

**S09 尼泊尔 · 云海寺院**
```
黎明的喜马拉雅雪山，粉金色的雪峰高出云海，金顶寺院，五色经幡在风中飘动，细雪；机器人僧侣[禅雅塔]盘腿悬浮冥想，八颗金色光球环绕着他，旁边人类和机器人一起静坐
```
```
The Himalayas at dawn, pink-gold snowy peaks rising above a sea of clouds, a monastery with golden roofs, five-colored prayer flags fluttering, light snow; the robot monk [Zenyatta] floats cross-legged in meditation with eight golden orbs circling him, humans and robots meditating together beside him
```

**S10 漓江塔 · 万家灯火**
```
中国城市的节日夜晚，红灯笼挂满街道，热闹的夜市，高耸的摩天楼，成千上万盏孔明灯缓缓升上夜空，远处烟花绽放；[小美]和一个孩子一起放飞一盏孔明灯
```
```
A Chinese city on a festival night, red lanterns strung over the streets, a busy night market, a towering skyscraper, thousands of sky lanterns slowly rising into the night sky, fireworks in the distance; [Mei] and a child release a sky lantern together
```

**S11 月球基地 · 地球升起**
```
月球表面的科幻殖民基地，玻璃穹顶亮着灯，地球从月平线上缓缓升起；一只小猩猩坐在岩石上戴着眼镜仰望地球
```
```
A sci-fi colony on the Moon, glass domes glowing with light, Earth slowly rising over the lunar horizon; a young gorilla with glasses sits on a rock looking up at Earth
```

**S12 火星 · 遥望地球**
```
火星的红色峡谷，殖民地穹顶的灯光，蓝色的火星日落；一个穿白粉色宇航服、脚踩悬浮靴的年轻女孩[朱诺]站在山脊上，伸手指向天空中一颗小小的蓝色星星
```
```
Red canyons on Mars, colony domes glowing, a blue Martian sunset; a young woman [Juno] in a white-and-pink spacesuit with hover boots stands on a ridge, reaching toward a tiny blue star in the sky
```

### 黑暗与决战

**S13 黑暗降临**
```
黄昏的欧洲城市（远处有埃菲尔铁塔），天空被暴风云吞没变成暗红色，一艘巨大的黑色机械母舰带着红色光纹从云层中降下，红色探照光扫过城市，整座城市的灯光一片片熄灭
```
```
A European city at dusk with the Eiffel Tower in the distance, storm clouds swallowing the sky into dark red, a colossal black mechanical mothership with red glowing lines descending from the clouds, red searchlights sweeping the city, the city lights going out block by block
```

**S14 英雄集结**
```
暗红色天空下的屋顶，英雄们一个接一个出现，剪影逆光，每个人身上的发光细节依次亮起（蓝色、绿色、金色、粉色），面对远处的敌舰
```
```
Heroes appearing one by one on a rooftop under a dark red sky, backlit silhouettes, each one's glowing details lighting up in turn (blue, green, gold, pink), facing the enemy mothership in the distance
```

**S15 莱因哈特举盾**
```
夜晚燃烧的城市废墟，[莱因哈特]单膝前压举起巨大的蓝色六边形能量盾，挡住铺天盖地的红色激光，火花四溅，身后是年轻的队友们
```
```
A burning city ruin at night, [Reinhardt] braces and raises a huge blue hexagonal energy barrier, blocking a storm of red lasers, sparks flying, young teammates sheltering behind him
```
**S15b 护盾破碎**
```
巨型红眼机器人射出粗大的红色光束，击中蓝色能量盾，护盾出现裂纹后碎成无数六边形碎片，[莱因哈特]被震得单膝跪地
```
```
A giant red-eyed robot fires a massive red beam into the blue energy shield, the shield cracks and shatters into countless hexagonal shards, [Reinhardt] knocked down to one knee
```

**S16 大招合集**（每个单独生成）
```
[猎空]闪现绕到巨型机器人身后，贴上发蓝光的脉冲炸弹，巨大的蓝色爆炸
[安娜]在高处用步枪射出金色子弹，[源氏]被纳米激素强化全身发光，拔出发绿光的龙刃连斩一群无人机
[半藏]拉弓射箭，两条蓝色神龙螺旋着横穿战场
[D.Va]驾驶机甲冲进敌群，机甲发出粉色强光后巨大爆炸，冲击波扫过街道
[朱诺]跃到空中，天空出现巨大的粉色光环，粉色光柱照亮全队
[雾子]召唤发光的狐神，一排发光的鸟居依次出现，狐神带着队友冲锋
```
```
[Tracer] blinks behind a giant robot, sticks a glowing blue pulse bomb on it, massive blue explosion
[Ana] fires a golden round from a high ledge, [Genji] glows with a nano boost, draws a green glowing dragonblade and slashes through a swarm of drones
[Hanzo] draws his bow and releases two blue spirit dragons that spiral across the battlefield
[D.Va] flies her mech into the enemy line, it glows pink and detonates in a massive explosion, shockwave sweeping the street
[Juno] leaps into the air, a giant pink ring appears in the sky, a pink beam of light bathes the whole team
[Kiriko] summons a glowing fox spirit, a row of glowing torii gates appears one after another, the fox leads her teammates in a charge
```

**S17 全员冲锋**
```
英雄们并肩朝镜头冲锋，[天使]在上空展翅，绿色声波扩散，蓝色闪电，爆炸的火光映在他们身上，慢动作
```
```
The heroes charge side by side toward the camera, [Mercy] spreading her wings above them, green sound waves rippling, blue lightning, fire from explosions lighting them up, slow motion
```

**S18 决胜一击**
```
所有英雄的技能光束（蓝、绿、金、粉、青）汇聚成一道白光，击中黑色母舰，母舰碎裂爆炸，白光吞没画面
```
```
Every hero's ability beam (blue, green, gold, pink, cyan) converges into one white beam that strikes the black mothership, which cracks apart and explodes, white light filling the frame
```

### 黎明与结尾

**S19 日出下的剪影**
```
海边悬崖上的日出，金色阳光，十几位英雄站成一排的剪影面朝太阳，一只黄色小机械鸟飞来落在一位年轻英雄的手上
```
```
Sunrise over a seaside cliff, golden light, a line of more than ten hero silhouettes facing the sun, a small yellow robot bird flies in and lands on a young hero's hand
```

**S20 握住的手**
```
特写：一只厚重的银色盔甲手套和一只年轻人的手在太阳前紧紧相握，逆光，光晕
```
```
Close-up: a heavy silver armored gauntlet and a young person's hand clasp tightly in front of the sun, backlit, lens flare
```

**S21 小鸟（绿幕素材，用来贯穿全片）**
```
一只黄色的圆润小机械鸟，发出暖光的小眼睛，在纯绿色背景前扇动翅膀飞行，侧面、正面、起飞、落下各一段
```
```
A small round yellow robot songbird with tiny warm glowing eyes, flapping and flying in front of a pure green screen background; side view, front view, take-off and landing, one clip each
```

---

## 二、找素材 AI 用（能上网的 AI）

```
我在做一个非商业的《守望先锋》粉丝宣传片，请帮我找暴雪官方公开发布的高清素材，只要官方渠道的：
1. 官方 CG 动画短片和英雄宣传片（比如《召唤》《英雄》《双龙》《最后的堡垒》《零点时刻》，以及新英雄的起源故事短片），给出暴雪官方 YouTube / B站官方账号 / 暴雪官网的链接；
2. 暴雪官方媒体中心（press kit）里的英雄原画、地图截图和壁纸，要 1920×1080 以上；
3. 以下地图的官方高清截图或宣传图：直布罗陀、国王大道、花村、努巴尼、釜山、伊利奥斯、尼泊尔、漓江塔、地平线月球基地、巴黎；
4. 暴雪对粉丝视频使用游戏素材的官方政策原文链接。
每条都注明来源链接、分辨率、发布时间。不要非官方转载或破解提取的素材。
```

---

## 三、发给我的交付要求

- **视频**：16:9，1080p（至少 720p），5–10 秒一段，**不要带字幕、水印、logo 或界面**。
- **图片**：16:9，至少 2560×1440。单独的角色或小鸟尽量要**纯绿色背景或透明背景**，方便我合成。
- **构图**：我的成片是宽银幕，画面上下会各裁掉一点，所以重要的东西（人脸、英雄）放在画面中间。
- **文件名用镜头编号**，比如 `S05_花村_双龙_v2.mp4`、`S16_DVa自爆.mp4`，我按编号对号入座。
- **每个文件小于 30MB**。太大就剪短，或者转成 H.264 8Mbps。
- **声音**：生成的视频有声音也没关系，我会用自己的配乐和音效，你提供的英雄配音另外发。
- **优先级**：S03、S04、S05、S13、S15、S16、S19、S20 最重要，先做这几个。
- **声音相关**：不要用 AI 克隆官方声优的声音，配音还是用你打算提供的素材。

---

## 四、英雄外观描述（工具拦截名字时替换用）

| 英雄 | 中文描述 | English description |
|---|---|---|
| 猎空 Tracer | 英国年轻女性，棕色短刺头，橙色护目镜，棕色皮夹克，胸前发蓝光的圆形装置，双枪，蓝色光带 | young British woman, spiky short brown hair, orange goggles, brown leather bomber jacket, glowing blue circular device on her chest, twin pistols, blue light trails |
| 温斯顿 Winston | 戴圆眼镜的大猩猩科学家，白蓝色盔甲，电击枪，背后推进器 | giant gorilla scientist with round glasses, white-and-blue armor, tesla cannon, jump pack |
| 莱因哈特 Reinhardt | 白胡子老骑士，巨大银灰色动力装甲，狮子头盔，火箭大锤，蓝色六边形能量盾 | old knight with a white beard, massive silver-gray power armor, lion-crested helmet, huge rocket hammer, blue hexagonal energy shield |
| 天使 Mercy | 金发女性，白金色战斗服，金色机械光翼，光环，法杖 | blonde woman in a white-and-gold valkyrie suit, glowing golden mechanical wings, halo, staff |
| 源氏 Genji | 纤瘦的机械忍者，银色装甲带绿色光纹，面罩头盔，发绿光的武士刀 | slim cyborg ninja, silver armor with glowing green lines, visor helmet, katana glowing green |
| 半藏 Hanzo | 日本弓箭手，黑色马尾，一只手臂裸露带蓝龙纹身，和服，长弓，蓝色神龙 | Japanese archer, black ponytail, one bare arm with a blue dragon tattoo, kimono, longbow, blue spirit dragons |
| D.Va | 粉白色机甲带兔子标志，穿蓝色紧身服的韩国少女驾驶员，推进器 | pink-and-white mech with a bunny logo, young Korean pilot in a blue bodysuit, booster jets |
| 奥丽莎 Orisa | 绿黄色四足守护机器人，带角的头部，能量标枪 | green-and-yellow four-legged guardian robot, horned head, energy javelin |
| 禅雅塔 Zenyatta | 纤瘦的机器人僧侣，盘腿悬浮，金色光球环绕，佛珠 | slim robot monk floating cross-legged, golden orbs circling him, prayer beads |
| 小美 Mei | 戴圆眼镜的中国女科学家，发髻插铅笔，蓝色毛领羽绒服，冰枪，雪球形小无人机 | Chinese scientist with round glasses, hair bun with a pencil, blue fur-trimmed parka, ice blaster, small snowball-shaped drone |
| 朱诺 Juno | 来自火星的年轻女宇航员，白粉色宇航服，粉色发光面罩，悬浮靴 | young woman astronaut from Mars, white-and-pink spacesuit, glowing pink visor, hover boots |
| 安娜 Ana | 戴眼罩的埃及老年女狙击手，蓝色兜帽斗篷，发金光的步枪 | elderly Egyptian sniper with an eyepatch, blue hooded cloak, rifle glowing gold |
| 雾子 Kiriko | 日本少女，头侧戴狐狸面具，马尾，红白巫女风服装，苦无，发光狐狸灵 | young Japanese woman, fox mask on the side of her head, ponytail, red-and-white shrine maiden outfit, kunai, glowing fox spirit |
| 卢西奥 Lúcio | 巴西DJ，脏辫，绿黄色装甲，旱冰鞋，音波枪，绿色声波 | Brazilian DJ with dreadlocks, green-and-yellow armor, roller skates, sonic amplifier, green sound waves |
| 士兵：76 Soldier: 76 | 灰发老兵，红色发光面罩，蓝色夹克背后印“76”，脉冲步枪 | gray-haired veteran with a red glowing visor mask, blue jacket with “76”, pulse rifle |
