import {Store, Doc} from "./store/store"
import { formatDocTitle } from "./utils"

const DB = new Store("docs")

interface DOMElements {
	[index: string]: HTMLElement | HTMLInputElement;
}

class DocComponent{
  parent: HTMLElement
	$: DOMElements
  currentDoc: Doc

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
    this.currentDoc = {
      title: "",
      content: "",
      lastEdited: new Date(),
      path: window.location.hash.slice(1).toString()
    }
    this.setupUI()
  }

  setupUI(): void{
    
    this.render()

    this.$.add.addEventListener("click", async () => {
      this.newDoc()
    })

    this.$.editor.addEventListener("input", async (e: Event) => {
      if(!this.currentDoc.path) return
      this.currentDoc = {
        ...this.currentDoc,
        content: (e.target as HTMLTextAreaElement).value,
        title: formatDocTitle((e.target as HTMLTextAreaElement).value),
        lastEdited: new Date()
      }
      this.showDelete(this.currentDoc.content)

      DB.save(this.currentDoc)
      .then(() => {
        this.setModified(this.currentDoc.lastEdited)
        DB.getDocs().then((docs) => this.setSidebarDocs(docs))
      })
    })

    this.$.delete.addEventListener("click", async () => {
      if(!this.currentDoc.path) return
      let confirmDelete = window.confirm("Are you sure you want to delete this document?")
      if(!confirmDelete) return
      
      DB.deleteDoc(this.currentDoc.path)
      .then(() => {
        this.redirectToOtherDocOnDelete()
        this.render()
      })
    })

    window.addEventListener("hashchange", () => {
      this.currentDoc = {
        title: "",
        content: "",
        lastEdited: new Date(),
        path: window.location.hash.slice(1).toString()
      }
      this.render()    
    })
  }

  redirectToOtherDocOnDelete(){
    DB.getDocs()
    .then((docs) => {
      if(docs.length === 0){
        this.newDoc()
        return
      }
      if(docs.length > 0){
        window.location.hash = docs[0].path.toString()
        return
      }
    })
  }

  newDoc(){
    DB.addNew()
    .then((docId) => {
      window.location.hash = docId.toString() || ""
      this.currentDoc = {...this.currentDoc, title: "Write...", path: docId.toString()}
      this.render()
    })
    .catch((error) => {
      console.error(error)
    })
  }

  setModified(date: Date){
    this.$.date.style.display = "block"
    this.$.date.innerHTML = `Last modified: ${date.toLocaleTimeString()}`
  }

  setSidebarDocs(docs: Doc[]){
    this.$.entries.innerHTML = ""
    docs.forEach((doc:Doc) => {
      const entry = document.createElement("li").appendChild(document.createElement("a"))
      entry.href = "#" + doc.path.split("/").pop()
      entry.innerText = doc.title
      this.$.entries.appendChild(entry)
    })
  }

  setCurrentDoc(doc: Doc){
    (this.$.editor as HTMLTextAreaElement).value = doc.content
    this.currentDoc = doc
    this.setModified(new Date(doc.lastEdited))
    this.showDelete(doc.content)
  }

  showDelete(content:string){
    if(content.length > 0){
      this.$.delete.classList.remove("hide")
      return
    }
    this.$.delete.classList.add("hide")
  }

  render(){
    DB.getDocs().then((docs) => this.setSidebarDocs(docs))
    DB.getDoc(this.currentDoc.path).then((doc) => doc && this.setCurrentDoc(doc))
  }

}

new DocComponent(document.body)