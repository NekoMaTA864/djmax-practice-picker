# DJMAX 練習選曲

繁體中文、手機可用的 DJMAX RESPECT V 譜面篩選器。以鍵數、難度與特徵找候選，再隨機挑 1／3／5 首。

## 功能

- 4B／6B、一般 NM／HD／MX 與 SC 分開篩選。
- 連打、交互、密集亂打、多押、長條混合、階梯、掃鍵、疊階等特徵，可選任一符合或全部符合。
- 難度範圍、標籤強度、曲包、曲名與作曲家搜尋。
- 隨機抽曲，同首歌不重複。
- 所有條件在同一張譜面上匹配，不把不同鍵數／難度的資料合併。
- 預留 V-ARCHIVE 公開暱稱欄位，只存於目前瀏覽器；**個人成績推薦尚未啟用**，設計見 RECOMMENDATION-PLAN.md。

不需要 V-ARCHIVE 金鑰，不包含個人成績備份或錄影。

## 資料與限制

6,265 張 4B／6B 譜面，其中 2,096 張有特徵資料。資料取自 xh Tool 0.2.21 APK 內附快照：曲庫原始來源 V-ARCHIVE、譜面特徵來源 Hangibot（2026-10-20）。這是靜態快照，不自動更新。

沒有標記不等於沒有該種配置。特徵值 1–3 是來源標記強度，不是官方難度或玩家能力評級。中文名稱是介面說明，原始標籤保留在資料中。第三方資料權利歸原權利人，詳見 NOTICE.md。

## 開發與部署

沒有執行期套件依賴，直接由 GitHub Pages 從 `main` 分支根目錄發布。`.nojekyll` 保持靜態檔案原樣。

```sh
node build-data.cjs
node verify.mjs
python -m http.server 8000
```

`songs-source.json`、`radar-source.json` 是保留的公開資料快照；`build-data.cjs` 產生 `data.json`。`verify.mjs` 檢查跨鍵數錯配、缺資料、複合條件與不重複抽曲。修改後提交至 main，Pages 會重新部署。

篩選偏好與使用者自行輸入的暱稱只儲存在 localStorage。頁面會向 Google Fonts 取得字體，失敗時使用系統字體；譜面參考連結導向 YouTube 搜尋。
