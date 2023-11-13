import Dexie, { IndexableType, Table } from 'dexie'

export interface Note {
  title: string
  content: string
  lastEdited: Date
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
      lastEdited: new Date(),
      path: `/documents/notes/${newId}` 
    }
    return await this.notes.add(note)
  }

  async save(note: Note): Promise<Number> {
    const newNote = {
      ...note,
      content: note.content,
      lastEdited: new Date(),
    }
    return await this.notes.update(note.path, newNote)
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

  async deleteNote(id:string): Promise<void> {
    return await this.notes.delete(id)
  }

}
