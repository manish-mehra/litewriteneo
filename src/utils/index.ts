
export function formatNoteTitle(content:string): string{
  if(content && content.length > 0){
    let title = content.match(/[^\s].{0,40}/)
    return title ? title[0] : "Write..."
  }
  return "Write..."
}