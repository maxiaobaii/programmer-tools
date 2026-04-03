<template>
  <div class="timestamp-workbench">
    <div class="timestamp-shell">
      <header class="timestamp-topbar">
        <RouterLink
          to="/"
          class="tool-page-back"
        >返回首页</RouterLink>
        <div class="timestamp-current-card">
          <div>
            <p class="timestamp-current-label">当前时间戳</p>
            <div class="timestamp-current-value">{{ currentTimestamp }}</div>
          </div>
          <div class="timestamp-current-actions">
            <span class="timestamp-inline-meta">秒/毫秒</span>
            <div class="timestamp-unit-switch" role="tablist" aria-label="秒毫秒切换">
              <button
                class="timestamp-unit-btn"
                :class="{ active: currentUnit === 'millis' }"
                @click="currentUnit = 'millis'"
              >毫秒</button>
              <button
                class="timestamp-unit-btn"
                :class="{ active: currentUnit === 'seconds' }"
                @click="currentUnit = 'seconds'"
              >秒</button>
            </div>
            <button
              class="btn btn-primary"
              @click="copyCurrentTimestamp"
            >复制</button>
          </div>
        </div>
      </header>

      <div class="timestamp-card">
      <div class="timestamp-tabs">
        <button
          class="timestamp-tab"
          :class="{ active: activeTab === 'timestamp-to-date' }"
          @click="activeTab = 'timestamp-to-date'"
        >时间戳->日期时间</button>
        <button
          class="timestamp-tab"
          :class="{ active: activeTab === 'date-to-timestamp' }"
          @click="activeTab = 'date-to-timestamp'"
        >日期时间->时间戳</button>
      </div>

      <section
        v-if="activeTab === 'timestamp-to-date'"
        class="timestamp-panel"
      >
        <h2 class="timestamp-panel-title">时间戳转日期时间</h2>

        <div class="timestamp-form-grid">
          <label class="timestamp-field-label">输入时间戳</label>
          <div class="timestamp-field-row timestamp-inline-row">
            <input
              v-model="timestampInput"
              class="timestamp-input"
              placeholder="请输入时间戳"
            >
            <span class="timestamp-inline-meta">位数：{{ timestampDigitLabel }}</span>
          </div>
          <div class="timestamp-field-hint timestamp-field-content">支持10位秒级或13位毫秒级时间戳</div>

          <label class="timestamp-field-label">时区选择</label>
          <select
            v-model="selectedTimeZone"
            class="timestamp-select timestamp-field-content"
          >
            <option
              v-for="option in TIMEZONE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >{{ option.label }}</option>
          </select>

          <div class="timestamp-field-label" />
          <div class="timestamp-radio-group timestamp-field-content">
            <label class="timestamp-radio-item">
              <input
                v-model="timestampUnit"
                type="radio"
                value="seconds"
              >
              秒级时间戳（10位）
            </label>
            <label class="timestamp-radio-item">
              <input
                v-model="timestampUnit"
                type="radio"
                value="millis"
              >
              毫秒级时间戳（13位）
            </label>
          </div>
        </div>

        <div class="timestamp-action-row">
          <button class="btn btn-primary" @click="convertTimestamp">转换</button>
          <button class="btn btn-ghost" @click="fillCurrentTimestamp">当前时间戳</button>
        </div>

        <p v-if="timestampError" class="timestamp-error">{{ timestampError }}</p>

        <div v-if="timestampResult" class="timestamp-result-card">
          <div class="timestamp-result-block">
            <div class="timestamp-result-label">所选时区时间：</div>
            <div class="timestamp-result-value">{{ timestampResult.zonedDateTime }}</div>
            <button class="btn btn-primary timestamp-copy-btn" @click="copyValue(timestampResult.zonedDateTime)">复制</button>
          </div>
          <div class="timestamp-result-block">
            <div class="timestamp-result-label">UTC/GMT（世界协调时间）：</div>
            <div class="timestamp-result-value">{{ timestampResult.utcDateTime }}</div>
            <button class="btn btn-primary timestamp-copy-btn" @click="copyValue(timestampResult.utcDateTime)">复制</button>
          </div>
        </div>
      </section>

      <section
        v-else
        class="timestamp-panel"
      >
        <h2 class="timestamp-panel-title">日期时间转时间戳</h2>

        <div class="timestamp-form-grid">
          <label class="timestamp-field-label">输入日期时间</label>
          <div class="timestamp-field-row timestamp-date-row">
            <input
              v-model="dateTimeInput"
              class="timestamp-input"
              placeholder="YYYY-MM-DD HH:mm:ss"
            >
            <button
              class="btn btn-ghost timestamp-picker-btn"
              @click="openDatePicker"
            >选择日期</button>
            <span class="timestamp-inline-meta">毫秒</span>
            <input
              v-model="millisecondInput"
              class="timestamp-millis-input"
              maxlength="3"
              placeholder="000"
            >
            <input
              ref="datePickerRef"
              v-model="datePickerValue"
              class="timestamp-hidden-picker"
              type="datetime-local"
              step="1"
              @change="applyDatePicker"
            >
          </div>

          <label class="timestamp-field-label">时区选择</label>
          <select
            v-model="selectedTimeZone"
            class="timestamp-select timestamp-field-content"
          >
            <option
              v-for="option in TIMEZONE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >{{ option.label }}</option>
          </select>
        </div>

        <div class="timestamp-action-row">
          <button class="btn btn-primary" @click="convertDateTime">转换</button>
          <button class="btn btn-ghost" @click="fillCurrentDateTime">使用当前时间</button>
          
        </div>

        <p v-if="dateTimeError" class="timestamp-error">{{ dateTimeError }}</p>

        <div v-if="dateTimeResult" class="timestamp-result-card">
          <div class="timestamp-result-block">
            <div class="timestamp-result-label">Unix时间戳（秒）：</div>
            <div class="timestamp-result-value">{{ dateTimeResult.seconds }}</div>
            <button class="btn btn-primary timestamp-copy-btn" @click="copyValue(dateTimeResult.seconds)">复制</button>
          </div>
          <div class="timestamp-result-block">
            <div class="timestamp-result-label">Unix时间戳（毫秒）：</div>
            <div class="timestamp-result-value">{{ dateTimeResult.milliseconds }}</div>
            <button class="btn btn-primary timestamp-copy-btn" @click="copyValue(dateTimeResult.milliseconds)">复制</button>
          </div>
        </div>
      </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { copyText } from '../utils.js'
