function fuzzyTime () {
  const [justAfter, about, oClock, quarter, to, past, halfPast, sharp, a] =
    ['just after', 'about', "o'clock", 'quarter', 'to', 'past', 'half past', 'sharp', 'a']
  const hours = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven']

  const [minute, hour] = [this.minute(), this.hour()]
  const slice = minute % 7.5 // divide the clock into 8ths / alternating between whole numbers and decimals
  const output = []

  const nextHour = hours[(hour + 1) % 12]
  const thisHour = hours[hour % 12]

  output.push(...(slice === 0) ? []
               : (slice === Math.floor(slice)) ? [justAfter]
               : [about])

  output.push(...(minute > 53) ? [ nextHour, oClock ]
               : (minute > 37) ? [ a, quarter, to, nextHour ]
               : (minute > 23) ? [ halfPast, thisHour ]
               : (minute > 7) ? [ a, quarter, past, thisHour ]
               : (minute > 0) ? [ thisHour, oClock ]
               : [ thisHour, oClock, sharp ])

  return output.join(' ')
}
