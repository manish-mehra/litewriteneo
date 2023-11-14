import Dexie, { IndexableType, Table } from 'dexie'

export interface Doc {
  title: string
  content: string
  lastEdited: Date
  path: string
}

export class Store extends Dexie {

  docs!: Table<Doc>

  constructor(dbName:string) {
    super(dbName)
    this.version(1).stores({
      docs: 'path'
    })
    this.docs = this.table('docs')
  }

  async addNew(): Promise<IndexableType> {
    const newId = Math.floor(Math.random() * 10000000000)
    const doc: Doc = { 
      title: "Write...", 
      content: "", 
      lastEdited: new Date(),
      path: newId.toString()
    }
    return await this.docs.add(doc)
  }

  async save(doc: Doc): Promise<Number> {
    const newDoc = {
      ...doc,
      content: doc.content,
      lastEdited: new Date(),
    }
    return await this.docs.update(doc.path, newDoc)
  }

  async getDoc(id:string){
    return await this.docs.get(id).then((doc) => doc && doc)
  }
  
  async getDocs(): Promise<Doc[]>{
   const docs = await this.docs.toArray()
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
    return await this.docs.delete(id)
  }

}
