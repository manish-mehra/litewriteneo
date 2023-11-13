import {Store, Note} from "./store/store"
import { formatNoteTitle } from "./utils"

const DB = new Store("notes")

interface DOMElements {
	[index: string]: HTMLElement | HTMLInputElement;
}

class NoteComponent{
  parent: HTMLElement
	$: DOMElements
  currentNote: Note

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
    this.currentNote = {
      title: "",
      content: "",
      lastEdited: new Date(),
      path: `/documents/notes/${window.location.hash.slice(1).toString()}` || ""
    }

    this.setupUI()
  }

  setupUI(): void{
    
    this.render()

    this.$.add.addEventListener("click", async () => {
      DB.addNew()
      .then((noteId) => {
        window.location.hash = noteId.toString().split("/").pop() || ""
        this.currentNote = {...this.currentNote, title: "Write...", path: noteId.toString()}
        this.render()
      })
      .catch((error) => {
        console.error(error)
      })
    })

    this.$.editor.addEventListener("input", async (e: Event) => {
      if(!this.currentNote.path) return
      this.currentNote = {
        ...this.currentNote,
        content: (e.target as HTMLTextAreaElement).value,
        title: formatNoteTitle((e.target as HTMLTextAreaElement).value),
        lastEdited: new Date()
      }

      DB.save(this.currentNote)
      .then((status) => {
        this.setModified(this.currentNote.lastEdited)
        this.showDelete(this.currentNote.content)
        DB.getAllNotes().then((notes) => this.setSidebarNotes(notes))
      })
    })

    this.$.delete.addEventListener("click", async () => {
      if(!this.currentNote.path) return
      DB.deleteNote(this.currentNote.path)
      .then(() => {
        window.location.hash = ""
        this.currentNote = {
          title: "",
          content: "",
          lastEdited: new Date(),
          path: ""
        }
        this.render()
      })
    })

    window.addEventListener("hashchange", () => {
      this.currentNote = {
        title: "",
        content: "",
        lastEdited: new Date(),
        path: `/documents/notes/${window.location.hash.slice(1).toString()}`
      }
      this.render()    
    })
  }

  setModified(date: Date){
    this.$.date.style.display = "block"
    this.$.date.innerHTML = `Last modified: ${date.toLocaleTimeString()}`
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
    this.currentNote = note
    this.setModified(new Date(note.lastEdited))
    this.showDelete(note.content)
  }

  showDelete(content:string){
    if(content.length > 0){
      this.$.delete.classList.remove("hide")
      return
    }
    this.$.delete.classList.add("hide")
  }

  render(){
    DB.getAllNotes().then((notes) => this.setSidebarNotes(notes))
    DB.getNote(this.currentNote.path).then((note) => note && this.setCurrentNote(note))
  }

}

new NoteComponent(document.body)