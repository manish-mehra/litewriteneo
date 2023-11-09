import Dexie, { Table } from 'dexie'

interface ItemMap {
  [key: string]: boolean | string | ItemMap
}

interface NoteContent {
  body: {
    title: string
    content: string
    lastEdited: string
  }
  contentType: string
}

export interface Note {
  common: {
    itemMap: ItemMap
  } | {}
  local: NoteContent | ItemMap
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
}
