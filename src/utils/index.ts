
export function formatDocTitle(content:string): string{
  if(content && content.length > 0){
    let title = content.match(/[^\s].{0,40}/)
    return title ? title[0] : "Write..."
  }
  return "Write..."
}

function escapeRegex(str:string) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export function applyHighlights (text:string, query:string) {
  let queryRegex = new RegExp(escapeRegex(query), 'gi')
  text = text
    .replace(/\n$/g, '\n\n')
    .replace(queryRegex, '<mark>$&</mark>')

  let ua = window.navigator.userAgent.toLowerCase()
  let isIE = !!ua.match(/msie|trident\/7|edge/)
  if (isIE) {
    // IE wraps whitespace differently in a div vs textarea, this fixes it
    text = text.replace(/ /g, ' <wbr>')
  }

  return text
}