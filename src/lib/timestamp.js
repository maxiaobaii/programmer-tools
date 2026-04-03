export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: 'GMT+08:00 (北京时间)' },
  { value: 'UTC', label: 'UTC/GMT (世界协调时间)' },
  { value: 'Asia/Tokyo', label: 'GMT+09:00 (东京时间)' },
  { value: 'Europe/London', label: 'GMT+00:00 (伦敦时间)' },
  { value: 'America/New_York', label: 'GMT-04:00 (纽约时间)' },
]

function pad(value, length = 2) {
  return String(value).padStart(length, '0')
}

export function formatDateTimeParts(year, month, day, hour, minute, second) {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}

function getTimeZoneParts(timestampMs, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const values = Object.fromEntries(
    formatter.formatToParts(new Date(timestampMs))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  )

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  }
}

function getTimeZoneOffsetMs(timeZone, timestampMs) {
  const parts = getTimeZoneParts(timestampMs, timeZone)
  const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const truncatedTimestampMs = timestampMs - (timestampMs % 1000)
  return zonedAsUtc - truncatedTimestampMs
}

function zonedDateTimeToUtcMs(parts, timeZone) {
  const baseUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond)
  let offsetMs = getTimeZoneOffsetMs(timeZone, baseUtcMs)
  let resolvedUtcMs = baseUtcMs - offsetMs
  const nextOffsetMs = getTimeZoneOffsetMs(timeZone, resolvedUtcMs)
  if (nextOffsetMs !== offsetMs) {
    resolvedUtcMs = baseUtcMs - nextOffsetMs
  }
  return resolvedUtcMs
}

export function parseTimestampInput(input, unit) {
  const normalized = String(input || '').trim()
  if (!/^\d{10,13}$/.test(normalized)) {
    throw new Error('请输入 10 位秒级或 13 位毫秒级时间戳')
  }

  const digits = normalized.length
  const isSeconds = unit === 'seconds'
  const timestampMs = isSeconds ? Number(normalized) * 1000 : Number(normalized)

  if (Number.isNaN(timestampMs)) {
    throw new Error('时间戳格式不正确')
  }

  return { timestampMs, digits }
}

export function convertTimestampToDateTimes(timestampMs, timeZone) {
  const zonedParts = getTimeZoneParts(timestampMs, timeZone)
  const utcDate = new Date(timestampMs)

  return {
    zonedDateTime: formatDateTimeParts(zonedParts.year, zonedParts.month, zonedParts.day, zonedParts.hour, zonedParts.minute, zonedParts.second),
    utcDateTime: formatDateTimeParts(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes(),
      utcDate.getUTCSeconds(),
    ),
  }
}

export function convertDateTimeToTimestamps(dateTimeText, millisecondText, timeZone) {
  const matched = String(dateTimeText || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/)
  if (!matched) {
    throw new Error('请输入 YYYY-MM-DD HH:mm:ss 格式的日期时间')
  }

  const millisecond = Number(String(millisecondText || '0').trim() || '0')
  if (!Number.isInteger(millisecond) || millisecond < 0 || millisecond > 999) {
    throw new Error('毫秒请输入 0 到 999 之间的整数')
  }

  const parts = {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3]),
    hour: Number(matched[4]),
    minute: Number(matched[5]),
    second: Number(matched[6]),
    millisecond,
  }

  const utcMs = zonedDateTimeToUtcMs(parts, timeZone)
  return {
    seconds: String(Math.floor(utcMs / 1000)),
    milliseconds: String(utcMs),
  }
}

export function getCurrentDateTimeInput(timeZone, nowMs = Date.now()) {
  const parts = getTimeZoneParts(nowMs, timeZone)
  return {
    dateTime: formatDateTimeParts(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second),
    millisecond: pad(nowMs % 1000, 3),
  }
}
