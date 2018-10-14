<template>
  <div id="game">
    <h1>{{ msg }}</h1>
    <div v-if="gameInstance && (gameInstance.status == 1 || gameInstance.status == 2)">
      <div>Name: {{ gameInstance.name }}</div>
      <div>Active player: {{ gameInstance.activePlayerNum }}</div>
      <div>Max dices: {{ gameInstance.maxDices }}</div>
      <div>Status: {{ gameInstance.status }}</div>
      <div>Players: {{ gameInstance.players.length }}</div>
    </div>

    <div v-if="gameInstance && gameInstance.status == 2">
      <div style="border:solid black 1px;">
        <br>
        <div :key="player.id" v-for="player in gameInstance.players">{{player.email}} [NR: {{player.playerNum}}] 
          <span :key="player.id+'_'+roll+'_'+index" v-for="(roll,index) in player.currentRoll">{{roll}}</span>
          <span>(quantity: {{player.betQuantity}}, number: {{player.betNumber}})</span>
          <span v-if="player.playerNum == gameInstance.activePlayerNum"> ----------------------------- Active player</span>
        </div>
         <br>
      </div>
      <div v-if="isActivePlayer">
        <input v-if="canPlaySpotOn" v-on:click="playSpotOn" type="button" value="Spot on"/>
        <input v-if="canPlayDoubtIt" v-on:click="playDoubtIt" type="button" value="I doubt it!"/>
        <input v-on:click="playYourBet" type="button" value="Make a bet!"/>
        Quantity:<input type="number" v-model="betQuantity"/>
        Number:<input type="number" v-model="betNumber"/>
      </div>
    </div>
    <div v-else>
      <div><input v-on:click="logout" type="button" value="Log out"/></div>
      <div><input v-if="isGameOwner" v-on:click="startTheGame" type="button" value="Start the game"/></div>
      <div style="border:solid grey 1px;">
        <br>
        <div :key="player.id" v-for="player in gameInstance.players">{{player.email}}</div>
         <br>
      </div>
    </div>
   
    <div v-if="currentUser != null">
      Logged as: {{currentUser.email}}
      <span v-if="isGameOwner">(owner)</span>
    </div>
    <div><input v-on:click="leaveTheGame" type="button" value="Leave the game"/></div>
    
  </div>
</template>

<script>
import firebase from 'firebase'
import {mapState} from 'vuex'
const fb = require('../firebaseConfig.js')

const betAction = 'bet'

export default {
  name: 'game',
  props: ['id'],
  data () {
    return {
      msg: 'Content',
      betQuantity: 0,
      betNumber: 0
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
    currentGameId (){
      return this.gameInstance ? this.gameInstance.id : null;
    },
    activePlayers(){
      return this.gameInstance.players.filter(el=> el.numOfDices > 0);
    },
    currentPlayer: function () {
        var currentPlayer = null;
        var players = this.gameInstance.players;
        if(players){
          currentPlayer = players.find((el)=> { 
              return el.id == this.currentUser.uid;
          });
        }
        return currentPlayer;
    },
    previousPlayer: function () {
        var players = this.activePlayers;
        var currentPlayerIndex = players.findIndex(x=> x.playerNum == this.currentPlayer.playerNum);
        var previousPlayerIndex = currentPlayerIndex - 1;
        if(previousPlayerIndex < 0){
          previousPlayerIndex = this.activePlayers.length - 1;
        }
        return players[previousPlayerIndex];
    },
    nextPlayer: function () {
        var players = this.activePlayers;
        var currentPlayerIndex = players.findIndex(x=> x.playerNum == this.currentPlayer.playerNum);
        console.log("currentPLayer index:"+currentPlayerIndex)
        var previousPlayerIndex = currentPlayerIndex + 1;
        if(previousPlayerIndex > (players.length-1)){
          previousPlayerIndex = 0;
        }
        return players[previousPlayerIndex];
    },
    isActivePlayer (){
      return this.gameInstance && this.currentPlayer ? (this.gameInstance.activePlayerNum == this.currentPlayer.playerNum) : false;
    },
    isGameOwner () {
      return (this.currentUser && this.gameInstance) ? (this.currentUser.uid == this.gameInstance.createdByUid) : false;
    },
    canPlayDoubtIt(){
      return this.previousPlayer.betType == betAction;
    },
    canPlaySpotOn(){
      return this.canPlayDoubtIt;
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
    },
    playSpotOn(){

    },
    playDoubtIt(){
      var previousPlayer = this.previousPlayer;
      var sumOfNumbers = this.countNumberInTheGame(previousPlayer.betNumber);
      if(sumOfNumbers > previousPlayer.betQuantity){
        alert("Bet was "+previousPlayer.betQuantity+"x"+previousPlayer.betNumber+". Previous player was right! You lost the dice! It was "+sumOfNumbers+" of them.");
      }
      else {
        alert("Bet was "+previousPlayer.betQuantity+"x"+previousPlayer.betNumber+". Previous player was wrong and lost the dice! It was "+sumOfNumbers+" of them.");
      }
    },
    playYourBet(){
      //chech if bet is correct
      this.$store.dispatch("setPlayerBet", {
        gameId: this.currentGameId,
        betType: betAction,
        betQuantity: this.betQuantity,
        betNumber: this.betNumber
      }).then(data => {
        console.log("before setActivePlayer");
        console.log(this.currentGameId);
        console.log(this.nextPlayer.playerNum);
        this.$store.dispatch("setActivePlayer", {
          gameId: this.currentGameId,
          activePlayerNum: this.nextPlayer.playerNum
        })
      });
      
      //active player change to next one
    },
    countNumberInTheGame(numberToCount){
      var sum = 0;
      var players = this.activePlayers;
      for(var i=0; i<players.length; i++){
        var player = players[i];
        sum+= player.currentRoll.filter(function(x){return x == numberToCount}).length;
      }
      return sum;
    },
    getPlayerByNum(playerNum){
        var result = null;
        var players = this.gameInstance.players;
        if(players){
          result = players.find((el)=> { 
              return el.playerNum == playerNum;
          });
        }
        return result;
    },
    getPlayerByUid(userUid){
        var result = null;
        var players = this.gameInstance.players;
        if(players){
          result = players.find((el)=> { 
              return el.id == userUid;
          });
        }
        return result;
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
