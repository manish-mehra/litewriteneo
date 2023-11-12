import {Store, Note} from "./store/store"

const DB = new Store("notes")

interface DOMElements {
	[index: string]: HTMLElement | HTMLInputElement;
}

class NoteComponent{
  parent: HTMLElement
	$: DOMElements
  currentNoteId: string

  constructor(el: HTMLElement){
    this.parent = el
    this.$ = {
      content: el.querySelector("#snap-content") as HTMLInputElement,
      editor: el.querySelector("#editor") as HTMLTextAreaElement,
      entries: el.querySelector("#entries") as HTMLElement,
      delete: el.querySelector("#delete") as HTMLElement,
      date: el.querySelector("#date") as HTMLElement,
      add: el.querySelector("#add") as HTMLElement,
    }
    this.currentNoteId = `/documents/notes/${window.location.hash.slice(1).toString()}`
    this.setupUI()
  }

  setupUI(): void{
    
    this.render()

    this.$.add.addEventListener("click", async () => {
      DB.addNew()
      .then((noteId) => {
        window.location.hash = noteId.toString().split("/").pop() || ""
        this.render()
      })
      .catch((error) => {
        console.error(error)
      })
    })

    this.$.editor.addEventListener("input", async (e: Event) => {

      if(!this.currentNoteId) return
      DB.save(this.currentNoteId, (e.target as HTMLTextAreaElement).value)
      .then((status) => {
        console.log('saved', status)
        DB.getAllNotes().then((notes) => this.setSidebarNotes(notes))
      })

    })

    window.addEventListener("hashchange", () => {
      this.currentNoteId = `/documents/notes/${window.location.hash.slice(1).toString()}`
      this.render()    
    })
  }

  setSidebarNotes(notes: Note[]){
    this.$.entries.innerHTML = ""
    notes.forEach((note:Note) => {
      const entry = document.createElement("li").appendChild(document.createElement("a"))
      entry.href = "#" + note.path.split("/").pop()
      entry.innerText = note.title
      this.$.entries.appendChild(entry)
    })
  }

  setCurrentNote(note: Note){
    (this.$.editor as HTMLTextAreaElement).value = note.content
  }

  render(){
    DB.getAllNotes().then((notes) => this.setSidebarNotes(notes))
    DB.getNote(this.currentNoteId).then((note) => note && this.setCurrentNote(note))
  }

}

new NoteComponent(document.body)