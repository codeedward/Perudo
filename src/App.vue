<template>
    <v-app id="app" >
      <v-toolbar dark color="primary">
        <v-toolbar-title>Perudo</v-toolbar-title>
          <v-spacer></v-spacer>
         <v-toolbar-title v-if="currentUser">
          <v-icon left>person</v-icon> {{currentUser.email}}
         </v-toolbar-title>
        <v-spacer></v-spacer>
    
        <v-toolbar-items>
          <v-btn flat v-if="currentUser" to="/board">Board</v-btn>
          <v-btn flat v-if="currentUser" v-on:click="logout">
            <v-icon left>exit_to_app</v-icon>
             Logout
          </v-btn>
        
        </v-toolbar-items>
      </v-toolbar>
      <router-view></router-view>
    </v-app>
</template>

<script>
import {mapState} from 'vuex'
import firebase from 'firebase'
export default {
  name: 'app',
  data () {
    return {
    }
  },
  computed:{
    ...mapState(['currentUser']),
  },
  methods: {
    logout(){
        firebase.auth().signOut().then(()=>{
           this.$store.dispatch('setCurrentUser', {user: null}).then(()=>{
              this.$router.replace('login');
            });
           
        });
    }
  }
}
</script>

<style>
/* #app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
} */
</style>
