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
            <v-list-tile v-bind:class="player.id == currentPlayer.id ? 'currentPlayerOnTheList' : ''"
              v-for="player in gameInstance.players"
              :key="player.email">
             
              <v-list-tile-action>
                <v-icon v-if="player.playerNum == gameInstance.activePlayerNum" color="pink">star</v-icon>
              </v-list-tile-action>
  
              <v-list-tile-content>
                <v-list-tile-title>
                  {{player.email}} 
                  <!-- <span v-if="isGameOwner">(owner)</span> -->
                  <template v-if="gameInstance.status == 2 && player.betNumber != ''">
                    [
                    <span>{{player.betQuantity}} x </span>
                    <img style="position: relative; top: 3px" width="22px" :src="getTheDice(player.betNumber).src">
                    ]
                  </template>
                </v-list-tile-title>

                <v-list-tile-sub-title>
                </v-list-tile-sub-title>
              </v-list-tile-content>

              <v-list-tile-avatar tile :key="'listPlayerDice_'+player.id+'_'+roll+'_'+index" v-for="(roll,index) in player.currentRoll">
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
        <h1 v-if="isLostTheGame">Unfortunatelly you lost this time</h1>
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
                      <h3 v-if="previousPlayer.betNumber > 0">Current bet: {{previousPlayer.betQuantity}} x <img style="position: relative; top: 10px" width="40px" :src="getTheDice(previousPlayer.betNumber).src" left></h3>
                    </v-flex>
                    <v-flex xs12 class="text-md-center">
                      <v-btn v-if="canPlaySpotOn" v-on:click="playSpotOn">Spot on</v-btn>
                      <v-btn v-if="canPlayDoubtIt" v-on:click="playDoubtIt">I doubt it!</v-btn>
                      <v-btn v-bind:color="betType == 'bet' ? 'light-blue': ''" v-on:click="selectYourBet('bet')" type="button">Make a bet!</v-btn>                   
                    </v-flex>
                    <v-flex xs12 class="text-md-center">
                      <div v-if="betType != null">
                        <h2>Select dice:</h2>
                        <img class="dice currentPlayerDice" :key="'selectRoll_'+num" v-for="num in selectNumberOptions" v-bind:class="betNumber == num ? 'selectedDice': ''" :src="getTheDice(num).src" v-on:click="selectDice(num)">
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
    isLostTheGame () {
      return (this.currentPlayer && this.gameInstance && this.gameInstance.status > 1) ? (this.currentPlayer.numOfDices <= 0) : false;
    },
    isTheWinner () {
      var thereIsAWinnerAlready = this.gameInstance && this.gameInstance.status != 1 && this.activePlayers.length == 1 && this.currentPlayer && this.currentPlayer.numOfDices > 0;
      if(thereIsAWinnerAlready){
        this.$store.dispatch('changeGameStatus',  {gameId: this.gameInstance.id, status: 3});
      }      
      return thereIsAWinnerAlready;
    },
    isStartOfNewRound(){
      return this.gameInstance ? this.gameInstance.isStartOfNewRound : false;
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
          nextRoundActivePlayerNum: this.currentPlayer.playerNum,
          finishedRoundReasonText: "Ahh, nice one, player ["+ this.currentPlayer.email +"] spotted on and WON the dice. \n" + 
          "It was exactly " + previousPlayer.betQuantity +"x["+ previousPlayer.betNumber + "]"
        })
        this.clearSelections();
      }
      else {
        var reasonText = "Bet was "+ previousPlayer.betQuantity +"x["+ previousPlayer.betNumber +"]. However it was "+ sumOfNumbers +" of them.";
        alert("Sorry, you LOST the dice. \n" + reasonText);
        var nextRoundActivePlayerNum = this.currentPlayer.playerNum;
        if(this.currentPlayer.numOfDices < 2) {
          nextRoundActivePlayerNum = this.nextPlayer.playerNum;
        }
        
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.currentPlayer.id,
          livesChange: -1,
          nextRoundActivePlayerNum: nextRoundActivePlayerNum,
          finishedRoundReasonText: "Good! Player ["+ this.currentPlayer.email +"] was tried to spot on. Fortunetelly he LOST the dice. \n" + reasonText
        })
      }
    },
    playDoubtIt(){
      var previousPlayer = this.previousPlayer;
      var sumOfNumbers = this.countNumberInTheGame(previousPlayer.betNumber);
      var reasonText = "Bet was "+ previousPlayer.betQuantity +"x["+ previousPlayer.betNumber +"]. However it was "+ sumOfNumbers +" of them.";

      if(sumOfNumbers >= previousPlayer.betQuantity){
        alert("Sorry, previous player was right. You LOST the dice. \n" + reasonText);
        var nextRoundActivePlayerNum = this.currentPlayer.playerNum;
        if(this.currentPlayer.numOfDices < 2) {
          nextRoundActivePlayerNum = this.nextPlayer.playerNum;
        }
        
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.currentPlayer.id,
          livesChange: -1,
          nextRoundActivePlayerNum: nextRoundActivePlayerNum,
          finishedRoundReasonText: "Good! Player ["+ this.currentPlayer.email +"] doubted and LOST the dice. \n" + reasonText
        })
        this.clearSelections();
      }
      else {
        alert("Good! Previous player was wrong and LOST the dice! \n" + reasonText);
        var nextRoundActivePlayerNum = this.previousPlayer.playerNum;
        if(this.previousPlayer.numOfDices < 2) {
          nextRoundActivePlayerNum = this.currentPlayer.playerNum;
        }
        
        this.$store.dispatch("finishRound", {
          gameId: this.currentGameId,
          playerToChangeLivesId: this.previousPlayer.id,
          livesChange: -1,
          nextRoundActivePlayerNum: nextRoundActivePlayerNum,
          finishedRoundReasonText: "Sorry, player ["+ this.currentPlayer.email +"] doubted correctly. You LOST the dice. \n" + reasonText
        })
      }
    },
    playYourBet(){
      var minimumQuantityForThisNumber = this.getMinimumPossibleBetForCurrentRollSelected();
      if(this.betQuantity >= minimumQuantityForThisNumber){
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
      }
      else {
        alert("Wrong bet. Please checkout and correct it.");
      }
    },
    countNumberInTheGame(numberToCount){
      var sum = 0;
      var players = this.activePlayers;
      for(var i=0; i < players.length; i++){
        var player = players[i];
        sum+= player.currentRoll.filter(function(x){return x == numberToCount || x == 1}).length;
      }
      return sum;
    },
    getMinimumPossibleBetForCurrentRollSelected(){
      var players = this.gameInstance.players;
      var result = 0;
      if(!this.previousPlayer.betNumber) { 
        result = 1;
      }
      else if(this.betNumber == this.previousPlayer.betNumber){
        result = parseInt(this.previousPlayer.betQuantity) + 1;
      }
      else if(this.betNumber == 1){
        var calculatedBetQuantity = Math.ceil(parseInt(this.previousPlayer.betQuantity)/2);
        var didWeHaveThisBetBefore = players.find((x)=>{
          return ((x.betNumber == this.betNumber && x.betQuantity == calculatedBetQuantity) || (x.betNumber == 1 && x.betQuantity == calculatedBetQuantity))
          });
        if(didWeHaveThisBetBefore) {
          calculatedBetQuantity++;
        }
        result = calculatedBetQuantity;
      }
      else if(this.previousPlayer.betNumber == 1){
        var calculatedBetQuantity = parseInt(this.previousPlayer.betQuantity) * 2;
        var didWeHaveThisBetBefore = players.find((x)=>{ return (x.betNumber >= this.betNumber && x.betQuantity == calculatedBetQuantity)});
        if(didWeHaveThisBetBefore) {
          calculatedBetQuantity++;
        }
        result = calculatedBetQuantity;
      }
      else if(this.betNumber > this.previousPlayer.betNumber) {
        result = this.previousPlayer.betQuantity;
      }
      else {
        result = parseInt(this.previousPlayer.betQuantity) + 1;
      }
      return result;
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
          {num: 0 , src: "./src/assets/dices/0.png"},
          {num: 1 , src: "./src/assets/dices/1.png"},
          {num: 2 , src: "./src/assets/dices/2.png"},
          {num: 3 , src: "./src/assets/dices/3.png"},
          {num: 4 , src: "./src/assets/dices/4.png"},
          {num: 5 , src: "./src/assets/dices/5.png"},
          {num: 6 , src: "./src/assets/dices/6.png"}
        ];
      var foundedDice = dices.find(x => x.num == diceNum);
      return foundedDice;
    },
    selectYourBet(betType){
      this.betType = betType;
    },
    selectDice(betNumber){
      this.betNumber = betNumber;
      this.betQuantity = this.getMinimumPossibleBetForCurrentRollSelected();
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
    },
    isStartOfNewRound: function() {      
      var self = this;
      // console.log("check isStartOfNewRound",self.gameInstance, self.currentPlayer, this.currentUser.uid);
      // if(self.gameInstance && self.currentPlayer)
      // {
      //   console.log("variables:", self.gameInstance.isStartOfNewRound, self.currentPlayer.id != self.gameInstance.finishedRoundUserId, self.currentPlayer.id, self.gameInstance.finishedRoundUserId);
      // }

      setTimeout(()=>{
        if(self.gameInstance && 
          self.currentPlayer && 
          self.gameInstance.isStartOfNewRound && 
          self.gameInstance.finishedRoundUserId != self.currentUser.uid){
            //console.log("isStartOfNewRound");
            alert(self.gameInstance.finishedRoundReasonText);
          }
      }, 500);
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
.currentPlayerOnTheList{
  background-color:lightskyblue;
}
</style>