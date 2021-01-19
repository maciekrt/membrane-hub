
export function pad(num, level) {
   return ("0".repeat(level) + num).slice(-level)
}

const namesDictionary = { 
   "m.zdanowicz@gmail.com"          : "Maciek Zdanowicz",
   "grzegorz.kossakowski@gmail.com" : "Grzegorz Kossakowski",
   "a.magalska@nencki.edu.pl"       : "Adriana Magalska",
   "oladobrosielska@gmail.com"      : "Dobra Dobrosielska",
   "zatorskaolga@gmail.com"         : "Olga Zatorska",
   "h.nowosielska@nencki.edu.pl"    : "Hanna Nowosielska"
   }

export function translate(email) {
   if(email in namesDictionary)
      return namesDictionary[email]
   return email
}