### Requirement: Weapon data schema
系統 SHALL 定義武器 JSON Schema，每件武器包含以下欄位：id (string)、name (繁體中文 string)、nameEn (英文 string)、type (武器類型 enum)、rarity (number)、attack (number)、element (屬性 object, nullable)、affinity (會心率 number)、skills (技能陣列，含 skillId 與 level)、materials (升級素材陣列)、image (圖片路徑 string)。

#### Scenario: Load great sword weapon data
- **WHEN** 系統載入 `/data/weapons/great-sword.json`
- **THEN** 每件武器物件 SHALL 包含 id、name、nameEn、type="great-sword"、rarity、attack、element、affinity、skills、materials、image 欄位

#### Scenario: Weapon with element
- **WHEN** 武器具有屬性攻擊（如火屬性太刀）
- **THEN** element 欄位 SHALL 包含 type ("fire"|"water"|"thunder"|"ice"|"dragon"|"poison"|"paralysis"|"sleep"|"blast") 和 value (number)

#### Scenario: Weapon without element
- **WHEN** 武器為無屬性武器
- **THEN** element 欄位 SHALL 為 null

### Requirement: Weapon type coverage
系統 SHALL 支援 MHN 所有武器類型，每種類型一個獨立 JSON 檔案。武器類型包含：大劍 (great-sword)、太刀 (long-sword)、片手劍 (sword-and-shield)、錘 (hammer)、弓 (bow)、輕弩 (light-bowgun)，以及遊戲後續更新的其他武器類型。

#### Scenario: All weapon type files exist
- **WHEN** 系統初始化載入武器資料
- **THEN** `/data/weapons/` 目錄下 SHALL 存在每種武器類型對應的 JSON 檔案

### Requirement: Armor data schema
系統 SHALL 定義防具 JSON Schema，每件防具包含以下欄位：id (string)、name (繁體中文 string)、nameEn (英文 string)、setName (套裝名稱 string)、part (部位 enum: "head"|"chest"|"arms"|"waist"|"legs")、rarity (number)、defense (number)、skills (技能陣列，含 skillId 與 level)、resistances (屬性耐性 object，含 fire/water/thunder/ice/dragon 各一個 number)、materials (升級素材陣列)、hasDriftstoneSlot (boolean)、image (圖片路徑 string)。所有數值 SHALL 基於滿級（超級鍛造最高階）。

#### Scenario: Load head armor data
- **WHEN** 系統載入 `/data/armor/head.json`
- **THEN** 每件防具物件 SHALL 包含完整的 schema 欄位，且 part 值為 "head"

#### Scenario: Armor with driftstone slot
- **WHEN** 防具支援漂流石鑲嵌
- **THEN** hasDriftstoneSlot SHALL 為 true

### Requirement: Armor part file organization
系統 SHALL 將防具資料按部位分為 5 個 JSON 檔案：head.json、chest.json、arms.json、waist.json、legs.json，存放在 `/data/armor/` 目錄下。

#### Scenario: Five armor part files
- **WHEN** 系統載入防具資料
- **THEN** `/data/armor/` 目錄下 SHALL 恰好存在 head.json、chest.json、arms.json、waist.json、legs.json 五個檔案

### Requirement: Skill data schema
系統 SHALL 定義技能 JSON Schema，每個技能包含以下欄位：id (string)、name (繁體中文 string)、nameEn (英文 string)、description (string)、maxLevel (number)、category (分類 enum: "attack"|"element"|"defense"|"resistance"|"utility")、levels (陣列，每個等級含 level 與 effect 描述)。

#### Scenario: Load all skills
- **WHEN** 系統載入 `/data/skills.json`
- **THEN** 每個技能物件 SHALL 包含 id、name、nameEn、description、maxLevel、category、levels 欄位

#### Scenario: Skill level details
- **WHEN** 技能具有多個等級（如攻擊 Lv1~Lv5）
- **THEN** levels 陣列 SHALL 包含 maxLevel 個元素，每個元素含 level (number) 和 effect (string) 欄位

### Requirement: Driftstone data schema
系統 SHALL 定義漂流石 JSON Schema，涵蓋 15 種神秘漂流石（A～O）。每種漂流石包含：id (string, "A"~"O")、name (繁體中文名稱 string，如「神秘漂流石【A】」)、possibleSkills (可能技能 id 陣列)。

#### Scenario: Load all driftstones
- **WHEN** 系統載入 `/data/driftstones.json`
- **THEN** SHALL 包含 15 個漂流石物件（A 至 O）

#### Scenario: Driftstone possible skills
- **WHEN** 載入神秘漂流石【G】
- **THEN** possibleSkills SHALL 包含「超會心」、「看破」、「弱點特效」三個技能的 id

### Requirement: Material data schema
系統 SHALL 定義素材 JSON Schema，每個素材包含：id (string)、name (繁體中文 string)、nameEn (英文 string)、source (來源描述 string)、rarity (number)。

#### Scenario: Load materials
- **WHEN** 系統載入 `/data/materials.json`
- **THEN** 每個素材物件 SHALL 包含 id、name、nameEn、source、rarity 欄位

### Requirement: Data completeness
系統 SHALL 收錄 MHN 當前版本的所有武器與防具資料。所有數值基於滿級狀態（超級鍛造最高階）。

#### Scenario: All armor sets included
- **WHEN** 使用者瀏覽防具列表
- **THEN** SHALL 顯示 MHN 當前版本所有可鍛造的防具

#### Scenario: All weapon trees included
- **WHEN** 使用者瀏覽武器列表
- **THEN** SHALL 顯示 MHN 當前版本所有可鍛造的武器
