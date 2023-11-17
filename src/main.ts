import {Store, Doc} from "./store/store"
import { formatDocTitle, applyHighlights } from "./utils"

const DB = new Store()

interface DOMElements {
	[index: string]: HTMLElement | HTMLInputElement;
}

class DocComponent{
  parent: HTMLElement
	$: DOMElements
  currentDoc: Doc
  searchQuery: string

  constructor(el: HTMLElement){
    this.parent = el
    this.$ = {
      content: el.querySelector("#snap-content") as HTMLInputElement,
      editor: el.querySelector("#editor") as HTMLTextAreaElement,
      entries: el.querySelector("#entries") as HTMLElement,
      delete: el.querySelector("#delete") as HTMLElement,
      date: el.querySelector("#date") as HTMLElement,
      add: el.querySelector("#add") as HTMLElement,
      search: el.querySelector("#search") as HTMLInputElement
    }
    this.currentDoc = {
      title: "",
      content: "",
      lastEdited: new Date(),
      path: window.location.hash.slice(1).toString()
    }
    this.searchQuery = ""
    this.setupUI()
  }

  setupUI(): void{
    
    this.loadDocs()

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

      this.showDelete(this.currentDoc.content);
      (this.$.entries.querySelector(`[data-id="${this.currentDoc.path}"] a`) as HTMLAnchorElement).innerText = this.currentDoc.title;
      DB.save(this.currentDoc)
      .then(() => {
        this.setModified(this.currentDoc.lastEdited)
      })
    })

    this.$.delete.addEventListener("click", async () => {
      if(!this.currentDoc.path) return
      let confirmDelete = window.confirm("Are you sure you want to delete this document?")
      if(!confirmDelete) return
      
      DB.deleteDoc(this.currentDoc.path)
      .then(() => {
        this.redirectToOtherDocOnDelete()
      })
    })

    this.$.search.addEventListener("input", (e: Event) => {
  
      DB.getDocs()
      .then((docs) => {
        const filteredDocs = docs.filter((doc) => doc.content.includes(this.searchQuery))

        this.setSidebarDocs(filteredDocs)
        // window.location.hash = filteredDocs[0].path.toString() // we don't want that
        
        // highlight search query
        
        this.$.search.focus()
        this.searchQuery = (e.target as HTMLInputElement).value
      
        const highlightedContent = applyHighlights(this.currentDoc.content, this.searchQuery);
        if(document.querySelector(".highlights")){
          (document.querySelector(".highlights") as HTMLDivElement).innerHTML = highlightedContent; 
        } 

      })
    })

    window.addEventListener("hashchange", () => {
      this.$.editor.scrollTop = 0
      this.currentDoc = {
        title: "",
        content: "",
        lastEdited: new Date(),
        path: window.location.hash.slice(1).toString()
      }
      DB.getDoc(this.currentDoc.path).then((doc) => doc && this.setCurrentDoc(doc))
    })


    DB.event.addEventListener("docs-loaded", (details:any) => {
      
      // show search
      if(details && details.detail.length > 0){
        this.$.search.setAttribute("placeholder", "Search")
        this.$.search.classList.remove("hide")
      }
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
        this.setSidebarDocs(docs)
        DB.getDoc(docs[0].path.toString()).then((doc) => doc && this.setCurrentDoc(doc))
  
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

      DB.getDocs()
      .then((docs) => this.setSidebarDocs(docs))
      .then(() => this.setCurrentDoc(this.currentDoc))
    })
    .catch((error) => {
      console.error(error)
    })
  }

  setModified(date: Date){
    this.$.date.style.display = "block"
    this.$.date.innerText = `Last modified: ${date.toLocaleTimeString()}`
  }

  setSidebarDocs(docs: Doc[]){
    this.$.entries.innerHTML = ""
    docs.forEach((doc:Doc) => {
      const entry = document.createElement("li")
      entry.dataset.id = doc.path
      const anchor = document.createElement("a")
      
      anchor.href = "#" + doc.path.split("/").pop()
      anchor.innerText = doc.title
      entry.appendChild(anchor)
      this.$.entries.appendChild(entry)
    })
  }

  setCurrentDoc(doc: Doc){
    if(doc){
      (this.$.editor as HTMLTextAreaElement).value = doc.content
      this.currentDoc = doc
      this.setModified(new Date(doc.lastEdited))
      this.showDelete(doc.content)
      this.$.editor.focus()
      // remove selected class from all entries
      this.$.entries.querySelectorAll("li").forEach((entry) => {
        entry.classList.remove("selected")
      })
      // add selected class to current entry
      const selectedElement = this.$.entries.querySelector(`[data-id="${parseInt(this.currentDoc.path)}"]`) as HTMLAnchorElement
      selectedElement && selectedElement.classList.add("selected")
    }
  }

  showDelete(content:string){
    if(content.length > 0){
      this.$.delete.classList.remove("hide")
      return
    }
    this.$.delete.classList.add("hide")
  }

  loadDocs(){
    DB.getDocs()
    .then((docs) => this.setSidebarDocs(docs))
    .then(() => 
      DB.getDoc(this.currentDoc.path)
      .then((doc) => doc && this.setCurrentDoc(doc))
    )
  }

}

new DocComponent(document.body)