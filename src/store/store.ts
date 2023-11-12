import Dexie, { IndexableType, Table } from 'dexie'

export interface Note {
  title: string
  content: string
  lastEdited: string
  path: string
}

export class Store extends Dexie {

  notes!: Table<Note>

  constructor(dbName:string) {
    super(dbName)
    this.version(1).stores({
      notes: 'path'
    })
    this.notes = this.table('notes')
  }

  async addNew(): Promise<IndexableType> {
    const newId = Math.floor(Math.random() * 10000000000)
    const note: Note = { 
      title: "Write...", 
      content: "", 
      lastEdited: "",
      path: `/documents/notes/${newId}` 
    }
    return await this.notes.add(note)
  }

  async save(id:string, content:string): Promise<Number> {
    const title = content.length > 0 ?
                  content.match(/[^\s].{0,40}/)
                  : 'Write...'
    return await this.notes.update(id, {content, title})
  }

  async getNote(id:string){
    return await this.notes.get(id).then((note) => note && note)
  }
  
  async getAllNotes(): Promise<Note[]>{
   const notes = await this.notes.toArray()
   return notes.map((note) => {
    return {
      title: note.title,
      content: note.content,
      lastEdited: note.lastEdited,
      path: note.path
    }
   })
   
  }

}
