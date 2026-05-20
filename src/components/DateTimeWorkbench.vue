<template>
  <div class="datetime-workbench">
    <div class="datetime-shell">
      <header class="datetime-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>
        <h1 class="datetime-title">日期时间计算</h1>
      </header>

      <div class="datetime-columns">
        <!-- 日期间隔 -->
        <div class="datetime-card">
          <h2 class="datetime-card-title">日期间隔</h2>

          <div class="datetime-label">开始时间</div>
          <div class="datetime-row">
            <div class="datetime-stepper">
              <input
                v-model.number="sYear"
                class="dt-stepper-input"
                type="number"
                min="1"
                max="9999"
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="sYear++"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="sYear--"
                >▼</button>
              </div>
            </div>
            <span class="dt-sep">-</span>
            <select
              v-model.number="sMonth"
              class="dt-select dt-select-sm"
            >
              <option
                v-for="m in 12"
                :key="m"
                :value="m"
              >{{ pad2(m) }}</option>
            </select>
            <span class="dt-sep">-</span>
            <select
              v-model.number="sDay"
              class="dt-select dt-select-sm"
            >
              <option
                v-for="d in maxDaysStart"
                :key="d"
                :value="d"
              >{{ pad2(d) }}</option>
            </select>
            <span class="dt-sep-space" />
            <div class="datetime-stepper">
              <input
                :value="String(sHour).padStart(2, '0')"
                class="dt-stepper-input"
                readonly
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="incStartHour"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="decStartHour"
                >▼</button>
              </div>
            </div>
            <span class="dt-sep">:</span>
            <div class="datetime-stepper">
              <input
                :value="String(sMin).padStart(2, '0')"
                class="dt-stepper-input"
                readonly
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="incStartMin"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="decStartMin"
                >▼</button>
              </div>
            </div>
          </div>

          <div class="datetime-label">结束时间</div>
          <div class="datetime-row">
            <div class="datetime-stepper">
              <input
                v-model.number="eYear"
                class="dt-stepper-input"
                type="number"
                min="1"
                max="9999"
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="eYear++"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="eYear--"
                >▼</button>
              </div>
            </div>
            <span class="dt-sep">-</span>
            <select
              v-model.number="eMonth"
              class="dt-select dt-select-sm"
            >
              <option
                v-for="m in 12"
                :key="m"
                :value="m"
              >{{ pad2(m) }}</option>
            </select>
            <span class="dt-sep">-</span>
            <select
              v-model.number="eDay"
              class="dt-select dt-select-sm"
            >
              <option
                v-for="d in maxDaysEnd"
                :key="d"
                :value="d"
              >{{ pad2(d) }}</option>
            </select>
            <span class="dt-sep-space" />
            <div class="datetime-stepper">
              <input
                :value="String(eHour).padStart(2, '0')"
                class="dt-stepper-input"
                readonly
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="incEndHour"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="decEndHour"
                >▼</button>
              </div>
            </div>
            <span class="dt-sep">:</span>
            <div class="datetime-stepper">
              <input
                :value="String(eMin).padStart(2, '0')"
                class="dt-stepper-input"
                readonly
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="incEndMin"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="decEndMin"
                >▼</button>
              </div>
            </div>
          </div>

          <div class="datetime-actions">
            <button class="btn btn-primary" @click="calcInterval">计算间隔</button>
          </div>

          <div v-if="intervalResult" class="datetime-result">
            <div class="dt-result-header">
              开始时间：{{ formatFull(sYear, sMonth, sDay, sHour, sMin) }}<br>
              结束时间：{{ formatFull(eYear, eMonth, eDay, eHour, eMin) }}
            </div>
            <div class="dt-result-grid">
              <template v-for="item in intervalResult" :key="item.label">
                <span class="dt-result-label">{{ item.label }}</span>
                <span class="dt-result-value">{{ item.value }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- 日期推算 -->
        <div class="datetime-card">
          <h2 class="datetime-card-title">日期推算</h2>

          <div class="datetime-label">开始日期</div>
          <div class="datetime-row">
            <div class="datetime-stepper">
              <input
                v-model.number="pYear"
                class="dt-stepper-input"
                type="number"
                min="1"
                max="9999"
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="pYear++"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="pYear--"
                >▼</button>
              </div>
            </div>
            <span class="dt-sep">-</span>
            <select
              v-model.number="pMonth"
              class="dt-select dt-select-sm"
            >
              <option
                v-for="m in 12"
                :key="m"
                :value="m"
              >{{ pad2(m) }}</option>
            </select>
            <span class="dt-sep">-</span>
            <select
              v-model.number="pDay"
              class="dt-select dt-select-sm"
            >
              <option
                v-for="d in maxDaysProj"
                :key="d"
                :value="d"
              >{{ pad2(d) }}</option>
            </select>
          </div>

          <div class="datetime-label">推算条件</div>
          <div class="datetime-row">
            <select
              v-model.number="pDirection"
              class="dt-select dt-select-md"
            >
              <option :value="1">往后</option>
              <option :value="-1">往前</option>
            </select>
            <div class="datetime-stepper">
              <input
                v-model.number="pQty"
                class="dt-stepper-input dt-stepper-input-sm"
                type="number"
                min="1"
                max="99999"
              >
              <div class="dt-stepper-buttons">
                <button
                  class="dt-btn-inline"
                  @click="pQty++"
                >▲</button>
                <button
                  class="dt-btn-inline"
                  @click="pQty = Math.max(1, pQty - 1)"
                >▼</button>
              </div>
            </div>
            <select
              v-model="pUnit"
              class="dt-select dt-select-sm"
            >
              <option value="day">天</option>
              <option value="week">周</option>
              <option value="month">月</option>
            </select>
          </div>

          <div class="datetime-actions">
            <button class="btn btn-primary" @click="calcProjection">计算日期</button>
          </div>

          <div v-if="projResult" class="datetime-result">
            <div class="dt-result-grid">
              <span class="dt-result-label">推算结果</span>
              <span class="dt-result-value">{{ projResult }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

/* ---- helpers ---- */
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function daysInMonth(y, m) {
  if (m === 2) return isLeapYear(y) ? 29 : 28
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
}

function totalDaysFromYearStart(y, m, d) {
  let sum = 0
  for (let i = 1; i < m; i++) sum += daysInMonth(y, i)
  return sum + d
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatFull(y, mo, d, h, mi) {
  return `${y}-${pad2(mo)}-${pad2(d)} ${pad2(h)}:${pad2(mi)}`
}

/* ---- 日期间隔 state ---- */
const now = new Date()
const sYear = ref(now.getFullYear())
const sMonth = ref(now.getMonth() + 1)
const sDay = ref(now.getDate())
const sHour = ref(0)
const sMin = ref(0)

const eYear = ref(now.getFullYear())
const eMonth = ref(now.getMonth() + 1)
const eDay = ref(now.getDate())
const eHour = ref(0)
const eMin = ref(0)

const intervalResult = ref(null)

const maxDaysStart = computed(() => daysInMonth(sYear.value, sMonth.value))
const maxDaysEnd = computed(() => daysInMonth(eYear.value, eMonth.value))

watch(sMonth, () => { if (sDay.value > maxDaysStart.value) sDay.value = maxDaysStart.value })
watch(sYear, () => { if (sDay.value > maxDaysStart.value) sDay.value = maxDaysStart.value })
watch(eMonth, () => { if (eDay.value > maxDaysEnd.value) eDay.value = maxDaysEnd.value })
watch(eYear, () => { if (eDay.value > maxDaysEnd.value) eDay.value = maxDaysEnd.value })

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }
function decStartHour() { sHour.value = (sHour.value + 23) % 24 }
function incStartHour() { sHour.value = (sHour.value + 1) % 24 }
function decStartMin() { sMin.value = (sMin.value + 59) % 60 }
function incStartMin() { sMin.value = (sMin.value + 1) % 60 }
function decEndHour() { eHour.value = (eHour.value + 23) % 24 }
function incEndHour() { eHour.value = (eHour.value + 1) % 24 }
function decEndMin() { eMin.value = (eMin.value + 59) % 60 }
function incEndMin() { eMin.value = (eMin.value + 1) % 60 }

/* ---- 日期间隔计算 ---- */
function calcInterval() {
  const sy = clamp(sYear.value, 1, 9999)
  const ey = clamp(eYear.value, 1, 9999)
  const sm = clamp(sMonth.value, 1, 12)
  const em = clamp(eMonth.value, 1, 12)
  const sd = clamp(sDay.value, 1, daysInMonth(sy, sm))
  const ed = clamp(eDay.value, 1, daysInMonth(ey, em))
  const sh = clamp(sHour.value, 0, 23)
  const eh = clamp(eHour.value, 0, 23)
  const smin = clamp(sMin.value, 0, 59)
  const emin = clamp(eMin.value, 0, 59)

  sYear.value = sy; sMonth.value = sm; sDay.value = sd
  eYear.value = ey; eMonth.value = em; eDay.value = ed
  sHour.value = sh; sMin.value = smin
  eHour.value = eh; eMin.value = emin

  const d1 = new Date(sy, sm - 1, sd, sh, smin, 0)
  const d2 = new Date(ey, em - 1, ed, eh, emin, 0)
  let msDiff = Math.abs(d2.getTime() - d1.getTime())

  // 差值（年月）
  let [earlierY, earlierM, earlierD, laterY, laterM, laterD] = d2 >= d1
    ? [sy, sm, sd, ey, em, ed]
    : [ey, em, ed, sy, sm, sd]

  let dYear = laterY - earlierY
  let dMonth = laterM - earlierM
  let dDay = laterD - earlierD
  if (dDay < 0) {
    dMonth--
    dDay += daysInMonth(earlierY, earlierM)
  }
  if (dMonth < 0) {
    dYear--
    dMonth += 12
  }

  // 合计
  const totalMin = Math.round(msDiff / 60000)
  const totalHour = Math.floor(totalMin / 60)
  const totalDays = Math.floor(msDiff / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)
  const totalWeekRemain = totalDays % 7

  let sumYearRemainMonths = dMonth + dDay / daysInMonth(laterY, laterM)

  intervalResult.value = [
    { label: '相差年数：', value: `${dYear}年` },
    { label: '相差月数：', value: `${dYear * 12 + dMonth}月` },
    { label: '相差周数：', value: `${totalWeeks}周余${totalWeekRemain}天` },
    { label: '相差天数：', value: `${totalDays}天` },
    { label: '相差小时：', value: `${totalHour}时${totalMin % 60}分` },
    { label: '相差分钟：', value: `${totalMin}分` },
    { label: '─────────', value: '' },
    { label: '合计年数：', value: `${dYear}年余${dMonth}月` },
    { label: '合计天数：', value: `${totalDays}天` },
    { label: '合计周数：', value: `${totalWeeks}周余${totalWeekRemain}天` },
  ]
}

/* ---- 日期推算 state ---- */
const pYear = ref(now.getFullYear())
const pMonth = ref(now.getMonth() + 1)
const pDay = ref(now.getDate())
const pDirection = ref(1)
const pQty = ref(1)
const pUnit = ref('day')
const projResult = ref(null)

const maxDaysProj = computed(() => daysInMonth(pYear.value, pMonth.value))
watch(pMonth, () => { if (pDay.value > maxDaysProj.value) pDay.value = maxDaysProj.value })
watch(pYear, () => { if (pDay.value > maxDaysProj.value) pDay.value = maxDaysProj.value })

/* ---- 日期推算计算 ---- */
function calcProjection() {
  const y = clamp(pYear.value, 1, 9999)
  const m = clamp(pMonth.value, 1, 12)
  const d = clamp(pDay.value, 1, daysInMonth(y, m))
  pYear.value = y; pMonth.value = m; pDay.value = d
  const qty = Math.max(1, Math.floor(pQty.value || 1))
  pQty.value = qty

  const sign = pDirection.value
  const dt = new Date(y, m - 1, d)

  if (pUnit.value === 'day') {
    dt.setDate(dt.getDate() + sign * qty)
  } else if (pUnit.value === 'week') {
    dt.setDate(dt.getDate() + sign * qty * 7)
  } else {
    // month
    const newMonth = dt.getMonth() + sign * qty
    dt.setMonth(newMonth)
    const maxD = daysInMonth(dt.getFullYear(), dt.getMonth() + 1)
    if (dt.getDate() !== d) dt.setDate(maxD)
  }

  const ry = dt.getFullYear()
  const rm = dt.getMonth() + 1
  const rd = dt.getDate()
  const wd = WEEKDAYS[dt.getDay()]
  projResult.value = `${ry}年${pad2(rm)}月${pad2(rd)}日 ${wd}`
}
</script>

<style scoped>
.datetime-workbench {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
  background:
    radial-gradient(circle at top, var(--accent-glow), transparent 24%),
    var(--bg-base);
}

.datetime-shell {
  width: min(100%, 1040px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.datetime-topbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.datetime-title {
  font-size: 28px;
  line-height: 1.15;
}

.datetime-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.datetime-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-panel);
}

.datetime-card-title {
  font-size: 20px;
  font-weight: 700;
}

.datetime-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.datetime-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dt-sep {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
  line-height: 34px;
}

.dt-sep-space {
  width: 8px;
  flex-shrink: 0;
}

.datetime-stepper {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.dt-stepper-buttons {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}

.datetime-stepper:hover .dt-stepper-buttons {
  opacity: 1;
  pointer-events: auto;
}

.dt-btn-inline {
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  transition: all 0.15s;
  line-height: 1;
  padding: 0;
}

.dt-btn-inline + .dt-btn-inline {
  border-top: 1px solid var(--border);
}

.dt-btn-inline:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.dt-stepper-input {
  width: 72px;
  height: 34px;
  text-align: center;
  border: none;
  background: var(--bg-base);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  outline: none;
  font-family: var(--font-mono);
  -moz-appearance: textfield;
  appearance: textfield;
  padding: 0 20px 0 0;
}

.dt-stepper-input:focus {
  box-shadow: inset 0 0 0 1px var(--accent);
}

.dt-stepper-input::-webkit-inner-spin-button,
.dt-stepper-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.dt-stepper-input-sm {
  width: 72px;
}

.dt-select {
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 0 10px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  font-weight: 500;
  transition: border-color 0.15s;
}

.dt-select:focus {
  border-color: var(--accent);
}

.dt-select-sm {
  min-width: 70px;
  width: 70px;
  flex-shrink: 0;
}

.dt-select-md {
  min-width: 80px;
  width: 80px;
  flex-shrink: 0;
}

.datetime-actions {
  display: flex;
  gap: 12px;
  padding-top: 4px;
}

.datetime-result {
  padding: 18px 20px;
  border-radius: 14px;
  background: var(--bg-base);
  border: 1px solid var(--border);
}

.dt-result-header {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.dt-result-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  align-items: baseline;
}

.dt-result-label {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  text-align: right;
}

.dt-result-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent-light);
  font-family: var(--font-mono);
}

@media (max-width: 767px) {
  .datetime-workbench {
    padding: 16px;
  }

  .datetime-columns {
    grid-template-columns: 1fr;
  }

  .datetime-card {
    padding: 18px;
  }
}
</style>
