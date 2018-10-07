import Vue from 'vue'
import App from './App.vue'
import {router} from './routerConfig'
import { store } from './store.js'
const fb = require('./firebaseConfig.js')

let app;

fb.auth.onAuthStateChanged(function(user){  
  if(!app)
  {
    app = new Vue({
      el: '#app',      
      store,
      router,
      render: h => h(App)
    })
  }

  if(user){
    store.dispatch('setCurrentUser', {user: user});
  }
})