import {
  TIMEZONE_OPTIONS,
  convertDateTimeToTimestamps,
  convertTimestampToDateTimes,
  formatDateTimeParts,
  getCurrentDateTimeInput,
  parseTimestampInput,
} from '../lib/timestamp.js'

const flash = inject('flashCopy')
const activeTab = ref('timestamp-to-date')
const currentUnit = ref('millis')
const currentNowMs = ref(Date.now())
const currentTimer = ref(0)

const selectedTimeZone = ref('Asia/Shanghai')
const timestampInput = ref('')
const timestampUnit = ref('millis')
const timestampError = ref('')
const timestampResult = ref(null)

const dateTimeInput = ref('')
const millisecondInput = ref('000')
const dateTimeError = ref('')
const dateTimeResult = ref(null)
const datePickerRef = ref(null)
const datePickerValue = ref('')

const currentTimestamp = computed(() => currentUnit.value === 'seconds'
  ? String(Math.floor(currentNowMs.value / 1000))
  : String(currentNowMs.value))

const timestampDigitLabel = computed(() => String(timestampInput.value || '').trim().length || '--')

onMounted(() => {
  currentTimer.value = window.setInterval(() => {
    currentNowMs.value = Date.now()
  }, 100)
})

onBeforeUnmount(() => {
  window.clearInterval(currentTimer.value)
})

function copyCurrentTimestamp() {
  copyText(currentTimestamp.value, flash)
}

function copyValue(value) {
  copyText(value, flash)
}

function syncCurrentNow() {
  currentNowMs.value = Date.now()
}

function convertTimestamp() {
  syncCurrentNow()
  timestampError.value = ''
  try {
    const { timestampMs } = parseTimestampInput(timestampInput.value, timestampUnit.value)
    timestampResult.value = convertTimestampToDateTimes(timestampMs, selectedTimeZone.value)
  } catch (error) {
    timestampResult.value = null
    timestampError.value = error.message
  }
}

function fillCurrentTimestamp() {
  syncCurrentNow()
  timestampInput.value = currentUnit.value === 'seconds'
    ? String(Math.floor(currentNowMs.value / 1000))
    : String(currentNowMs.value)
  timestampUnit.value = currentUnit.value
  timestampResult.value = null
  timestampError.value = ''
}

function convertDateTime() {
  syncCurrentNow()
  dateTimeError.value = ''
  try {
    dateTimeResult.value = convertDateTimeToTimestamps(dateTimeInput.value, millisecondInput.value, selectedTimeZone.value)
  } catch (error) {
    dateTimeResult.value = null
    dateTimeError.value = error.message
  }
}

function fillCurrentDateTime() {
  syncCurrentNow()
  const current = getCurrentDateTimeInput(selectedTimeZone.value, currentNowMs.value)
  dateTimeInput.value = current.dateTime
  millisecondInput.value = current.millisecond
  syncPickerValue()
  dateTimeResult.value = null
  dateTimeError.value = ''
}

function syncPickerValue() {
  const matched = dateTimeInput.value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!matched) return
  datePickerValue.value = `${matched[1]}-${matched[2]}-${matched[3]}T${matched[4]}:${matched[5]}:${matched[6]}`
}

function applyDatePicker() {
  if (!datePickerValue.value) return
  const picked = new Date(datePickerValue.value)
  if (Number.isNaN(picked.getTime())) return
  dateTimeInput.value = formatDateTimeParts(
    picked.getFullYear(),
    picked.getMonth() + 1,
    picked.getDate(),
    picked.getHours(),
    picked.getMinutes(),
    picked.getSeconds(),
  )
}

function openDatePicker() {
  syncPickerValue()
  if (datePickerRef.value?.showPicker) {
    datePickerRef.value.showPicker()
    return
  }
  datePickerRef.value?.click()
}
</script>
