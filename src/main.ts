import {Store, Note} from "./store/store"

const DB = new Store("notes")

interface DOMElements {
	[index: string]: HTMLElement | HTMLInputElement;
}

class NoteComponent{
  parent: HTMLElement
	$: DOMElements
	filter: string

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
    this.filter = ""

    this.setupUI()
  }

  async setupUI(): Promise<void>{
    
    this.render()

    this.$.add.addEventListener("click", async () => {
      try {
        const id = Math.floor(Math.random() * 10000000000)
        const note: Note = { 
          common: {},
          local: {
            body: {title: "Write...", content: "", lastEdited: ""},
            contentType: "application/json; charset=utf-8",
          },
          path: `/documents/notes/${id}` 
        }

        await DB.notes.add(note).then((id) => {
          window.location.hash = id.toString().split("/").pop() || ""
          this.render()
        })

      } catch (error) {
        console.error("Error adding new note:", error)
        // Handle the error or show a user-friendly message
      }
    })

    this.$.editor.addEventListener("input", async (e: Event) => {
      const id = window.location.hash.slice(1)
      const note = await DB.notes.get(`/documents/notes/${id.toString()}`)
      
      if(note){
        note.local.body.content = (e.target as HTMLTextAreaElement).value
        note.local.body.lastEdited = new Date().toISOString()
        note.local.body.title = (e.target as HTMLTextAreaElement).value.substring(0, 20)
        await DB.notes.put(note)
        this.setSidebarNotes()
      }
    })

    window.addEventListener("hashchange", () => {
      this.render()    
    })
  }

  async loadCurrentNote(){
    const id = window.location.hash.slice(1)
    const note = await DB.notes.get(`/documents/notes/${id.toString()}`)
    if(note){
      this.setCurrentNote(note)
    }
  }

  async setSidebarNotes(){
    const notes = await DB.notes.toArray()
    this.$.entries.innerHTML = ""
    notes.forEach((note) => {
      const entry = document.createElement("li").appendChild(document.createElement("a"))
      entry.href = "#" + note.path.split("/").pop()
      entry.innerText = note.local.body.title
      this.$.entries.appendChild(entry)
    })
  }

  setCurrentNote(note: Note){
    (this.$.editor as HTMLTextAreaElement).value = note.local.body.content
  }

  render(){
    this.setSidebarNotes()
    this.loadCurrentNote()
  }

}

new NoteComponent(document.body)