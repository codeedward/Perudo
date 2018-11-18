<template>
  <div id="registration">
      <v-content>
        <v-container fluid fill-height>
          <v-layout align-center justify-center>
            <v-flex xs12 sm8 md4>
              <v-card class="elevation-12">
                <v-toolbar dark color="primary">
                  <v-toolbar-title>Registration form</v-toolbar-title>
                  <v-spacer></v-spacer>
                </v-toolbar>
                <v-card-text>
                  <v-form>
                    <v-text-field v-model="login" prepend-icon="person" name="login" label="Login" type="text"></v-text-field>
                    <v-text-field v-model="password" prepend-icon="lock" name="password" label="Password" id="password" type="password"></v-text-field>
                  </v-form>
                </v-card-text>
                <v-card-actions>
                  <router-link to="/login">Go back to login</router-link>
                  <v-spacer></v-spacer>
                  <v-btn v-on:click="signUp" color="primary">Create user</v-btn>
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
  name: 'registration',
  data () {
    return {
      login: '',
      password: ''
    }
  },
  methods: {
      signUp: function(){
          firebase.auth().createUserWithEmailAndPassword(this.login,this.password)
          .then(
              (user) =>
              {
                  this.$router.replace('login');
              },
              (err) =>
              {
                  alert('Error: '+ err.message);
              }
          );
      }
  }
}
</script>

<style>

</style>
