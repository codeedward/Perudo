<template>
  <div id="login">
      <v-content>
        <v-container fluid fill-height>
          <v-layout align-center justify-center>
            <v-flex xs12 sm8 md4>
              <v-card class="elevation-12">
                <v-toolbar dark color="primary">
                  <v-toolbar-title>Login form</v-toolbar-title>
                  <v-spacer></v-spacer>
                </v-toolbar>
                <v-card-text>
                  <v-form>
                    <v-text-field v-model="login" prepend-icon="person" name="login" label="Login" type="text"></v-text-field>
                    <v-text-field v-model="password" prepend-icon="lock" name="password" label="Password" id="password" type="password"></v-text-field>
                  </v-form>
                </v-card-text>
                <v-card-actions>
                    <router-link to="/register">Register</router-link>
                  <v-spacer></v-spacer>
                  <v-btn v-on:click="signIn" color="primary">Login</v-btn>
                </v-card-actions>
              </v-card>
            </v-flex>
          </v-layout>
        </v-container>
      </v-content>
  </div>
</template>

<script>
import firebase from 'firebase'
export default {
  name: 'login',
  data () {
    return {
      login: '',
      password: ''
    }
  },
  methods: {
      signIn: function(){
          firebase.auth().signInWithEmailAndPassword(this.login,this.password)
          .then(
              (user) =>
              {
                  this.$store.dispatch('setCurrentUser', {user: user.user}).then(()=>{
                    this.$router.replace('/board');
                  });
              },
              (err) =>
              {
                  alert('Error: '+ err.message);
              }
          );
      }
  },
  mounted: function(){
    console.log("login mounted")
  }
}
</script>

<style>

</style>
