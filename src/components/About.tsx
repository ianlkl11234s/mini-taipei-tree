import { IconAlert, IconLayers, IconInfo, IconTree } from "./icons";

/**
 * 關於資料 / 方法論。Hero 與各圖的免責連結指向此處。
 * 四點誠實聲明（PLAN §7）+ 衛星互證故事（松仁路）+ 資料來源 + 授權。
 * 文案鐵則：一律「從清冊消失」，不寫「被砍」。
 */
const NOTES = [
  {
    ic: <IconAlert size={16} />,
    h: "「消失」不等於「被砍」",
    p: (
      <>
        地圖上的「消失」只代表某棵樹的<b>編號在下一個時點從官方清冊上不見了</b>。真實原因可能是移除、
        枯死，也可能只是行政上的重新編號。粗估這一類疑似重編號：2022→2024 段約 17%（1,076／6,189 筆消失），
        2024→2026 段約 3%（221／7,494 筆）。地圖上這些點以半透明標示，請勿逕自解讀為「砍除」。
      </>
    ),
  },
  {
    ic: <IconLayers size={16} />,
    h: "三個時點怎麼來",
    p: (
      <>
        2024-11 與 2026-07 為台北市政府公園處官方逐棵清冊；2022-10 取自 Wayback Machine 對同一份開放資料的
        存檔（<b>非官方版本化資料</b>）。三時點以樹編號比對，建立每一棵樹「出現 / 消失 / 維持」的軌跡。
      </>
    ),
  },
  {
    ic: <IconInfo size={16} />,
    h: "看得到「有沒有」，看不到「哪一天」",
    p: (
      <>
        公園處清冊只有批次更新戳記（UpdDate），沒有逐筆異動時間。因此我們能說某棵樹「在兩個時點之間消失了」，
        卻無法定位到<b>確切哪一天</b>。時序解析度就是三個快照，不是連續時間軸。
      </>
    ),
  },
  {
    ic: <IconTree size={16} />,
    h: "資料品質與清理",
    p: (
      <>
        原始欄位有髒值：樹高欄偶把年份誤植為高度（曾見 2023），超過 60m 一律視為未知；2022 年的胸徑單位與後期
        相差 100 倍。管線都已統一（樹高 &gt;60m→未知、胸徑一律換算公分）再比對，方法上力求跨時點可比。
      </>
    ),
  },
];

const SOURCES = [
  {
    t: "台北市政府公園處 · 行道樹逐棵清冊",
    d: "data.taipei 開放資料集（編號 128274，含經緯度、樹種、胸徑、樹高、調查日）。2024-11、2026-07 為官方版本。",
    href: "https://data.taipei/dataset?qs=%E8%A1%8C%E9%81%93%E6%A8%B9",
    linkText: "data.taipei 搜尋「行道樹」",
  },
  {
    t: "同源逐棵資料檔（blob）",
    d: "公園處託管的 TaipeiTree.csv（約 9 萬棵）；同源另有樹穴 TaipeiTreeHole.csv。",
    href: "https://tppkl.blob.core.windows.net/blobfs/TaipeiTree.csv",
    linkText: "TaipeiTree.csv",
  },
  {
    t: "Wayback Machine · 2022-10-15 清冊存檔",
    d: "Internet Archive 對同一份開放資料的歷史快照，用以還原三時點中最早的一期。",
    href: "https://web.archive.org/",
    linkText: "Internet Archive",
  },
  {
    t: "官方樹木故事平臺（延伸）",
    d: "台北市樹木保護與故事平臺，可查個別受保護樹木。",
    href: "https://eculture.gov.taipei/trees/zh-tw",
    linkText: "eculture.gov.taipei",
  },
];

export function About() {
  return (
    <section id="about" className="section-band">
      <div className="section-kicker">
        <span className="idx">03</span>
        <span className="rule" />
      </div>
      <h2 className="section-title">關於這份資料</h2>
      <p className="section-sub">
        在下任何結論前，請先讀這幾點——資料能說什麼、不能說什麼，一樣重要。
      </p>

      <div className="about-grid">
        {NOTES.map((n) => (
          <div className="about-card" key={n.h}>
            <div className="ac-h">
              <span className="ac-ic">{n.ic}</span>
              {n.h}
            </div>
            <p>{n.p}</p>
          </div>
        ))}
      </div>

      {/* 資料來源 */}
      <h3 className="about-subh">資料來源</h3>
      <div className="source-list">
        {SOURCES.map((s) => (
          <div className="source-item" key={s.t}>
            <div className="si-body">
              <div className="si-t">{s.t}</div>
              <div className="si-d">{s.d}</div>
            </div>
            <a className="si-link" href={s.href} target="_blank" rel="noopener noreferrer">
              {s.linkText} →
            </a>
          </div>
        ))}
      </div>

      {/* 授權 */}
      <div className="license-box">
        <p>
          <b>資料授權</b>：原始資料為台北市政府公園處開放資料，依「政府資料開放授權條款」釋出（data.taipei）。
          三時點比對、統計與視覺化為本站自行產製，上游清洗管線位於 taipei-gis-analytics（street_tree_removal 主題）。
        </p>
        <p>
          <b>定位</b>：本站為<b>非官方</b>民眾探索工具，僅呈現公開清冊在不同時點的比對結果，不對任何個別樹木的去向下定論。
        </p>
      </div>
    </section>
  );
}
