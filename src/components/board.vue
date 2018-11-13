<template>
  <div id="board">
    <v-app>
      <v-layout row wrap>
        <v-flex xs12 sm6 offset-sm3 mt-2>
          <v-btn color="light-blue" dark v-on:click="createNewGame" type="button">Create new game</v-btn>
        </v-flex>
        <v-flex xs12 sm6 offset-sm3 mt-2>
          <v-card>
            <v-toolbar color="light-blue" dark>
              <v-spacer></v-spacer>
                <v-toolbar-title>List of current games</v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
    
            <v-list two-line subheader>
              <v-subheader class="subheaderItem" inset>You are already in:</v-subheader>
              <!-- <v-divider inset></v-divider> -->
              <v-list-tile
                v-for="game in userGames"
                :key="game.name"
                avatar
                v-on:click="joinTheGame(game.id)"
              >
                <v-list-tile-avatar>
                  <v-icon>person</v-icon>
                </v-list-tile-avatar>
    
                <v-list-tile-content>
                  <v-list-tile-title>{{ game.name }} {{game.status == 2? "(in progress)" : ""}}</v-list-tile-title>
                  <v-list-tile-sub-title>Created at: {{moment(game.createdOn).format('YYYY-MM-DD HH:MM')}}</v-list-tile-sub-title>
                </v-list-tile-content>

                 <v-icon color="grey lighten-1">person</v-icon>
                  {{game.players.length}}
                <!-- <v-list-tile-action>
                  <v-btn icon ripple>
                    <v-icon color="grey lighten-1">person</v-icon>
                    {{game.players.length}}
                  </v-btn>
                </v-list-tile-action> -->
              </v-list-tile>
    
              <v-divider inset></v-divider>
              <v-subheader class="subheaderItem" inset>New games waiting for you to join:</v-subheader>
              <!-- <v-divider inset></v-divider> -->

               <v-list-tile
                v-for="game in availableToJoinGames"
                :key="game.name"
                avatar
                v-on:click="joinTheGame(game.id)"
              >
                <v-list-tile-avatar>
                  <v-icon>forward</v-icon>
                </v-list-tile-avatar>
    
                <v-list-tile-content>
                  <v-list-tile-title>{{ game.name }}</v-list-tile-title>
                  <v-list-tile-sub-title>Created at: {{moment(game.createdOn).format('YYYY-MM-DD HH:MM')}}</v-list-tile-sub-title>
                </v-list-tile-content>

                 <v-icon color="grey lighten-1">person</v-icon>
                  {{game.players.length}}
                <!-- <v-list-tile-action>
                  <v-btn icon ripple>
                    <v-icon color="grey lighten-1">person</v-icon>
                    {{game.players.length}}
                  </v-btn>
                </v-list-tile-action> -->
              </v-list-tile>
            </v-list>
          </v-card>
        </v-flex>
      </v-layout>
    </v-app>
  </div>
</template>

<script>
import firebase from 'firebase'
import {mapState} from 'vuex'
import { mapGetters } from 'vuex'
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
      ...mapState(['currentUser']),
      ...mapGetters(['userGames', 'availableToJoinGames'])
  },
  methods: {
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
.subheaderItem{

  color:#03a9f4!important;
}
</style>
