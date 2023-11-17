import Dexie, { IndexableType, Table } from 'dexie'

export interface Doc {
  title: string
  content: string
  lastEdited: Date
  path: string
}

class Event extends EventTarget{}

class DexieStore extends Dexie{
  docs!: Table<Doc>
  constructor(){
    super('docs')
    this.version(1).stores({
      docs: 'path'
    })
    this.docs = this.table('docs')
  }
}

export class Store{
  event: Event
  dexie: DexieStore
  constructor(){
    this.event = new Event()
    this.dexie = new DexieStore()
  }
  async addNew(): Promise<IndexableType> {
    const newId = Math.floor(Math.random() * 10000000000)
    const doc: Doc = { 
      title: "Write...", 
      content: "", 
      lastEdited: new Date(),
      path: newId.toString()
    }
    return await this.dexie.docs.add(doc)
  }

  async save(doc: Doc): Promise<Number> {
    const newDoc = {
      ...doc,
      content: doc.content,
      lastEdited: new Date(),
    }
    return await this.dexie.docs.update(doc.path, newDoc)
  }

  async getDoc(id:string){
    return await this.dexie.docs.get(id).then((doc) => doc && doc)
  }
  
  async getDocs(): Promise<Doc[]>{
   const docs = await this.dexie.docs.toArray()
   this.event.dispatchEvent(new CustomEvent('docs-loaded', {detail: docs}))
   
   return docs.map((doc) => {
    return {
      title: doc.title,
      content: doc.content,
      lastEdited: doc.lastEdited,
      path: doc.path
    }
   })   
  }

  async deleteDoc(id:string): Promise<void> {
    return await this.dexie.docs.delete(id)
  }
}