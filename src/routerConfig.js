import Vue from 'vue'
import VueRouter from 'vue-router'
import firebase from 'firebase'

import Login from "./components/login.vue";
import Board from "./components/board.vue";
import Game from "./components/game.vue";
import Registration from "./components/registration.vue";

Vue.use(VueRouter)

const routes = [
    { path: '/login', component: Login },
    { path: '/board', component: Board, meta: { requiresAuth: true} },
    { path: '/game/:id', component: Game, meta: { requiresAuth: true} },
    { path: '/register', component: Registration },
    { path: '*', redirect: '/login'}
  ]
  
  export const router = new VueRouter({
    routes // short for `routes: routes`
  })

  router.beforeEach((to, from, next)=>{
    let currentUser = firebase.auth().currentUser;
    let requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if(requiresAuth && !currentUser) next('/login')
    else if(!requiresAuth && currentUser) next('/board')
    else next()
})