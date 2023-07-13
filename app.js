import Login from './pages/Login.js'
import SignUp from './pages/SignUp.js'
import NoteList from './pages/NoteList.js'


m.route(document.getElementById('todoapp'), "/home", {
  "/home": {
      onmatch: function() {
        let token = localStorage.getItem("token");
        if(token!=null){
          return NoteList
        }else{
          m.route.set("/login")
        }
      }
  },
  "/login": {
    onmatch: function() {
      let token = localStorage.getItem("token");
      if(token!=null){
        m.route.set("/home")
      }else{
        return Login
      }
    }
  },
  "/signup": {
    onmatch: function() {
      let token = localStorage.getItem("token");
      if(token!=null){
        m.route.set("/home")
      }else{
        return SignUp
      }
    }
  }
})