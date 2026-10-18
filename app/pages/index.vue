<script setup lang="ts">
import { ArrowRight, ArrowUpRight } from 'lucide-vue-next'

useSeoMeta({
  title: '最強獵人 - MHN 魔物獵人 Now 配裝模擬器 | 自動配裝・技能計算・漂流石搭配',
  description: '最強獵人是 Monster Hunter Now 最完整的繁體中文配裝模擬器，提供所有武器、防具、技能、漂流石資料查詢，支援自動配裝與技能計算。',
  ogTitle: '最強獵人 - MHN 魔物獵人 Now 配裝模擬器',
  ogDescription: '最完整的 MHN 繁體中文配裝模擬器，查詢所有裝備資料、自動配裝、技能計算。',
})

const { sections } = useSections()

const features = [
  { en: 'Live', title: '即時計算', body: '每換一件裝備、每鍊一顆漂流石，技能等級立即加總，超出上限會直接標示。' },
  { en: 'Auto', title: '自動配裝', body: '指定最多 6 項目標技能，自動搜尋防具組合；可鎖定想保留的部位。' },
  { en: 'Share', title: '一鍵分享', body: '整套配裝都存在網址裡，複製連結就能傳給隊友。' },
]

// 等高線裝飾：狩獵地圖的意象
const CONTOURS = [
  'M280 200C281 202 280 205 279 208C278 210 276 212 274 214C272 216 269 218 267 219C264 220 261 220 258 220C255 220 252 219 250 219C248 218 246 217 243 217C241 217 238 217 235 216C233 216 230 214 228 213C227 211 226 209 226 206C225 204 226 202 225 200C225 198 224 195 224 193C224 191 225 188 226 186C228 184 230 182 233 181C236 180 239 179 241 179C244 178 247 178 250 178C253 179 255 180 257 181C260 182 261 185 262 186C264 188 264 189 266 190C268 191 272 192 274 194C276 195 279 198 280 200Z',
  'M314 198C314 203 311 209 309 213C306 217 301 221 296 224C292 227 288 230 283 232C278 234 273 235 268 235C263 235 258 234 253 234C248 233 244 233 239 232C235 232 229 232 224 231C219 229 214 226 211 223C209 219 208 214 207 210C206 206 206 202 205 198C204 194 201 189 201 184C202 180 203 174 206 170C209 166 215 163 220 161C226 159 232 159 237 158C243 158 248 158 253 159C258 160 263 162 266 164C270 166 272 170 276 172C279 174 283 176 287 178C292 180 299 181 304 185C308 188 313 193 314 198Z',
  'M347 196C347 203 340 211 335 217C330 223 322 227 316 232C310 236 305 241 298 244C292 247 284 249 277 250C270 251 263 249 256 249C249 249 243 249 235 248C228 248 219 248 212 245C206 243 199 238 195 232C191 227 190 220 188 214C186 208 184 203 182 196C180 189 176 182 176 175C177 168 180 159 186 154C191 149 201 146 209 143C218 141 227 141 234 141C242 141 249 141 256 142C263 143 269 145 275 148C281 150 285 154 291 156C298 159 305 159 312 163C320 166 331 169 337 174C343 180 348 189 347 196Z',
  'M378 194C375 203 365 213 357 220C350 228 341 233 334 239C327 245 321 251 314 256C306 260 296 264 287 265C278 267 268 266 259 266C250 266 241 266 231 265C221 264 209 264 201 260C192 256 184 249 179 242C173 235 172 226 168 218C164 210 159 203 156 194C153 185 148 174 150 165C151 156 158 145 167 139C175 133 190 131 201 129C212 127 223 127 232 127C242 127 250 126 259 126C268 126 276 128 284 130C293 132 300 134 310 137C319 139 331 141 341 145C352 150 366 156 372 164C378 172 380 185 378 194Z',
  'M403 192C398 203 384 213 376 222C367 231 359 238 352 245C344 253 339 262 330 269C321 275 309 280 298 282C286 284 274 283 262 283C250 283 239 283 226 282C214 280 200 279 189 274C178 269 169 260 162 252C154 243 151 233 145 223C140 213 132 203 128 192C125 181 120 166 124 155C128 144 140 133 152 127C164 120 183 120 196 118C209 116 220 116 231 114C242 113 251 109 262 108C273 107 284 107 295 108C307 109 318 111 331 114C344 117 360 120 372 126C385 133 400 143 405 154C410 165 408 181 403 192Z',
  'M423 190C416 203 401 213 393 224C384 235 379 243 371 253C364 263 358 276 348 283C337 291 322 296 308 299C294 302 279 299 265 299C251 299 237 300 222 298C208 296 190 295 177 289C164 283 152 273 143 263C133 253 127 241 119 229C112 217 102 204 99 190C97 176 95 159 102 147C109 134 128 123 143 117C158 111 179 112 193 109C208 106 218 105 230 101C242 97 252 89 265 86C278 83 293 80 308 81C323 81 339 84 355 89C370 93 390 99 403 108C416 117 430 132 433 145C437 159 430 177 423 190Z',
  'M440 188C432 203 418 214 410 226C403 238 400 250 393 263C386 275 379 290 366 299C354 308 335 312 318 315C302 318 285 315 268 315C251 315 235 316 218 315C200 314 180 312 164 306C147 299 133 288 121 276C109 264 100 249 92 235C84 220 74 204 73 188C72 172 76 152 87 140C97 127 121 117 139 111C156 105 176 106 191 101C206 96 213 90 226 83C239 76 252 63 268 57C284 52 304 49 323 50C341 51 360 57 378 63C396 70 417 79 430 92C443 104 454 122 456 138C457 154 447 173 440 188Z',
  'M456 186C449 202 438 214 431 229C425 243 425 259 418 273C410 288 400 305 385 314C370 324 347 327 328 329C309 332 290 329 271 330C252 330 233 335 212 334C192 334 167 333 147 326C128 318 111 304 97 290C84 275 74 258 66 241C59 223 51 204 53 186C55 168 64 148 78 135C92 121 119 114 137 106C155 99 173 99 186 91C200 82 206 69 220 58C234 47 251 30 271 23C291 17 316 16 337 19C359 21 381 31 400 41C419 51 439 63 452 78C464 94 473 114 474 132C474 150 463 170 456 186Z',
]
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-6xl">
    <!-- Hero -->
    <section class="relative isolate -mx-4 overflow-hidden px-4 pb-12 pt-10 sm:-mx-6 sm:px-6 sm:pb-16 sm:pt-16 lg:pt-20">
      <svg
        class="pointer-events-none absolute -right-40 -top-6 -z-10 w-[520px] text-border-strong sm:-right-24 sm:w-[640px] lg:right-0 lg:w-[720px]"
        viewBox="0 0 500 400"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        aria-hidden="true"
      >
        <path
          v-for="(d, i) in CONTOURS"
          :key="i"
          :d="d"
          :stroke-opacity="0.35 + i * 0.06"
          :stroke-dasharray="i === 2 ? '3 4' : undefined"
        />
        <!-- 狩獵目標標記 -->
        <g class="text-primary" stroke="currentColor" stroke-width="1.5">
          <circle cx="262" cy="196" r="7" />
          <path d="M262 182v6M262 204v6M248 196h6M270 196h6" />
        </g>
      </svg>

      <p class="eyebrow text-primary">Monster Hunter Now · Build Simulator</p>
      <h1 class="mt-5 font-display text-[2.75rem] font-black leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
        打造你的<br><span class="text-primary">最強</span>配裝
      </h1>
      <p class="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
        MHN 繁體中文配裝模擬器。查詢所有武器、防具、技能與漂流石，組合裝備即時計算技能，或交給自動配裝找出最佳解。
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <NuxtLink
          to="/build"
          class="cut-corner-sm group inline-flex h-12 items-center gap-2 bg-primary pl-6 pr-5 text-sm font-bold text-primary-foreground transition-[filter] hover:brightness-110"
        >
          開始配裝
          <ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          to="/skills"
          class="inline-flex h-12 items-center rounded-md border border-border-strong bg-background/70 px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          查詢技能
        </NuxtLink>
      </div>
    </section>

    <!-- Index -->
    <section aria-labelledby="index-heading">
      <h2 id="index-heading" class="sr-only">功能目錄</h2>
      <ol class="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
        <li
          v-for="(s, i) in sections"
          :key="s.path"
          class="bg-card"
          :class="i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''"
        >
          <NuxtLink
            :to="s.path"
            class="group flex h-full items-center gap-4 p-4 transition-colors hover:bg-secondary/60 sm:items-start sm:p-5 lg:flex-col lg:gap-8"
          >
            <span
              class="flex size-10 flex-shrink-0 items-center justify-center rounded-md transition-colors"
              :class="i === 0 ? 'cut-corner-sm rounded-none bg-primary text-primary-foreground' : 'bg-secondary text-foreground group-hover:text-primary'"
            >
              <component :is="s.icon" class="size-5" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-2">
                <span class="font-num text-xs font-semibold tabular-nums text-muted-foreground">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="eyebrow text-[0.625rem] text-muted-foreground">{{ s.en }}</span>
              </p>
              <h3 class="mt-1.5 text-base font-bold text-foreground">{{ s.title }}</h3>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ s.description }}</p>
            </div>
            <ArrowUpRight
              class="size-4 flex-shrink-0 text-muted-foreground transition-[color,translate] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary lg:hidden"
              aria-hidden="true"
            />
          </NuxtLink>
        </li>
      </ol>
    </section>

    <!-- Features -->
    <section class="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6" aria-label="特色">
      <div v-for="(f, i) in features" :key="f.en" class="border-t border-border-strong pt-4">
        <p class="flex items-baseline gap-2">
          <span class="font-num text-2xl font-semibold leading-none tabular-nums text-primary">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="eyebrow text-muted-foreground">{{ f.en }}</span>
        </p>
        <h3 class="mt-3 text-[0.9375rem] font-bold text-foreground">{{ f.title }}</h3>
        <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">{{ f.body }}</p>
      </div>
    </section>

    <p class="mt-16 text-center text-[0.6875rem] text-muted-foreground">非官方粉絲工具・資料僅供參考</p>
  </div>
</template>
