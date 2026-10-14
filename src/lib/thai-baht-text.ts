/**
 * Convert number to Thai Baht text format
 * Example: 15420.50 -> "(หนึ่งหมื่นห้าพันสี่ร้อยยี่สิบบาทห้าสิบสตางค์)"
 *          0 -> "(ศูนย์บาทถ้วน)"
 */

const DIGIT_TEXTS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const UNIT_TEXTS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

function convertUnderMillion(num: number, hasHigherNumber: boolean = false): string {
  if (num === 0) return ''

  const numStr = num.toString()
  const len = numStr.length
  let result = ''

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10)
    const pos = len - i - 1

    if (digit === 0) continue

    if (pos === 0) {
      // Ones position
      if (digit === 1) {
        if (len > 1 || hasHigherNumber) {
          result += 'เอ็ด'
        } else {
          result += 'หนึ่ง'
        }
      } else {
        result += DIGIT_TEXTS[digit]
      }
    } else if (pos === 1) {
      // Tens position
      if (digit === 1) {
        result += 'สิบ'
      } else if (digit === 2) {
        result += 'ยี่สิบ'
      } else {
        result += DIGIT_TEXTS[digit] + 'สิบ'
      }
    } else {
      result += DIGIT_TEXTS[digit] + UNIT_TEXTS[pos]
    }
  }

  return result
}

function convertIntegerToThai(num: number): string {
  if (num === 0) return 'ศูนย์'

  const chunks: number[] = []
  let temp = Math.floor(num)
  while (temp > 0) {
    chunks.push(temp % 1000000)
    temp = Math.floor(temp / 1000000)
  }

  let result = ''
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i]
    if (chunk === 0) continue

    const hasHigher = i < chunks.length - 1 && chunks.slice(i + 1).some((c) => c > 0)
    const chunkText = convertUnderMillion(chunk, hasHigher)
    result += chunkText
    if (i > 0) {
      result += 'ล้าน'.repeat(i)
    }
  }

  return result
}

export function ThaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '(ศูนย์บาทถ้วน)'
  }

  const isNegative = amount < 0
  const absAmount = Math.abs(amount)
  const totalSatang = Math.round(absAmount * 100)
  const integerPart = Math.floor(totalSatang / 100)
  const satangPart = totalSatang % 100

  if (integerPart === 0 && satangPart === 0) {
    return '(ศูนย์บาทถ้วน)'
  }

  let text = ''
  if (isNegative) {
    text += 'ลบ'
  }

  if (integerPart > 0) {
    text += convertIntegerToThai(integerPart) + 'บาท'
  } else if (satangPart > 0) {
    // e.g. 0.50 -> ศูนย์บาทห้าสิบสตางค์
    text += 'ศูนย์บาท'
  }

  if (satangPart === 0) {
    text += 'ถ้วน'
  } else {
    text += convertUnderMillion(satangPart, false) + 'สตางค์'
  }

  return `(${text})`
}
