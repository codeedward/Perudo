<template>
  <div id="board">
    <h1>{{ msg }}</h1>
    <div v-if="currentUser != null">Logged as: {{currentUser.email}}</div>
    <div><input v-on:click="logout" type="button" value="Log out"/></div>
    <div>
      <div v-bind:key="game.name" v-for="game in availableGames">
        <input type="button" :disabled="game.status == 2" v-on:click="joinTheGame(game.id)" :value="game.name+ ' ('+ game.players.length + ')'"/> 
      </div>
    </div>
    <div><input v-on:click="createNewGame" type="button" value="Create new"/></div>
  </div>
</template>

<script>
import firebase from 'firebase'
import {mapState} from 'vuex'
import { currentUser } from '../firebaseConfig.js';
const fb = require('../firebaseConfig.js')

export default {
  name: 'board',
  data () {
    return {
      msg: 'This is board component'
    }
  },
  computed:{
      ...mapState(['currentUser', 'availableGames'])
  },
  methods: {
      logout(){
          firebase.auth().signOut().then(()=>{
              this.$router.replace('login');
          });
      },
      fetchGames(){
          this.$store.dispatch('fetchAvailableGames');
      },
      joinTheGame(gameId){
        this.$store.dispatch('joinTheGame', {gameId: gameId})
        .then(data=>{
          this.$router.replace('game/'+ gameId);
        })
        .catch(err => {
            console.log(err)
        })
      },
      createNewGame(){
        this.$store.dispatch('createNewGame')
        .then((data)=>{
          this.$router.replace('game/'+ data.gameId);
        });
      }
  },
  mounted: function() {
    console.log("board mounted")
    this.fetchGames();    
  }
}
</script>

<style>

</style>
