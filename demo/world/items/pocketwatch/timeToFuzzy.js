function timeToFuzzy (minute, hour) {
  const [justAfter, about, oClock, quarter, to, past, half, a, inThe, morning, afternoon, evening, atNight, midnight, noon] =
    ['just after', 'about', "o'clock", 'quarter', 'to', 'past', 'half', 'a', 'in the', 'morning', 'afternoon', 'evening', 'at night', 'midnight', 'noon']
  const hours =
    ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven']

  const slice = minute % 7.5

  const nextHour = () => hours[(hour + 1) % 12]
  const thisHour = () => hours[hour % 12]

  const hourSuffix = (hr) => {
    return (hr > 20) ? [ atNight ]
         : (hr > 17) ? [ inThe, evening ]
         : (hr > 12) ? [ inThe, afternoon ]
         : (hr === 12) ? [ noon ]
         : (hr === 0) ? [ midnight ]
         : [ inThe, morning ]
  }

  const nextHourSuffix = () => { return hourSuffix((hour + 1) % 24).join(' ') }
  const thisHourSuffix = () => { return hourSuffix(hour).join(' ') }

  const output = []

  output.push(...(slice === 0) ? [ ]
               : (slice === Math.floor(slice)) ? [ justAfter ]
               : [ about ])

  output.push(...(minute > 53) ? [ nextHour(), oClock, nextHourSuffix() ]
               : (minute > 37) ? [ a, quarter, to, nextHour(), nextHourSuffix() ]
               : (minute > 23) ? [ half, past, thisHour(), thisHourSuffix() ]
               : (minute > 7) ? [ a, quarter, past, thisHour(), thisHourSuffix() ]
               : (minute > 0) ? [ thisHour(), oClock, thisHourSuffix() ]
               : [ thisHour(), oClock, thisHourSuffix() ])

  return output.join(' ')
}
