<template>
  <div id="game">
    <h1>{{ msg }}</h1>
    <div v-if="gameInstance && gameInstance.status == 2">
      <div>Name: {{ gameInstance.name }}</div>
      <div>Active player: {{ gameInstance.activePlayer }}</div>
      <div>Max dices: {{ gameInstance.maxDices }}</div>
      <div>Status: {{ gameInstance.status }}</div>
      <div>Players: {{ gameInstance.players.length }}</div>
      <ul style="border:solid black 1px;">
        <li :key="player.id" v-for="player in gameInstance.players">{{player.email}} [NR: {{player.playerNum}}]</li>
      </ul>
    </div>

    <div v-else>
      <div><input v-on:click="logout" type="button" value="Log out"/></div>
      <div><input v-if="isGameOwner" v-on:click="startTheGame" type="button" value="Start the game"/></div>
    </div>
   
    <div v-if="currentUser != null">Logged as: {{currentUser.email}}</div>
    <div><input v-on:click="leaveTheGame" type="button" value="Leave the game"/></div>
    
  </div>
</template>

<script>
import firebase from 'firebase'
import {mapState} from 'vuex'
const fb = require('../firebaseConfig.js')

export default {
  name: 'game',
  props: ['id'],
  data () {
    return {
      msg: 'Content'
    }
  },
  computed:{
    ...mapState(['currentUser', 'availableGames']),
    gameInstance: function () {
        var currentGame = null;
        var availableGames = this.$store.state.availableGames;
        if(availableGames){
          currentGame = this.$store.state.availableGames.find((el)=> { 
              return el.id == this.$route.params.id
          });
          if(!currentGame) {
            this.$router.replace("/board");
          }
        }
        return currentGame;
    },
    isGameOwner () {
      return (this.currentUser && this.gameInstance) ? (this.currentUser.uid == this.gameInstance.createdByUid) : false;
    },
    currentGameId (){
      return this.gameInstance ? this.gameInstance.id : null;
    }
  },
  methods: {
    logout(){
        fb.auth.signOut().then(()=>{
            this.$router.replace('login');
        });
    },
    fetchGames(){
        this.$store.dispatch('fetchAvailableGames');
    },
    leaveTheGame() {
        this.$store.dispatch('leaveTheGame', {gameId: this.gameInstance.id, createdByUid: this.gameInstance.createdByUid})
        .then(data => {
            this.$router.replace('/board');
        })
        .catch(err => {
            console.log(err)
        })
    },
    startTheGame() {
      if(this.currentGameId) {
        this.$store.dispatch("startGame", {gameId: this.currentGameId, status: 2});
      }
    },
    init(){
      if(!this.$store.state.availableGames){
        this.fetchGames();
      }
    }
  },
  mounted: function() {
    console.log("game mounted")
    this.init();
  }
}
</script>

<style>

</style>
