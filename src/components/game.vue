<template>
<div v-if="gameInstance" id="game">
  <v-app>
    <v-layout row wrap ma-3>
      <v-flex xs12 md4 lg5>
        <v-card>
          <v-toolbar dense color="light-blue" dark>
            <v-toolbar-title>Players</v-toolbar-title>
          </v-toolbar>
          <v-list two-line>
            <v-list-tile
              v-for="player in gameInstance.players"
              :key="player.email">
             
              <v-list-tile-action>
                <v-icon v-if="player.playerNum == gameInstance.activePlayerNum" color="pink">star</v-icon>
              </v-list-tile-action>
  
              <v-list-tile-content>
                <v-list-tile-title>
                  {{player.email}} 
                  <!-- <span v-if="isGameOwner">(owner)</span> -->
                </v-list-tile-title>
                 
                <v-list-tile-sub-title>
                </v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-avatar :key="'listPlayerDice_'+player.id+'_'+roll+'_'+index" v-for="(roll,index) in player.currentRoll">
                <!-- <img :src="getTheDice(roll).src"> -->
                  <img :src="getTheDice(0).src">
              </v-list-tile-avatar>
              <v-list-tile-action></v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
      <v-flex xs12 md5 lg5 offset-md1 offset-lg1>       
        <div v-if="(gameInstance.status == 1 )">
          <div>Name: {{ gameInstance.name }}</div>
          <div>Active player: {{ gameInstance.activePlayerNum }}</div>
          <div>Max dices: {{ gameInstance.maxDices }}</div>
          <div>Status: {{ gameInstance.status }}</div>
          <div>Players: {{ gameInstance.players.length }}</div>
        </div>
        <h1 v-if="!isStillInTheGame">Unfortunatelly you lost this time</h1>
        <h1 v-else-if="isTheWinner">Congratulatinos! You won the game!</h1>
        <div v-else-if="gameInstance.status == 2">
          <v-card v-if="currentPlayer != null">
              <v-toolbar color="light-blue" dark>
                <v-toolbar-title>Your roll</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon>
                  <v-icon>show dices</v-icon>
                </v-btn>
              </v-toolbar>
              <v-container fluid grid-list-lg>
                <v-layout row wrap>
                  <v-flex xs12>
                    <v-card-text class="text-md-center">
                      <img class="dice currentPlayerDice" :key="'currentPlayerDices_'+currentPlayer.id+'_'+roll+'_'+index" v-for="(roll,index) in currentPlayer.currentRoll" :src="getTheDice(roll).src">
                    </v-card-text>
                  </v-flex>
               </v-layout>
            </v-container>
          </v-card>
          <div v-if="isActivePlayer">
            <v-card>
                <v-toolbar color="red" dark>
                  <v-toolbar-title>Actions panel</v-toolbar-title>
                  <v-spacer></v-spacer>
                </v-toolbar>
                <v-container fluid grid-list-lg>
                  <v-layout row wrap>
                    <v-flex xs12 class="text-md-center">
                      <v-btn v-if="canPlaySpotOn" v-on:click="playSpotOn">Spot on</v-btn>
                      <v-btn v-if="canPlayDoubtIt" v-on:click="playDoubtIt">I doubt it!</v-btn>
                      <v-btn v-bind:color="betType == 'bet' ? 'light-blue': ''" v-on:click="selectYourBet('bet')" type="button">Make a bet!</v-btn>                   
                    </v-flex>
                    <v-flex xs12 class="text-md-center">
                      <div v-if="betType != null">
                        <h2>Select dice:</h2>
                        <img class="dice currentPlayerDice" :key="'selectRoll_'+num" v-for="num in selectNumberOptions"  v-bind:class="betNumber == num ? 'selectedDice': ''" :src="getTheDice(num).src" v-on:click="selectDice(num)">
                      </div>
                    </v-flex>
                      <v-flex xs12 class="text-md-center">
                        <div v-if="betNumber != null && betNumber > 0">
                          <h2>Type minimum quantity:</h2> 
                          <v-text-field type="number" v-model="betQuantity"/>
                          <v-spacer></v-spacer> 
                          <v-btn v-on:click="playYourBet" type="button">Play your move!</v-btn>    
                        </div>
                    </v-flex>
                </v-layout>
              </v-container>
            </v-card>
           
          </div>  
        </div>
        <div v-else>
          <v-btn v-if="isGameOwner" v-on:click="startTheGame">Start the game</v-btn>
       </div>
      </v-flex>
    </v-layout>
  </v-app>
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
      betType: null,
      betQuantity: null,
      betNumber: null,
      selectNumberOptions: [1,2,3,4,5,6]
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
    },
    isStillInTheGame () {
      return (this.currentPlayer && this.gameInstance && this.gameInstance.status == 2) ? (this.currentPlayer.numOfDices > 0) : true;
    },
    isTheWinner () {
      return this.gameInstance.status != 1 && this.activePlayers.length == 1 && this.currentPlayer.numOfDices > 0;
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
      var previousPlayer = this.previousPlayer;
      var sumOfNumbers = this.countNumberInTheGame(previousPlayer.betNumber);
      if(sumOfNumbers == previousPlayer.betQuantity){
        alert("Spot on! You won the dice!")
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.currentPlayer.id,
          livesChange: 1,
          nextRoundActivePlayerNum: this.currentPlayer.playerNum
        })
        this.clearSelections();
      }
      else {
        alert("Bet was "+previousPlayer.betQuantity+"x"+previousPlayer.betNumber+". Unfortunatelly you lost the dice! It was "+sumOfNumbers+" of them.");
        var nextRoundActivePlayerNum = this.currentPlayer.playerNum;
        if(this.currentPlayer.numOfDices < 2) {
          nextRoundActivePlayerNum = this.nextPlayer.playerNum;
        }
        
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.currentPlayer.id,
          livesChange: -1,
          nextRoundActivePlayerNum: nextRoundActivePlayerNum
        })
      }
    },
    playDoubtIt(){
      var previousPlayer = this.previousPlayer;
      var sumOfNumbers = this.countNumberInTheGame(previousPlayer.betNumber);
      if(sumOfNumbers >= previousPlayer.betQuantity){
        alert("Bet was "+previousPlayer.betQuantity+"x"+previousPlayer.betNumber+". Previous player was right! You lost the dice! It was "+sumOfNumbers+" of them.");
        var nextRoundActivePlayerNum = this.currentPlayer.playerNum;
        if(this.currentPlayer.numOfDices < 2) {
          nextRoundActivePlayerNum = this.nextPlayer.playerNum;
        }
        
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.currentPlayer.id,
          livesChange: -1,
          nextRoundActivePlayerNum: nextRoundActivePlayerNum
        })
        this.clearSelections();
      }
      else {
        alert("Bet was "+previousPlayer.betQuantity+"x"+previousPlayer.betNumber+". Previous player was wrong and lost the dice! It was "+sumOfNumbers+" of them.");
        var nextRoundActivePlayerNum = this.previousPlayer.playerNum;
        if(this.previousPlayer.numOfDices < 2) {
          nextRoundActivePlayerNum = this.currentPlayer.playerNum;
        }
        
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.previousPlayer.id,
          livesChange: -1,
          nextRoundActivePlayerNum: nextRoundActivePlayerNum
        })
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
        this.$store.dispatch("setActivePlayer", {
          gameId: this.currentGameId,
          activePlayerNum: this.nextPlayer.playerNum
        })
      });
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
    },
    getTheDice(diceNum){
      var dices = [
          {num: 0 , src: "https://www.awesomedice.com/image/cache/data/blank-dice-black-d6-600x600.jpg"},
          {num: 1 , src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQci5vAyvtWvp2qZ9e4CYWQlA7Up4Nkp7Fsjmbhd8mTKBzeGifv3A"},
          {num: 2 , src: "https://thefiveplanets.org/b01/data/graphics/textures/dice/face2.jpg"},
          {num: 3 , src: "https://image.freepik.com/icones-gratis/cubo-dados-da-vista-superior-na-face-com-tres-pontos_318-59490.jpg"},
          {num: 4 , src: "http://shopforclipart.com/images/width-cliparts/27.jpg"},
          {num: 5 , src: "https://carwad.net/sites/default/files/dice-face-106625-1911445.png"},
          {num: 6 , src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Dice-6-b.svg/1024px-Dice-6-b.svg.png"}
        ];
      var foundedDice = dices.find(x => x.num == diceNum);
      return foundedDice;
    },
    selectYourBet(betType){
      this.betType = betType;
    },
    selectDice(betNumber){
      this.betNumber = betNumber;
    },
    clearSelections(){
      this.betType = null;
      this.betQuantity = null;
      this.betNumber = null;
    }
  },
  mounted: function() {
    console.log("game mounted")
    this.init();
  },
  watch: {
    isActivePlayer: function () {
      this.clearSelections();
    }
  },
}
</script>

<style>
.dice{
  margin: 5px;
}
.currentPlayerDice{
  width: 100px;
}
.selectedDice{
  border: 4px solid dodgerblue;
}
</style>