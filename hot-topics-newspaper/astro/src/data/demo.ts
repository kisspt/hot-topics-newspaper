/* ── Types ── */
export interface TopicItem {
  rank: number;
  title: string;
  url: string;
  hot: string;
  summary?: string;
}

export interface TopicsData {
  entertainment: TopicItem[];
  digital: TopicItem[];
  ai: TopicItem[];
}

/* ── Demo data (fallback when APIs are unreachable) ── */
const DEMO_DATA: TopicsData = {
  entertainment: [
    { rank: 1, title: "某顶流明星官宣结婚，微博服务器再次瘫痪", url: "#", hot: "999万" },
    { rank: 2, title: "《流浪地球3》定档2027春节，吴京确认回归", url: "#", hot: "856万" },
    { rank: 3, title: "金鸡奖提名公布，多部票房大片意外落选", url: "#", hot: "723万" },
    { rank: 4, title: "某选秀节目选手舞台事故，紧急送医", url: "#", hot: "651万" },
    { rank: 5, title: "国产动画电影票房突破50亿创历史纪录", url: "#", hot: "589万" },
    { rank: 6, title: "知名导演新片开机，阵容曝光引热议", url: "#", hot: "534万" },
    { rank: 7, title: "某歌手巡回演唱会门票秒罄，黄牛价翻十倍", url: "#", hot: "478万" },
    { rank: 8, title: "经典IP翻拍版预告片发布，网友评价两极分化", url: "#", hot: "423万" },
    { rank: 9, title: "某综艺节目嘉宾阵容官宣，粉丝炸锅", url: "#", hot: "367万" },
    { rank: 10, title: "短视频平台网红转型大银幕，首部电影口碑爆棚", url: "#", hot: "312万" },
  ],
  digital: [
    { rank: 1, title: "iPhone 18 Pro 渲染图曝光，全面屏设计颠覆想象", url: "#", hot: "892万" },
    { rank: 2, title: "华为发布全新折叠屏旗舰，三折叠设计惊艳全场", url: "#", hot: "834万" },
    { rank: 3, title: "小米汽车第二款SUV正式亮相，售价21.59万起", url: "#", hot: "756万" },
    { rank: 4, title: "RTX 5090显卡性能实测：比上代提升70%", url: "#", hot: "678万" },
    { rank: 5, title: "索尼发布轻量版PS5 Pro，价格下探至2999元", url: "#", hot: "612万" },
    { rank: 6, title: "大疆发布首款消费级eVTOL无人机，可载人飞行", url: "#", hot: "545万" },
    { rank: 7, title: "三星Galaxy S26 Ultra 搭载2亿像素新传感器", url: "#", hot: "489万" },
    { rank: 8, title: "国产DDR6内存条首发，频率突破12800MHz", url: "#", hot: "423万" },
    { rank: 9, title: "苹果Vision Pro 2曝光：重量减半，价格腰斩", url: "#", hot: "367万" },
    { rank: 10, title: "任天堂Switch 2国行版正式过审，即将发售", url: "#", hot: "312万" },
  ],
  ai: [
    { rank: 1, title: "GPT-5正式发布，推理能力首次超越人类专家水平", url: "#", hot: "956万" },
    { rank: 2, title: "国产大模型在MathBench上首次超越GPT系列", url: "#", hot: "878万" },
    { rank: 3, title: "Sora 2.0发布：生成4K 60fps视频仅需30秒", url: "#", hot: "812万" },
    { rank: 4, title: "OpenAI宣布AGI路线图，预计2028年实现", url: "#", hot: "734万" },
    { rank: 5, title: "全球首个AI程序员通过图灵测试，引发伦理讨论", url: "#", hot: "667万" },
    { rank: 6, title: "谷歌Gemini Ultra 2发布，多模态能力大幅跃升", url: "#", hot: "589万" },
    { rank: 7, title: "AI药物发现重大突破：新型抗癌药进入临床三期", url: "#", hot: "523万" },
    { rank: 8, title: "国内首个千亿参数开源模型发布，性能对标Llama 4", url: "#", hot: "456万" },
    { rank: 9, title: "AI Agent自主完成复杂科研实验，论文登上Nature", url: "#", hot: "398万" },
    { rank: 10, title: "欧盟AI法案正式生效，全球AI监管进入新阶段", url: "#", hot: "334万" },
  ],
};

export default DEMO_DATA;
