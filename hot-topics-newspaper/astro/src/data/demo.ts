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
    { rank: 1, title: "抖音热搜：某顶流明星官宣结婚", url: "#", hot: "1155万" },
    { rank: 2, title: "热门综艺最新一期嘉宾阵容曝光", url: "#", hot: "856万" },
    { rank: 3, title: "国产动画电影票房突破50亿", url: "#", hot: "723万" },
    { rank: 4, title: "某歌手巡回演唱会门票秒罄", url: "#", hot: "651万" },
    { rank: 5, title: "经典IP翻拍版预告片引热议", url: "#", hot: "589万" },
    { rank: 6, title: "短视频平台网红转型大银幕", url: "#", hot: "534万" },
    { rank: 7, title: "某选秀节目选手舞台事故", url: "#", hot: "478万" },
    { rank: 8, title: "金鸡奖提名公布多部大片落选", url: "#", hot: "423万" },
    { rank: 9, title: "知名导演新片开机阵容曝光", url: "#", hot: "367万" },
    { rank: 10, title: "春节档电影预售票房创新高", url: "#", hot: "312万" },
  ],
  digital: [
    { rank: 1, title: "iPhone 18 Pro 渲染图曝光，全面屏设计颠覆想象", url: "#", hot: "" },
    { rank: 2, title: "华为发布全新折叠屏旗舰，三折叠设计惊艳全场", url: "#", hot: "" },
    { rank: 3, title: "小米汽车第二款SUV正式亮相，售价21.59万起", url: "#", hot: "" },
    { rank: 4, title: "RTX 5090显卡性能实测：比上代提升70%", url: "#", hot: "" },
    { rank: 5, title: "索尼发布轻量版PS5 Pro，价格下探至2999元", url: "#", hot: "" },
    { rank: 6, title: "大疆发布首款消费级eVTOL无人机", url: "#", hot: "" },
    { rank: 7, title: "三星Galaxy S26 Ultra搭载2亿像素传感器", url: "#", hot: "" },
    { rank: 8, title: "国产DDR6内存条首发，频率突破12800MHz", url: "#", hot: "" },
    { rank: 9, title: "苹果Vision Pro 2曝光：重量减半价格腰斩", url: "#", hot: "" },
    { rank: 10, title: "任天堂Switch 2国行版正式过审", url: "#", hot: "" },
  ],
  ai: [
    { rank: 1, title: "GPT-5正式发布，推理能力首次超越人类专家水平", url: "#", hot: "" },
    { rank: 2, title: "国产大模型在MathBench上首次超越GPT系列", url: "#", hot: "" },
    { rank: 3, title: "Sora 2.0发布：生成4K 60fps视频仅需30秒", url: "#", hot: "" },
    { rank: 4, title: "OpenAI宣布AGI路线图，预计2028年实现", url: "#", hot: "" },
    { rank: 5, title: "全球首个AI程序员通过图灵测试", url: "#", hot: "" },
    { rank: 6, title: "谷歌Gemini Ultra 2发布，多模态能力大幅跃升", url: "#", hot: "" },
    { rank: 7, title: "AI药物发现重大突破：新型抗癌药进入临床三期", url: "#", hot: "" },
    { rank: 8, title: "国内首个千亿参数开源模型发布", url: "#", hot: "" },
    { rank: 9, title: "AI Agent自主完成复杂科研实验", url: "#", hot: "" },
    { rank: 10, title: "欧盟AI法案正式生效，全球监管进入新阶段", url: "#", hot: "" },
  ],
};

export default DEMO_DATA;
